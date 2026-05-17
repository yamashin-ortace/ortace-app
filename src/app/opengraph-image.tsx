import { ImageResponse } from "next/og";

export const alt = "ORT ACE — National Optometrist Exam Prep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OGP / Twitter Card 用の動的画像生成。
 * Satori は日本語フォントを別途バンドルする必要があるため、
 * 暫定として英字＋ブランドカラーで構成。
 * 将来 og-image.png をデザイナーが用意したら、static 参照に置き換える。
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fdf8f6 0%, #f5eded 45%, #e8f7f5 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "56px",
            right: "80px",
            fontSize: "26px",
            color: "#998a90",
            letterSpacing: "2px",
            display: "flex",
          }}
        >
          ortace.jp
        </div>
        <div
          style={{
            fontSize: "180px",
            fontWeight: 900,
            letterSpacing: "-6px",
            color: "#2b1f24",
            lineHeight: 1,
            display: "flex",
          }}
        >
          ORT ACE
        </div>
        <div
          style={{
            marginTop: "32px",
            fontSize: "38px",
            fontWeight: 800,
            color: "#c98299",
            letterSpacing: "1px",
            display: "flex",
          }}
        >
          National Optometrist Exam Prep
        </div>
        <div
          style={{
            marginTop: "72px",
            padding: "14px 36px",
            background: "#16717c",
            color: "white",
            fontSize: "28px",
            fontWeight: 700,
            borderRadius: "999px",
            display: "flex",
          }}
        >
          1,500 Questions × AI Coach
        </div>
      </div>
    ),
    size,
  );
}
