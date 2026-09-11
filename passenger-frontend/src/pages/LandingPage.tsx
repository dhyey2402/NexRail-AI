import { LandingNav } from '../components/landing/LandingNav'
import { HeroSection } from '../components/landing/HeroSection'
import { ProblemSection } from '../components/landing/ProblemSection'
import { IntelligenceFlow } from '../components/landing/IntelligenceFlow'
import { CoreCapabilities } from '../components/landing/CoreCapabilities'
import { ProductShowcase } from '../components/landing/ProductShowcase'
import { DecisionIntelligence } from '../components/landing/DecisionIntelligence'
import { WeatherIntelligence } from '../components/landing/WeatherIntelligence'
import { AIAssistant } from '../components/landing/AIAssistant'
import { HowItWorks } from '../components/landing/HowItWorks'
import { FinalCTA } from '../components/landing/FinalCTA'
import { LandingFooter } from '../components/landing/LandingFooter'

export function LandingPage() {
  return (
    <div className="bg-[#050608] min-h-screen font-sans selection:bg-[#4aa3e8]/30 selection:text-white">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <IntelligenceFlow />
        <CoreCapabilities />
        <ProductShowcase />
        <DecisionIntelligence />
        <WeatherIntelligence />
        <AIAssistant />
        <HowItWorks />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
