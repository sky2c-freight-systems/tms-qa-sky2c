import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained .next/standalone with only the deps actually used at
  // runtime, so the production Docker image doesn't need node_modules copied in.
  output: "standalone",
  // Type-checking is enforced in CI (.github/workflows/ci.yml) on every push/PR, not
  // here. The Docker build host (Coolify/vhaul4u) only has 1 CPU available, where
  // `next build`'s own tsc pass took 18+ minutes and was the direct cause of a build
  // getting OOM-killed mid static-generation. Skipping the redundant re-check during
  // the image build removes that bottleneck entirely without lowering the bar — a
  // type error still fails CI and blocks the change from reaching this branch.
  // (ESLint has no build-time integration to disable here — Next 16 dropped that;
  // this project already lints via a standalone `eslint` script, see ci.yml.)
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
