# Todo API

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
- deployment workflow: `.github/workflows/deploy.yml`
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
