# Todo API

[![CI](https://github.com/Reemark/CI-CD/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/ci.yml)
[![Docker](https://github.com/Reemark/CI-CD/actions/workflows/docker.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/docker.yml)
[![Deploy Prod](https://github.com/Reemark/CI-CD/actions/workflows/deploy-prod.yml/badge.svg?branch=main)](https://github.com/Reemark/CI-CD/actions/workflows/deploy-prod.yml)
[![GHCR](https://img.shields.io/badge/GHCR-ci--cd-blue?logo=github)](https://github.com/orgs/Reemark/packages?repo_name=CI-CD)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Reemark_CI-CD&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Reemark_CI-CD)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Reemark_CI-CD&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Reemark_CI-CD)
[![UptimeRobot](https://img.shields.io/badge/UptimeRobot-monitoring-success)](https://uptimerobot.com/)

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
- matrix testing on Node.js 18 and 20
- API contract testing (`npm run test:contract`)
- secret scanning with Gitleaks
- vulnerability scanning with Trivy (HIGH/CRITICAL)
- code quality analysis with SonarCloud
- CI notifications on failure (Discord/Slack webhooks)
- observability / telemetry with Sentry (`SENTRY_DSN`)

## deployment

- `GET /health` returns HTTP `200` with `{ "status": "ok" }`
- deployment workflows: `.github/workflows/deploy-staging.yml` and `.github/workflows/deploy-prod.yml`
- automatic deployment is triggered on every push to `main`
- smoke tests are executed post-deploy (staging + production)
- rollback strategy is available through `PROD_ROLLBACK_HOOK_URL`

Set these GitHub repository secrets to enable deployment:

- `DEPLOY_HOOK_URL`: deploy webhook URL from your platform (Render/Railway/etc.)
- `APP_HEALTHCHECK_URL`: public URL to check health (example: `https://your-app.example.com/health`)

## sonarcloud setup

Add these in GitHub repository settings:

- Secret: `SONAR_TOKEN`
- Variable: `SONAR_ORGANIZATION`
- Variable: `SONAR_PROJECT_KEY`

Without these values, the SonarCloud job is skipped automatically.

## observability (sentry)

Set these variables in your runtime environment:

- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE` (example: `0.1`)

When configured, runtime errors are sent to Sentry.
