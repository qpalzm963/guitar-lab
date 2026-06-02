import type { NextConfig } from "next";

// Deployed to GitHub Pages at https://<user>.github.io/guitar-lab/, which serves
// the app from the /guitar-lab subpath. The Pages CI build sets GITHUB_PAGES=true;
// local `next dev` / `next build` keep serving from root so dev is unaffected.
const basePath = process.env.GITHUB_PAGES === "true" ? "/guitar-lab" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Expose basePath to the client so runtime asset URLs loaded from /public
  // (alphaTab's worker / font / soundfont) resolve correctly under the subpath.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
