#!/usr/bin/env bash
# Remove .env.local from git tracking and create a commit
# Run this in your repository root (ensure you have a backup)

set -euo pipefail

if [ ! -f .env.local ]; then
  echo ".env.local not found in repository root. Exiting."
  exit 1
fi

git rm --cached .env.local || true
git add .env.local.example ENVIRONMENT.md || true
git commit -m "Remove sensitive env from repo, add example and environment docs" || true

echo "Committed. If .env.local was pushed previously, consider purging history with BFG or git-filter-repo. See scripts/purge-history-with-bfg.md"
