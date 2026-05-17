import Image from "next/image";
import { MousePointerClick } from "lucide-react";

const SCREENS = [
  {
    src: "/landing/app-screens/home-dashboard.jpg",
    alt: "ホーム画面の例",
    className:
      "absolute -left-8 top-20 hidden h-[420px] w-[224px] -rotate-[9deg] opacity-72 md:block",
  },
  {
    src: "/landing/app-screens/records-list.jpg",
    alt: "記録画面の例",
    className:
      "absolute -right-10 top-28 hidden h-[410px] w-[218px] rotate-[8deg] opacity-72 md:block",
  },
] as const;

export function LandingQuestionPhone() {
  return (
    <div className="relative mx-auto h-[600px] w-full max-w-[440px]">
      {SCREENS.map((screen) => (
        <div
          key={screen.src}
          className={`${screen.className} overflow-hidden rounded-[32px] border-[10px] border-[#141a22] bg-[#141a22] shadow-[0_28px_72px_rgba(19,34,50,0.24)]`}
        >
          <Image
            src={screen.src}
            alt={screen.alt}
            fill
            unoptimized
            sizes="224px"
            className="rounded-[22px] object-cover object-top"
          />
        </div>
      ))}

      <div className="absolute left-1/2 top-0 h-[590px] w-[304px] -translate-x-1/2 rotate-[2deg] overflow-hidden rounded-[42px] border-[12px] border-[#141a22] bg-[#141a22] shadow-[0_42px_96px_rgba(19,34,50,0.32)]">
        <Image
          src="/landing/app-screens/ai-analysis.jpg"
          alt="AIコーチ分析画面の例"
          fill
          priority={false}
          unoptimized
          sizes="304px"
          className="rounded-[29px] object-cover object-top"
        />
        <div
          className="absolute right-[28px] top-[452px] grid size-11 place-items-center rounded-full border border-white/70 bg-white/92 text-[#c97896] shadow-[0_14px_32px_rgba(119,53,78,0.22)]"
          aria-hidden
        >
          <MousePointerClick className="size-5" strokeWidth={2.6} />
        </div>
      </div>
    </div>
  );
}
