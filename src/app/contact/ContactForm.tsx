'use client'

import { useState } from 'react'

interface ContactFormProps {
  email: string
}

/**
 * Progressive-enhancement layer on top of the always-visible mailto/LinkedIn/
 * GitHub links above — this form never talks to a backend. On submit it
 * builds a mailto: URL from the visitor's input and navigates to it, opening
 * their own email client with the message pre-filled. Zero server, zero API
 * key, works the moment this ships.
 */
export default function ContactForm({ email }: ContactFormProps) {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const from = (form.elements.namedItem('email') as HTMLInputElement).value
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value

    const subject = `Portfolio contact from ${name}`
    const body = `${message}\n\n—\n${name}\n${from}`
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = mailto
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="content-grid cols-2" style={{ marginBottom: 18 }}>
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div className="form-field">
          <label htmlFor="email">Your email</label>
          <input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="form-field" style={{ marginBottom: 20 }}>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={5} required />
      </div>
      <button type="submit" className="btn is-drawn">
        Open in email client
        <svg className="ring" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M14 10 C 70 4, 150 6, 188 12 C 196 26, 194 44, 186 54 C 130 60, 50 58, 12 52 C 4 38, 6 20, 14 10 Z"
            style={{ '--blen': '640' } as React.CSSProperties}
          />
        </svg>
      </button>
      {sent && (
        <p style={{ marginTop: 16, color: 'var(--graphite)', fontStyle: 'italic' }}>
          Opening your email client — if nothing happened, use the direct email link above.
        </p>
      )}
    </form>
  )
}
