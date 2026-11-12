# Git workflow

- `main` is always deployable. **No direct pushes to `main`** — every change goes through a Pull Request.
- Branch from `main` as `feat/<wbs>-<name>`, e.g. `feat/1.3-ics-import`. (`fix/`, `chore/`, `docs/` are allowed for non-feature work.)
- Open a PR into `main`. CI (`.github/workflows/ci.yml`) must pass: branch name check, `api` lint + test, `client` lint + test + build, Docker build + compose smoke test. You can run the same jobs on your machine first, see [Running CI locally with act](#running-ci-locally-with-act).
- At least 1 approving review before merge. Prefer **Squash and merge**.

```bash
git checkout main && git pull
git checkout -b feat/1.3-ics-import
# ...work...
git push -u origin feat/1.3-ics-import
gh pr create --base main
```

## Running CI locally with act

[act](https://github.com/nektos/act) runs the GitHub Actions jobs from `.github/workflows/ci.yml` in Docker on your
machine, so a red CI run can be reproduced (and fixed) before pushing.

### 1. Install

Docker must be installed and running (Docker Desktop on Windows / macOS, with Linux containers; on Windows use the
WSL 2 backend).

| OS | Command |
|---|---|
| Windows | `winget install nektos.act` (or `choco install act-cli`, or `scoop install act`) |
| macOS | `brew install act` |
| Linux | `curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh \| sudo bash` |

Open a new terminal and check it with `act --version`.

The repository's `.actrc` already selects the runner image (`catthehacker/ubuntu:act-latest`, about 1–2 GB, pulled on the
first run), so act does not ask which image size to use. On Apple Silicon add `--container-architecture linux/amd64`
to the commands below.

### 2. Run the jobs

Run from the repository root:

```bash
act -l                                   # list the jobs: branch-name, api, client, docker

act pull_request -j api                  # API: npm ci, prisma validate/generate, lint, tests
act pull_request -j client               # client: lint, tests, build
act pull_request -j docker               # build images, start MySQL + API + nginx, seed, smoke test

# Branch naming check: it reads the PR branch from an event file.
# Edit "head.ref" in .github/act/pull_request.json to your branch name first.
act pull_request -j branch-name -e .github/act/pull_request.json

act pull_request                         # every job, like a PR
```

No secrets are needed: the jobs use throwaway values (`JWT_SECRET=ci-…`, `LLM_MOCK=true`).

### 3. Notes for the `docker` job

- act mounts your Docker socket, so the containers started by `docker compose` run on your own Docker, as project
  `sfsh`. Stop your own stack first (`docker compose down`), because the job publishes port **8080**.
- The job runs on act's host network, so `curl http://localhost:8080` reaches nginx. If the smoke test cannot connect
  (some Docker Desktop setups), run the same steps directly from the repo root in Git Bash:

  ```bash
  sed -e 's/^JWT_SECRET=.*/JWT_SECRET=ci-docker-secret/' -e 's/^LLM_MOCK=.*/LLM_MOCK=true/' .env.docker.example > .env
  docker compose up -d --build --wait --wait-timeout 300
  docker compose --profile seed run --rm seed
  curl -fsS http://localhost:8080/api/health
  docker compose down -v
  ```

  (This overwrites `.env` in the repo root; it is git-ignored.)
- The job always ends with `docker compose down -v`. If you interrupt it (Ctrl+C), clean up with
  `docker compose -p sfsh down -v`.
- Database errors such as `P2022 The column ... does not exist` mean `schema.prisma` changed without a migration.
  Create one with `npx prisma migrate dev --name <change>` (in `api/`, against a local MySQL) and commit the
  `prisma/migrations/<timestamp>_<change>/` folder together with the schema change.
- If `jq` is missing in the job container, use the bigger runner image:
  `act pull_request -j docker -P ubuntu-latest=catthehacker/ubuntu:full-latest`.

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
