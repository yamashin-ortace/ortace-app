import { RandomModeClient } from "@/components/study/random-mode-client";
import { getEffectivePlanForProfile } from "@/lib/billing/plans";
import { getSessionContext } from "@/lib/auth/profile";

export default async function RandomModePage() {
  const session = await getSessionContext();
  const plan = session?.profile
    ? getEffectivePlanForProfile(session.profile)
    : "free";

  return <RandomModeClient plan={plan} />;
}
