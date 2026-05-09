import type { Metadata } from "next";
import { HomeGreeting } from "@/components/home-greeting";
import { HomeDashboard } from "@/components/home-dashboard";
import { LandingPage } from "@/components/landing/landing-page";
import { getSessionContext } from "@/lib/auth/profile";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionContext();
  if (session) {
    return {
      title: "ホーム｜ORT ACE",
      description:
        "今日の学習・記録の概要。視能訓練士国家試験対策アプリ ORT ACE。",
    };
  }
  return {
    title: "ORT ACE — 視能訓練士国家試験対策",
    description:
      "合格の、一歩上へ。過去問1,500問（第47〜56回）、解説・ノート・ブックマーク・連続学習と分野別統計でORT国家試験の学習をサポート。無料プランですぐにはじめられます。",
  };
}

export default async function HomePage() {
  const session = await getSessionContext();

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="space-y-6 pt-2">
      <HomeGreeting />
      <HomeDashboard />
    </div>
  );
}
