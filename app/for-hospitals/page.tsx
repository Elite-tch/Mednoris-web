import HeroB2B from "@/components/landing-b2b/HeroB2B";
import ProblemSolution from "@/components/landing-b2b/ProblemSolution";
import CoreFeatures from "@/components/landing-b2b/CoreFeatures";
import WorkflowSteps from "@/components/landing-b2b/WorkflowSteps";
import DataOwnership from "@/components/landing-b2b/DataOwnership";
import CtaB2B from "@/components/landing-b2b/CtaB2B";

export default function ForHospitalsPage() {
  return (
    <main className="min-h-screen bg-white font-serif text-foreground selection:bg-brand-primary/20">
      <HeroB2B />
      <ProblemSolution />
      <CoreFeatures />
      <WorkflowSteps />
      <DataOwnership />
      <CtaB2B />
    </main>
  );
}
