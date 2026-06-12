import { LandingMotionSection } from "@/components/landing/landing-motion-section";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingExplanationSample } from "@/components/landing/landing-explanation-sample";
import { LandingContentValue } from "@/components/landing/landing-content-value";
import { LandingPriceAppeal } from "@/components/landing/landing-price-appeal";
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
        <LandingExplanationSample />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingContentValue />
      </LandingMotionSection>
      <LandingMotionSection>
        <LandingPriceAppeal />
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
