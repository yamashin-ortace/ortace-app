import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORT ACE — 視能訓練士国試対策",
    short_name: "ORT ACE",
    description:
      "視能訓練士国家試験対策Webアプリ。過去問1,350問・毎日の学習を支えます。",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f6",
    theme_color: "#e8a5b8",
    lang: "ja",
    dir: "ltr",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
