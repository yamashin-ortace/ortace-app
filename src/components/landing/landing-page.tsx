import { LandingMotionSection } from "@/components/landing/landing-motion-section";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingGuarantee } from "@/components/landing/landing-guarantee";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
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
        <LandingGuarantee />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingFaq />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingFinalCta />
      </LandingMotionSection>
      <LandingFooter />
    </div>
  );
}
