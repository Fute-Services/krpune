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

# Not `git lfs pull`. Vercel's Git integration hands the build a plain file
# tree with no `.git` directory — the first attempt at this printed "Not in a
# Git repository" three times and stopped the build — so the git-lfs client
# has nothing to work with and no GITHUB_TOKEN can change that.
#
# The LFS batch API needs none of git's machinery: a pointer file carries the
# oid and size, which is the entire request. Verified against this repo,
# unauthenticated, returning bytes that sha256-match the originals.
node scripts/fetch-lfs-videos.mjs

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

scripts/fetch-lfs-videos.mjs should have replaced them. Check its output above:

  - "no pointer files" means it saw real content and did nothing, so the
    pointers arrived some other way.
  - A 4xx from the batch API means the repo went private — set GITHUB_TOKEN
    in the Vercel project settings (a PAT with repo read access); the script
    sends it when present.
  - A size mismatch means the download was truncated. Re-run the deploy.

EOF
  exit 1
fi

echo "──── Building ───────────────────────────────────────────"
cd web
npm run build
npm run verify:build
