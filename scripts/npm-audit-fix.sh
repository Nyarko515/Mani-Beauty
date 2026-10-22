#!/usr/bin/env bash
# Attempt safe npm audit fixes, then show remaining vulnerabilities.
set -euo pipefail

npm ci
npm audit fix || true
npm audit || true

echo "If critical vulnerabilities remain, consider running 'npm audit fix --force' and testing carefully." 
