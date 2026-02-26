# Todo API

[![CI](https://github.com/Reemark/CI-CD/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/ci.yml)
[![Docker](https://github.com/Reemark/CI-CD/actions/workflows/docker.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/docker.yml)
[![Deploy Prod](https://github.com/Reemark/CI-CD/actions/workflows/deploy-prod.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/deploy-prod.yml)
[![GHCR](https://img.shields.io/badge/GHCR-ci--cd-blue?logo=github)](https://github.com/orgs/Reemark/packages?repo_name=CI-CD)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Reemark_CI-CD&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Reemark_CI-CD)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Reemark_CI-CD&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Reemark_CI-CD)

a todo api

## how to run

```
npm install
npm start
```

## lint

```
npm run lint
```

## tests

```
npm test
npm run test:coverage
```

## ci

GitHub Actions runs automatically on push and pull requests:

- `lint` with ESLint
- tests with coverage threshold (>= 70%)
- secret scanning with Gitleaks
- vulnerability scanning with Trivy (HIGH/CRITICAL)
- code quality analysis with SonarCloud

## deployment

- `GET /health` returns HTTP `200` with `{ "status": "ok" }`
- deployment workflows: `.github/workflows/deploy-staging.yml` and `.github/workflows/deploy-prod.yml`
- automatic deployment is triggered on every push to `main`

Set these GitHub repository secrets to enable deployment:

- `DEPLOY_HOOK_URL`: deploy webhook URL from your platform (Render/Railway/etc.)
- `APP_HEALTHCHECK_URL`: public URL to check health (example: `https://your-app.example.com/health`)

## sonarcloud setup

Add these in GitHub repository settings:

- Secret: `SONAR_TOKEN`
- Variable: `SONAR_ORGANIZATION`
- Variable: `SONAR_PROJECT_KEY`

Without these values, the SonarCloud job is skipped automatically.
