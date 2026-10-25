# Git workflow

- `main` is always deployable. **No direct pushes to `main`** — every change goes through a Pull Request.
- Branch from `main` as `feat/<wbs>-<name>`, e.g. `feat/1.3-ics-import`. (`fix/`, `chore/`, `docs/` are allowed for non-feature work.)
- Open a PR into `main`. CI (`.github/workflows/ci.yml`) must pass: branch name check, `api` lint + test, `client` lint + test + build.
- At least 1 approving review before merge. Prefer **Squash and merge**.

```bash
git checkout main && git pull
git checkout -b feat/1.3-ics-import
# ...work...
git push -u origin feat/1.3-ics-import
gh pr create --base main
```

## Protecting `main` (one-time, repo admin)

GitHub → Settings → Branches → Add rule for `main`:

- Require a pull request before merging (1 approval)
- Require status checks to pass: `Branch naming`, `API (lint + test)`, `Client (lint + test + build)`
- Do not allow bypassing the above settings

Or with the GitHub CLI (replace `OWNER/REPO`):

```bash
gh api -X PUT repos/OWNER/REPO/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["Branch naming", "API (lint + test)", "Client (lint + test + build)"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
EOF
```

## Code rules

- **Rule 06:** every database query is scoped by `user_id`. Use `byUser()` / `byCourseOwner()` from `api/src/db/scope.js`; protected routes get `req.userId` from `requireAuth`.
- API errors use the shape `{ error: { code, message } }`.
