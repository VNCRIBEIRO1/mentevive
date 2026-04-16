import { SectionDivider } from "@/components/landing";
import { PlatformNav } from "./PlatformNav";
import { PlatformHero } from "./PlatformHero";
import { PlatformProblem } from "./PlatformProblem";
import { PlatformFeatures } from "./PlatformFeatures";
import { PlatformHowItWorks } from "./PlatformHowItWorks";
import { PlatformPricing } from "./PlatformPricing";
import { PlatformFAQ } from "./PlatformFAQ";
import { PlatformCTA } from "./PlatformCTA";
import { PlatformFooter } from "./PlatformFooter";

export function PlatformLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PlatformNav />
      <PlatformHero />
      <SectionDivider />
      <PlatformProblem />
      <PlatformFeatures />
      <SectionDivider variant="wave-up" />
      <PlatformHowItWorks />
      <PlatformPricing />
      <SectionDivider />
      <PlatformFAQ />
      <PlatformCTA />
      <PlatformFooter />
    </div>
  );
}
