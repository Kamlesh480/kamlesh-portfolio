/* ============================================================
   CHARCOAL PLAYGROUND  v4
   Browse mode = default (window pointerdown ignored).
   Draw mode   = opt-in (window pointerdown draws on canvas).

   Event routing: all pointer events go through window listeners.
   The toolbar is NEVER blocked — we check event.target ancestry
   before drawing. In draw mode, CSS sets pointer-events:none on
   page content (links, hero text) so accidental navigation cannot
   happen, and the toolbar stays pointer-events:auto.
   ============================================================ */

(function () {
  "use strict";

  /* ---- grain brush masks ---- */
  function rand() { return Math.random(); }
  function makeBrushMask(size, hardness) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    if (hardness >= 1) {
      g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(0.6,"rgba(0,0,0,0.95)");
      g.addColorStop(0.9,"rgba(0,0,0,0.4)"); g.addColorStop(1,"rgba(0,0,0,0)");
    } else if (hardness >= 0.5) {
      g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(0.5,"rgba(0,0,0,0.82)");
      g.addColorStop(0.85,"rgba(0,0,0,0.28)"); g.addColorStop(1,"rgba(0,0,0,0)");
    } else {
      g.addColorStop(0,"rgba(0,0,0,0.92)"); g.addColorStop(0.45,"rgba(0,0,0,0.5)");
      g.addColorStop(1,"rgba(0,0,0,0)");
    }
    x.fillStyle = g; x.fillRect(0,0,size,size);
    x.globalCompositeOperation = "destination-out";
    const n = Math.floor(size*size*(hardness>=1?0.14:hardness>=0.5?0.20:0.26));
    for (let i=0;i<n;i++) {
      x.globalAlpha=rand()*0.6; x.beginPath();
      x.arc(rand()*size,rand()*size,rand()*1.6,0,7); x.fill();
    }
    return c;
  }
  function tint(mask,r,g,b) {
    const c=document.createElement("canvas"); c.width=mask.width; c.height=mask.height;
    const x=c.getContext("2d");
    x.fillStyle="rgb("+r+","+g+","+b+")"; x.fillRect(0,0,c.width,c.height);
    x.globalCompositeOperation="destination-in"; x.drawImage(mask,0,0); return c;
  }

  function Playground(opts) {
    const canvas  = opts.canvas;
    const fx      = opts.fx;
    const toolbar = opts.toolbar;
    // The draw zone: a fixed div covering only the inner drawable region.
    // Reserved strips around it (top/right/bottom) belong to the UI.
    const overlay = opts.overlay || document.getElementById("drawOverlay");
    const ctx     = canvas.getContext("2d");
    const fxc     = fx.getContext("2d");

    let dpr=1, W=0, H=0;
    let drawMode = false;
    let tool     = "soft";
    let sizeScale = 1.0;   // brush size multiplier: 0.3 (tiny) → 3.0 (huge)
    let hasMarks = false;
    let lastDraw = performance.now();

    /* ---- brushes ---- */
    const maskSoft  = makeBrushMask(72,0);
    const maskMed   = makeBrushMask(72,0.5);
    const maskHard  = makeBrushMask(64,1);
    const tones     = [[22,20,17],[38,35,30],[12,11,9]];
    const brushes   = {
      soft : tones.map(t=>tint(maskSoft,t[0],t[1],t[2])),
      med  : tones.map(t=>tint(maskMed, t[0],t[1],t[2])),
      hard : tones.map(t=>tint(maskHard,t[0],t[1],t[2])),
    };
    const smudgeMask = makeBrushMask(64,0);
    const tmp=document.createElement("canvas");
    const tmpc=tmp.getContext("2d");

    /* tool configs */
    const TOOLS = {
      pencil: { brush:"hard", size:3.4,  alpha:0.55, spacing:0.28, jit:0.5,  speedThin:0.70, dust:0.04 },
      soft:   { brush:"soft", size:24,   alpha:0.14, spacing:0.16, jit:2.6,  speedThin:0.50, dust:0.45 },
      heavy:  { brush:"med",  size:14,   alpha:0.32, spacing:0.18, jit:1.4,  speedThin:0.30, dust:0.20 },
      smudge: { size:30 },
      eraser: { brush:"soft", size:30,   alpha:0.42, spacing:0.22, jit:1.0 },
    };

    /* ---- resize ---- */
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio||1);
      W=window.innerWidth; H=window.innerHeight;
      let snap=null;
      if (canvas.width) {
        snap=document.createElement("canvas"); snap.width=canvas.width; snap.height=canvas.height;
        snap.getContext("2d").drawImage(canvas,0,0);
      }
      canvas.width=W*dpr; canvas.height=H*dpr;
      fx.width=W*dpr; fx.height=H*dpr;
      if (snap) ctx.drawImage(snap,0,0);
    }

    /* ---- particles ---- */
    const parts=[];
    function spawn(x,y,kind) {
      const light=(kind==="fiber");
      parts.push({x,y,
        vx:(rand()-0.5)*0.5*dpr, vy:(kind==="dust"?0.2+rand()*0.5:(rand()-0.5)*0.4)*dpr,
        life:0, max:40+rand()*60, r:(light?0.6+rand()*1.0:0.5+rand()*1.6)*dpr,
        light, a:light?0.5:0.28+rand()*0.3,
      });
      if (parts.length>600) parts.splice(0,parts.length-600);
    }

    /* ---- drawing ---- */
    let lastX=0, lastY=0, lastT=0, drawing=false;

    function stampLine(x0,y0,x1,y1,speed) {
      const cfg=TOOLS[tool];
      const erase=(tool==="eraser");
      ctx.globalCompositeOperation=erase?"destination-out":"source-over";
      const dx=x1-x0, dy=y1-y0, dist=Math.hypot(dx,dy)||0.001;
      const base=cfg.size*sizeScale*dpr;
      const sp=Math.min(1,speed/(2.2*dpr));
      const wMul=1-sp*(cfg.speedThin||0.5);
      const step=Math.max(1,base*cfg.spacing);
      for (let d=0;d<dist;d+=step) {
        const t=d/dist;
        const sz=base*wMul*(0.78+rand()*0.5);
        const x=x0+dx*t+(rand()-0.5)*cfg.jit*dpr;
        const y=y0+dy*t+(rand()-0.5)*cfg.jit*dpr;
        const set=brushes[cfg.brush];
        const img=erase?maskSoft:set[(rand()*set.length)|0];
        ctx.globalAlpha=cfg.alpha*(0.6+rand()*0.7)*(1-sp*0.35);
        ctx.drawImage(img,x-sz/2,y-sz/2,sz,sz);
        if (!erase && cfg.dust && rand()<cfg.dust*0.25) spawn(x,y+sz*0.3,"dust");
        if (erase && rand()<0.15) spawn(x,y,"fiber");
      }
      ctx.globalAlpha=1; ctx.globalCompositeOperation="source-over";
      hasMarks=true;
    }

    function smudge(x0,y0,x1,y1) {
      const r=TOOLS.smudge.size*sizeScale*dpr;
      tmp.width=tmp.height=r*2;
      const dx=x1-x0, dy=y1-y0, dist=Math.hypot(dx,dy)||0.001;
      const step=Math.max(2,r*0.35);
      for (let d=0;d<dist;d+=step) {
        const t=d/dist;
        const x=x0+dx*t, y=y0+dy*t;
        const sx=x-dx/dist*r*0.25, sy=y-dy/dist*r*0.25;
        tmpc.clearRect(0,0,r*2,r*2);
        tmpc.globalCompositeOperation="source-over";
        tmpc.drawImage(canvas,sx-r,sy-r,r*2,r*2,0,0,r*2,r*2);
        tmpc.globalCompositeOperation="destination-in";
        tmpc.drawImage(smudgeMask,0,0,r*2,r*2);
        ctx.globalAlpha=0.55; ctx.drawImage(tmp,x-r,y-r,r*2,r*2);
        if (rand()<0.2) spawn(x,y,"dust");
      }
      ctx.globalAlpha=1; hasMarks=true;
    }

    /* ---- mini floating palette (right-click in draw mode) ---- */
    const miniPal = (function(){
      const p=document.createElement('div');
      p.id='miniPalette'; p.className='mini-palette';
      p.innerHTML=
        '<div class="mp-title">tools</div>'+
        '<button class="mp-btn" data-tool="pencil" title="Fine Pencil">'+
          '<svg class="mp-icon" viewBox="0 0 24 24"><path d="M6 19 L16 4"/><path d="M14 6 L18 4 L20 8 L10 22 Z"/></svg>'+
          '<span class="mp-key">1</span></button>'+
        '<button class="mp-btn" data-tool="soft" title="Soft Charcoal">'+
          '<svg class="mp-icon" viewBox="0 0 24 24"><path d="M4 20 L9 7 L13 7 L19 20" stroke-width="2.5"/><path d="M6 16 L16 16"/></svg>'+
          '<span class="mp-key">2</span></button>'+
        '<button class="mp-btn" data-tool="heavy" title="Heavy Charcoal">'+
          '<svg class="mp-icon" viewBox="0 0 24 24"><path d="M3 20 L9 5 L15 5 L20 20" stroke-width="4"/><path d="M5.5 15 L17.5 15"/></svg>'+
          '<span class="mp-key">3</span></button>'+
        '<button class="mp-btn" data-tool="smudge" title="Smudge">'+
          '<svg class="mp-icon" viewBox="0 0 24 24"><path d="M5 14 C8 8,17 8,19 14 C21 19,14 21,12 17"/><path d="M8 16 C9 13,15 12,16 16"/></svg>'+
          '<span class="mp-key">4</span></button>'+
        '<button class="mp-btn" data-tool="eraser" title="Eraser">'+
          '<svg class="mp-icon" viewBox="0 0 24 24"><rect x="4" y="13" width="16" height="7" rx="1"/><path d="M8 13 L13 5 L20 9 L15 13"/></svg>'+
          '<span class="mp-key">E</span></button>'+
        '<div class="mp-sep"></div>'+
        '<div class="mp-size"><div class="mp-size-ring" id="mpSizeRing"></div>'+
        '<span class="mp-hint">scroll · [ ]</span></div>';
      document.body.appendChild(p);
      return p;
    })();

    function syncPalActive(){
      [].forEach.call(miniPal.querySelectorAll('.mp-btn'),function(b){
        b.classList.toggle('active',b.dataset.tool===tool);
      });
    }
    function updateSizeRing(){
      var r=document.getElementById('mpSizeRing'); if(!r)return;
      var d=Math.round(18*sizeScale);
      r.style.width=d+'px'; r.style.height=d+'px';
    }
    function showMiniPal(x,y){
      var pw=64,ph=300;
      miniPal.style.left=Math.max(8,Math.min(x,window.innerWidth-pw-8))+'px';
      miniPal.style.top =Math.max(8,Math.min(y,window.innerHeight-ph-8))+'px';
      miniPal.classList.add('visible');
      syncPalActive(); updateSizeRing();
    }
    var palJustHidden = false; // true for one frame after palette is dismissed
    function hideMiniPal(){
      miniPal.classList.remove('visible');
      palJustHidden = true;
      requestAnimationFrame(function(){ palJustHidden = false; });
    }
    function adjustSize(d){
      sizeScale=Math.max(0.3,Math.min(3.0,sizeScale+d));
      updateSizeRing();
    }

    /* ---- pointer ---- */
    let mx=-999, my=-999;        // canvas backing-store coords (ring/stamps)
    let mcx=-9999, mcy=-9999;    // raw client coords (zone hit-testing)

    // Map client (viewport) coordinates → canvas backing-store coordinates by
    // measuring where the canvas ACTUALLY is on screen right now. This stays
    // correct under browser zoom, pinch-zoom panning, DPI changes when moving
    // between monitors, or anything else that displaces or rescales the canvas
    // — no assumption that the canvas origin sits at clientX/Y (0,0).
    function toCanvas(clientX, clientY) {
      const cr = canvas.getBoundingClientRect();
      const sx = canvas.width  / cr.width;
      const sy = canvas.height / cr.height;
      return [(clientX - cr.left) * sx, (clientY - cr.top) * sy];
    }

    // Returns true if the pointer target is a UI control that should never
    // trigger drawing — the toolbar and the dedicated exit button.
    function isUI(target) {
      let el = target;
      while (el && el !== document.body) {
        if (el === toolbar || el.id === 'toolbar') return true;
        if (el.id === 'drawQuickBar') return true; // includes exit btn + quick tools
        if (el.id === 'drawExitBtn') return true;
        if (el.id === 'miniPalette') return true;
        el = el.parentElement;
      }
      return false;
    }

    // Clamp a pointer event's position to the draw zone, then map to canvas
    // coords. While dragging with pointer capture the cursor can leave the
    // zone; clamping keeps the stroke inside — like the edge of the paper.
    function zonePos(ev) {
      const r = overlay.getBoundingClientRect();
      const cx = Math.max(r.left, Math.min(r.right,  ev.clientX));
      const cy = Math.max(r.top,  Math.min(r.bottom, ev.clientY));
      return toCanvas(cx, cy);
    }

    // These fire ONLY on the overlay — the reserved UI strips are physically
    // outside it, so toolbar/quick-bar clicks can never reach these handlers.
    function down(e) {
      if (!drawMode) return;
      hideMiniPal();
      drawing=true;
      overlay.setPointerCapture(e.pointerId);
      const p=zonePos(e); lastX=p[0]; lastY=p[1]; lastT=performance.now();
      if (tool!=="smudge") stampLine(lastX,lastY,lastX+0.01,lastY+0.01,0);
      lastDraw=performance.now();
    }
    function move(e) {
      const evs=e.getCoalescedEvents?e.getCoalescedEvents():null;
      const list=(evs&&evs.length)?evs:[e];
      for (let i=0;i<list.length;i++) {
        const ev=list[i];
        if (!drawing||!drawMode) continue;
        const p=zonePos(ev);
        const now=performance.now();
        const speed=Math.hypot(p[0]-lastX,p[1]-lastY)/Math.max(8,now-lastT);
        if (tool==="smudge") smudge(lastX,lastY,p[0],p[1]);
        else stampLine(lastX,lastY,p[0],p[1],speed);
        lastX=p[0]; lastY=p[1]; lastT=now; lastDraw=now;
      }
    }
    function up() { drawing=false; }

    // Is the current pointer position inside the draw zone? (for the ring)
    // Compares raw client coords against the zone's on-screen rect directly.
    function inZone() {
      const r = overlay.getBoundingClientRect();
      return mcx >= r.left && mcx <= r.right && mcy >= r.top && mcy <= r.bottom;
    }

    /* ---- mode & tool control ---- */
    function setDrawMode(on) {
      drawMode=on;
      if (!on) drawing=false; // end any in-flight stroke
      canvas.style.pointerEvents="none";
      document.body.classList.toggle("draw-mode-active",on);
      const mt=document.getElementById("modeToggle");
      if (mt) {
        mt.classList.toggle("is-draw",on);
        const lbl=mt.querySelector(".mt-label");
        if (lbl) lbl.textContent=on?"← exit draw mode":"Click to draw";
      }
      const ind=document.getElementById("modeIndicator");
      if (ind) { ind.textContent=on?"✦ DRAW MODE  ·  Esc to exit":""; ind.style.opacity=on?"1":"0"; }
      if (!on) hideMiniPal();
    }

    function setTool(t) {
      tool=t;
      [].forEach.call(toolbar.querySelectorAll('.tool[data-tool]'),function(b){
        b.classList.toggle('active',b.dataset.tool===t);
      });
      [].forEach.call(document.querySelectorAll('#drawQuickBar .qt[data-qt]'),function(b){
        b.classList.toggle('active',b.dataset.qt===t);
      });
      syncPalActive();
    }

    /* ---- fx loop ---- */
    function loop() {
      fxc.clearRect(0,0,fx.width,fx.height);
      for (let i=parts.length-1;i>=0;i--) {
        const p=parts[i]; p.life++; p.x+=p.vx; p.y+=p.vy; p.vy+=0.004*dpr;
        const k=1-p.life/p.max; if (k<=0){parts.splice(i,1);continue;}
        fxc.globalAlpha=p.a*k;
        fxc.fillStyle=p.light?"rgb(244,241,234)":"rgb(26,24,20)";
        fxc.beginPath(); fxc.arc(p.x,p.y,p.r,0,7); fxc.fill();
      }
      fxc.globalAlpha=1;
      // cursor ring — ONLY inside the draw zone. Outside it the system cursor
      // shows instead, so exactly one pointer is visible at any time.
      if (drawMode&&mx>-900&&inZone()) {
        const r=(TOOLS[tool]?TOOLS[tool].size||24:24)*sizeScale*dpr*0.5+2*dpr;
        fxc.strokeStyle="rgba(30,28,24,0.5)"; fxc.lineWidth=1.1*dpr;
        fxc.beginPath(); fxc.arc(mx,my,r,0,7); fxc.stroke();
        fxc.fillStyle="rgba(30,28,24,0.5)";
        fxc.beginPath(); fxc.arc(mx,my,1.1*dpr,0,7); fxc.fill();
      }
      // idle fade
      if (hasMarks&&!drawing&&performance.now()-lastDraw>14000) {
        ctx.globalCompositeOperation="destination-out";
        ctx.globalAlpha=0.012; ctx.fillStyle="#000";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha=1; ctx.globalCompositeOperation="source-over";
      }
      requestAnimationFrame(loop);
    }

    /* ---- toolbar wiring — plain click handlers ---- */
    const modeToggle=document.getElementById("modeToggle");
    if (modeToggle) {
      modeToggle.addEventListener("click",function(){ setDrawMode(!drawMode); });
    }
    // Dedicated exit button — outside the toolbar, bypasses all event routing.
    const exitBtn=document.getElementById("drawExitBtn");
    if (exitBtn) {
      exitBtn.addEventListener("click",function(){ setDrawMode(false); });
    }
    // Quick bar tools — same event treatment as the exit button (plain click,
    // isUI() excludes the whole bar from draw handling).
    [].forEach.call(document.querySelectorAll('#drawQuickBar .qt[data-qt]'),function(b){
      b.addEventListener('click',function(){
        var t=b.dataset.qt;
        if (t==='clear') {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          parts.length=0; hasMarks=false; return;
        }
        if (t==='size-down') { adjustSize(-0.2); return; }
        if (t==='size-up')   { adjustSize( 0.2); return; }
        setTool(t);
        hideMiniPal();
      });
    });
    [].forEach.call(toolbar.querySelectorAll(".tool[data-tool]"),function(b) {
      b.addEventListener("click",function() {
        if (b.dataset.tool==="clear") {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          parts.length=0; hasMarks=false; return;
        }
        setTool(b.dataset.tool);
        if (!drawMode) setDrawMode(true);
      });
    });
    [].forEach.call(miniPal.querySelectorAll('.mp-btn'),function(b){
      b.addEventListener('click',function(e){
        e.stopPropagation();
        setTool(b.dataset.tool);
        if(!drawMode) setDrawMode(true);
        hideMiniPal();
      });
    });
    // Close mini palette on outside click (handled in down() via hideMiniPal())
    // Close on pointerdown inside miniPal area still works because isUI returns true

    const collapseBtn=document.getElementById("tbCollapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click",function(){
        toolbar.classList.toggle("collapsed");
        collapseBtn.textContent=toolbar.classList.contains("collapsed")?"›":"‹";
      });
    }
    window.addEventListener('keydown',function(e){
      if(e.ctrlKey||e.metaKey||e.altKey) return;
      if(e.key==='Escape'){ if(drawMode){setDrawMode(false);hideMiniPal();} return; }
      if((e.key==='d'||e.key==='D')&&!drawMode){ setDrawMode(true); return; }
      if((e.key==='b'||e.key==='B')&&drawMode){ setDrawMode(false); hideMiniPal(); return; }
      if(!drawMode) return;
      var map={'1':'pencil','2':'soft','3':'heavy','4':'smudge'};
      if(map[e.key]){ setTool(map[e.key]); hideMiniPal(); return; }
      if(e.key==='e'||e.key==='E'){ setTool('eraser'); hideMiniPal(); return; }
      if((e.key==='c'||e.key==='C')&&!drawing){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        parts.length=0; hasMarks=false; return;
      }
      if(e.key==='['){ adjustSize(-0.15); return; }
      if(e.key===']'){ adjustSize(0.15); return; }
    });

    /* ---- init ---- */
    resize();
    window.addEventListener("resize",function(){resize();});

    // Right-click inside the draw zone → mini palette near cursor.
    // Attached to the overlay: outside the zone the native menu still works.
    overlay.addEventListener('contextmenu',function(e){
      e.preventDefault();
      showMiniPal(e.clientX+12, e.clientY-20);
    });

    // Scroll wheel inside the draw zone → brush size.
    // Attached to the overlay: wheel behaves normally over the UI strips.
    overlay.addEventListener('wheel',function(e){
      e.preventDefault();
      adjustSize(e.deltaY>0?-0.1:0.1);
    },{passive:false});

    // Draw events fire only on the overlay (the geometric draw zone).
    overlay.addEventListener("pointerdown",down);
    overlay.addEventListener("pointermove",move);
    overlay.addEventListener("pointerup",up);
    overlay.addEventListener("pointercancel",up);
    // Window-level move tracks the ring position everywhere (ring is drawn
    // only while the position is inside the zone — see loop()).
    window.addEventListener("pointermove",function(e){
      mcx=e.clientX; mcy=e.clientY;
      const p=toCanvas(e.clientX,e.clientY); mx=p[0]; my=p[1];
    });

    // ── CAPTURE-PHASE position-based toolbar handler ──────────────────────
    // Fires FIRST on every click, before any z-index or CSS rule can block it.
    // Detects which toolbar button the pointer is physically over and calls the
    // action directly — no reliance on event bubbling or pointer-events CSS.
    document.addEventListener('click', function(e) {
      // If the mini palette was just dismissed this frame, the click was for it
      if (palJustHidden) return;

      // Is the click position within the toolbar's current bounding rect?
      var tb = toolbar.getBoundingClientRect();
      if (e.clientX < tb.left || e.clientX > tb.right ||
          e.clientY < tb.top  || e.clientY > tb.bottom) return;

      // Walk interactive toolbar elements and find which one was hit by position
      var candidates = [modeToggle, collapseBtn].concat(
        [].slice.call(toolbar.querySelectorAll('.tool[data-tool]'))
      );

      for (var i = 0; i < candidates.length; i++) {
        var btn = candidates[i];
        if (!btn) continue;
        var r = btn.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right &&
            e.clientY >= r.top  && e.clientY <= r.bottom) {

          // Prevent existing bubble-phase listeners from double-firing
          e.stopPropagation();

          if (btn.id === 'modeToggle') {
            setDrawMode(!drawMode); hideMiniPal();
          } else if (btn.id === 'tbCollapse') {
            toolbar.classList.toggle('collapsed');
            btn.textContent = toolbar.classList.contains('collapsed') ? '›' : '‹';
          } else if (btn.dataset.tool === 'clear') {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            parts.length=0; hasMarks=false;
          } else if (btn.dataset.tool) {
            setTool(btn.dataset.tool);
            if (!drawMode) setDrawMode(true);
            hideMiniPal();
          }
          return;
        }
      }
    }, true); // true = capture phase
    window.addEventListener("beforeunload",function(){ctx.clearRect(0,0,canvas.width,canvas.height);});

    setDrawMode(false);
    setTool("soft");
    requestAnimationFrame(loop);
  }

  window.Playground=Playground;
})();

// Marks this file as an ES module for TypeScript (`import()` call sites are
// typed .ts/.tsx) — no effect on runtime behavior, the IIFE above is unchanged.
export {};
