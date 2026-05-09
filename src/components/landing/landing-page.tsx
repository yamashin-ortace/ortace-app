import { LandingMotionSection } from "@/components/landing/landing-motion-section";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";

export function LandingPage() {
  return (
    <div className="-mt-2">
      <LandingMotionSection>
        <LandingHero />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingFeatures />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingPricing />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingFaq />
      </LandingMotionSection>
      <LandingFooter />
    </div>
  );
}
