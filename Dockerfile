# Multi-stage build for the Next.js 16 (App Router) + Prisma/MongoDB TMS app.
#
# Debian-based (not alpine): the PDF pipeline (src/lib/pdf/renderToPdf.ts) launches
# Puppeteer's bundled Chromium, which needs glibc + a specific set of shared libraries
# that alpine's musl base doesn't provide without extra work. Prisma's MongoDB engine
# binaries are also more predictable on glibc than musl.

FROM node:20-bookworm-slim AS base
WORKDIR /app

# ---- deps: install once, cached across builds unless package*.json changes ----
# Skip Puppeteer's own Chromium download entirely — node:20-bookworm-slim has no
# `unzip`/`yauzl`, which that download step needs to extract the archive it fetches
# (this is what actually failed here, not a missing runtime lib). Simpler and smaller
# to instead apt-install Debian's `chromium` package in the runner stage below and
# point PUPPETEER_EXECUTABLE_PATH at it (an env var Puppeteer's launcher reads on its
# own — no app code change needed).
FROM base AS deps
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
# Cache mount persists npm's download/extract cache across builds on the same
# Coolify host, independent of the `deps` layer cache itself (which still busts
# whenever package-lock.json changes) — avoids re-fetching every package from the
# registry on every dependency bump, which matters more on a CPU/RAM-constrained
# build host than on a beefy CI runner.
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- builder: generate the Prisma client, then build Next in standalone mode ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# DATABASE_URL isn't read at build time (no static generation touches the DB here),
# but Prisma's generated client throws if the env var is entirely undefined during
# `next build`'s module evaluation — a placeholder satisfies that without needing
# real credentials in the image.
ENV DATABASE_URL="mongodb://placeholder:27017/placeholder?replicaSet=rs0"
# Type-checking/linting are NOT re-run here — see next.config.ts's
# typescript.ignoreBuildErrors and .github/workflows/ci.yml, which is the actual
# gate. This build host has 1 CPU; that tsc pass alone used to take 18+ minutes and
# was the direct cause of a prior build getting OOM-killed mid static-generation.
# The Next.js build cache (webpack/Turbopack's incremental compilation state)
# persists across builds the same way the npm cache above does, so unrelated
# unchanged code doesn't get fully recompiled every deploy.sh
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ---- runner: minimal runtime image ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Debian's `chromium` package pulls its own correct dependency graph via apt, rather
# than us hand-listing versioned lib package names that can silently drift from what
# a given bookworm point release actually ships. PUPPETEER_EXECUTABLE_PATH tells
# Puppeteer's launcher to use this instead of trying to find its own (skipped) download.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Next's output-file-tracing occasionally misses Prisma's native engine binaries
# because they're loaded dynamically rather than statically imported — copied
# explicitly here so the runtime image has them regardless.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
