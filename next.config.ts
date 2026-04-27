import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 開発時の左下「N」は Next.js DevTools。文言が英語固定のため非表示
   * （`npm run build` 後の本番相当ではもともと出ない）
   */
  devIndicators: false,
};

export default nextConfig;
