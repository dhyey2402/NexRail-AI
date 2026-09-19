import { LandingNav } from '../components/landing/LandingNav'
import { HeroSection } from '../components/landing/HeroSection'
import { CoreCapabilities } from '../components/landing/CoreCapabilities'
import { HowItWorks } from '../components/landing/HowItWorks'
import { FinalCTA } from '../components/landing/FinalCTA'
import { LandingFooter } from '../components/landing/LandingFooter'

export function LandingPage() {
  return (
    <div className="bg-bg min-h-screen font-sans">
      <LandingNav />
      <main>
        <HeroSection />
        <CoreCapabilities />
        <HowItWorks />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
