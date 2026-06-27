import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  // Remotion's renderer/bundler are server-only; keep them out of the client and
  // RSC bundles.
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild"],
};

// withEve mounts the eve agent on the same origin and boots its dev server
// alongside `next dev`, so the browser's useEveAgent() needs no host/CORS setup.
export default withEve(nextConfig, {
  devServerTimeoutMs: 300_000,
});
