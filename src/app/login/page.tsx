import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { getSessionContext, isOnboarded } from "@/lib/auth/profile";

export const metadata = {
  title: "ログイン｜ORT ACE",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const session = await getSessionContext();
  if (session) {
    redirect(isOnboarded(session.profile) ? "/" : "/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-sm items-center justify-center px-4 py-8">
      <Suspense>
        <LoginCard initialError={params.error} initialSent={params.sent} />
      </Suspense>
    </div>
  );
}
