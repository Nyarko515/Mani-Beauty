Purging sensitive file history using BFG or git-filter-repo

WARNING: These operations rewrite git history. Coordinate with your team and backup your repo.

Option A — BFG Repo-Cleaner (simpler):

1. Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Mirror your repo locally:

```bash
git clone --mirror https://github.com/your/repo.git
cd repo.git
```

3. Remove `.env.local` from history:

```bash
java -jar bfg.jar --delete-files .env.local
```

4. Cleanup and push:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Option B — git-filter-repo (recommended if available):

1. Install git-filter-repo (https://github.com/newren/git-filter-repo)
2. Run:

```bash
git clone https://github.com/your/repo.git
cd repo
git filter-repo --invert-paths --path .env.local
# push changes (force) after verifying
git push origin --force --all
```

After purge:

- Rotate any keys that were exposed.
- Inform collaborators to re-clone the repo.
