#!/usr/bin/env bash
#
# Vercel build entry point.
#
# Why this exists rather than a plain `cd web && npm run build`:
#
# web/public/media/videos/*.mp4 is tracked in Git LFS. Vercel's Git integration
# does not fetch LFS objects, so the checkout it builds from contains ~134 byte
# pointer files where the videos should be. Those deploy as HTTP 200
# `Content-Type: video/mp4`, the offline downloader caches them as a success,
# the progress bar still reaches 100 % — and /#/walkthrough, /#/construction and
# /#/circulation-plan play nothing. Production shipped exactly that.
#
# So: pull the LFS objects, then *prove* they arrived. If they did not, fail the
# build. A failed deploy is recoverable; a deploy that looks fine and has three
# dead pages is what we are here to stop happening again.
#
# Requires a GITHUB_TOKEN environment variable in the Vercel project settings
# (a PAT with read access to the repo) — Vercel's shallow clone does not leave
# credentials behind that the LFS endpoint will accept.

set -euo pipefail

VIDEO_DIR="web/public/media/videos"
POINTER_PREFIX="version https://git-lfs.github.com"

echo "──── Git LFS ────────────────────────────────────────────"

if ! command -v git-lfs >/dev/null 2>&1; then
  echo "git-lfs is not installed in this build image."
  echo "Falling through to the pointer check below, which will fail with detail."
elif [ ! -d .git ]; then
  echo "No .git directory in the build context — nothing for git lfs to pull."
  echo "Falling through to the pointer check below, which will fail with detail."
else
  git lfs install --local || true

  # Vercel's clone has no credentials the LFS endpoint will take. Supply them
  # from GITHUB_TOKEN when it is set; without it `git lfs pull` 401s.
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git config --local \
      "http.https://github.com/.extraheader" \
      "Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 -w0)"
    echo "Using GITHUB_TOKEN for LFS authentication."
  else
    echo "GITHUB_TOKEN is not set — attempting an unauthenticated pull."
  fi

  # Not fatal on its own: the pointer check below is the real gate, and it can
  # explain the failure far better than git-lfs's exit code can.
  git lfs pull || echo "git lfs pull failed — see the pointer check below."
fi

echo "──── Verifying the videos are real files ────────────────"

missing=0
for f in "$VIDEO_DIR"/*.mp4; do
  [ -e "$f" ] || continue
  size=$(wc -c < "$f")
  if head -c "${#POINTER_PREFIX}" "$f" | grep -qF "$POINTER_PREFIX"; then
    echo "  POINTER  $f  (${size} bytes) — the LFS object was not fetched"
    missing=$((missing + 1))
  else
    echo "  ok       $f  (${size} bytes)"
  fi
done

if [ "$missing" -gt 0 ]; then
  cat <<'EOF'

BUILD STOPPED: Git LFS objects were not fetched, so the videos above are
pointer files. Deploying this would serve three dead pages that look fine
in every automated check.

Fix one of these, then redeploy:

  1. Set GITHUB_TOKEN in the Vercel project settings (a PAT with repo read
     access) so `git lfs pull` can authenticate, and confirm the build image
     provides git-lfs.

  2. Or take the fallback: host the three originals on Vercel Blob and add a
     prebuild step that downloads them into web/public/media/videos/ before
     the Vite build. That keeps the files same-origin and byte-identical, so
     nothing about the service worker or the offline manifest changes.

EOF
  exit 1
fi

echo "──── Building ───────────────────────────────────────────"
cd web
npm run build
npm run verify:build
