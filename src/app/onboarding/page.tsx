import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";
import { getSessionContext, isOnboarded } from "@/lib/auth/profile";

export const metadata = {
  title: "はじめに｜ORT ACE",
};

export default async function OnboardingPage() {
  const session = await getSessionContext();
  if (!session) {
    redirect("/login");
  }
  if (isOnboarded(session.profile)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <OnboardingFlow />
    </div>
  );
}
