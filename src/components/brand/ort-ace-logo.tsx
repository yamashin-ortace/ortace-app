import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

export function OrtAceLogo({
  size = "md",
  showWordmark = true,
  className,
}: Props) {
  const logoSize =
    size === "lg"
      ? "h-16 w-[198px]"
      : size === "sm"
        ? "h-8 w-[100px]"
        : "h-12 w-[148px]";
  const markOnlySize =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-12 w-12";

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden rounded-[8px]",
        showWordmark ? logoSize : markOnlySize,
        className,
      )}
    >
      <Image
        src="/landing/ort-ace-logo-final.png"
        alt={showWordmark ? "ORT ACE" : ""}
        fill
        sizes={size === "sm" ? "100px" : size === "lg" ? "198px" : "148px"}
        className={cn(
          "object-cover",
          showWordmark ? "object-center" : "object-left",
        )}
      />
    </span>
  );
}
