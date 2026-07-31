import HeroSection from '@/components/home/HeroSection'
import HomeSections from '@/components/home/HomeSections'
import PageSchema from '@/components/seo/PageSchema'

/* Home deliberately exports no `metadata` — the root layout's default title
   applies, because a title template never applies to the segment that defines
   it. Structured data is still per-page, hence PageSchema here. ProfilePage is
   the right type: this page's primary entity is the person. */
export default function HomePage() {
  return (
    <>
      <PageSchema
        path="/"
        type="ProfilePage"
        name="Kamlesh Chhipa — Backend & AI Infrastructure Engineer"
        description="Backend and full-stack engineer in Bengaluru with 4+ years building large-scale data platforms and production LLM infrastructure."
      />
      <HeroSection />
      <HomeSections />
    </>
  )
}
