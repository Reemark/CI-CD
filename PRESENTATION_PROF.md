# Dossier De Soutenance - CI/CD Todo API

Objectif: avoir un document que tu peux lire devant le prof et qui prouve, point par point, ce que tu as fait.

## 1) Pipeline CI (20 pts)

### Exigence
- GitHub Actions doit tourner automatiquement
- Le lint doit passer
- Aucun secret hardcode (mot de passe, API key, token)

### Probleme initial (avant)
- Pas de pipeline CI complet
- Secrets presents en dur dans le code
- Endpoint debug qui exposait des infos sensibles

### Ce qui a ete fait (exact)
1. Ajout du workflow CI: `.github/workflows/ci.yml`
2. Ajout du lint avec ESLint:
   - script `lint` dans `package.json`
   - config ESLint dans `eslint.config.cjs`
3. Suppression des secrets hardcodes:
   - `app.js`: suppression des constantes secretes et suppression endpoint `/debug`
   - `database/database.js`: suppression du mot de passe hardcode
4. Ajout scan de secrets dans CI:
   - job `secret-scan` avec Gitleaks
5. Durcissement du code:
   - `routes/todo.js`: suppression de `eval` et requete SQL parametree

### Fichiers touches
- `.github/workflows/ci.yml`
- `package.json`
- `eslint.config.cjs`
- `app.js`
- `database/database.js`
- `routes/todo.js`

### Commandes de preuve
```bash
npm run lint
```

### Ce que tu montres au prof
- Onglet `Actions` > workflow `CI` vert
- Job `lint` vert
- Job `secret-scan` vert

### Phrase orale courte
"J ai mis en place une CI automatique, j ai active le lint, j ai supprime les secrets hardcodes, et j ai ajoute un scan de secrets avec Gitleaks."

---

## 2) Tests + Couverture >= 70% (25 pts)

### Exigence
- Ecrire des tests
- Les tests doivent passer
- Couverture >= 70%

### Ce qui a ete fait (exact)
1. Ajout des dependances de test:
   - `jest`
   - `supertest`
2. Ajout des scripts:
   - `npm test`
   - `npm run test:coverage`
3. Ajout de tests API dans `tests/todo-api.test.js`:
   - `GET /` (message accueil)
   - `GET /health` (status 200)
   - `POST /todos` sans title => 422
   - Flux CRUD complet (create, read, list, search, update, delete)
   - Cas erreurs 404 sur ID inexistant
4. Seuil coverage impose dans `package.json`:
   - statements: 70
   - lines: 70
   - functions: 70
   - branches: 60
5. Adaptation du code pour tester proprement:
   - `app.js`: ne lance le serveur que si execution directe
   - `database/database.js`: support `TODO_DB_PATH` + `resetDb()` pour isolation des tests
6. Exclusion des rapports de coverage pour eviter faux calcul:
   - `!**/coverage/**` dans Jest
   - `coverage/**` ignore ESLint
   - `coverage/` dans `.gitignore`

### Resultat obtenu
- Couverture globale observee: environ `94%` (au dessus de 70%)

### Fichiers touches
- `tests/todo-api.test.js`
- `package.json`
- `package-lock.json`
- `app.js`
- `database/database.js`
- `eslint.config.cjs`
- `.gitignore`

### Commandes de preuve
```bash
npm test
npm run test:coverage
```

### Ce que tu montres au prof
- `PASS` des tests
- Tableau coverage > 70%

### Phrase orale courte
"J ai ecrit des tests API complets, j ai impose un seuil de couverture dans la CI, et j atteins environ 94% de couverture."

---

## 3) Docker + GHCR (15 pts)

### Exigence
- Creer un Dockerfile
- Builder l image
- Publier sur GHCR

### Ce qui a ete fait (exact)
1. Creation de `Dockerfile`:
   - base `node:20-alpine`
   - `npm ci --omit=dev`
   - expose port `3000`
   - commande de lancement `npm start`
2. Creation de `.dockerignore`:
   - exclusion `node_modules`, `coverage`, `.git`, `tests`, etc.
3. Build image local:
   - tag GHCR: `ghcr.io/reemark/ci-cd:latest`
4. Publication GHCR:
   - login avec PAT GitHub
   - push image sur GHCR

### Fichiers touches
- `Dockerfile`
- `.dockerignore`

### Commandes de preuve
```bash
docker build -t ghcr.io/reemark/ci-cd:latest .
echo TON_PAT_GITHUB | docker login ghcr.io -u Reemark --password-stdin
docker push ghcr.io/reemark/ci-cd:latest
docker image ls ghcr.io/reemark/ci-cd
```

### Execution locale du conteneur
```bash
docker run --rm -p 3001:3000 ghcr.io/reemark/ci-cd:latest
```
Puis tester:
- `http://localhost:3001/`
- `http://localhost:3001/health`

### Ce que tu montres au prof
- Onglet GitHub `Packages`
- image `ghcr.io/reemark/ci-cd:latest`

### Phrase orale courte
"J ai conteneurise l app, construit l image et publie le package Docker sur GitHub Container Registry."

---

## 4) Securite et Qualite (20 pts)

### Exigence
- Integrer un scan securite (Trivy, Bandit...)
- Integrer SonarCloud

### Ce qui a ete fait (exact)
1. Ajout job Trivy dans CI:
   - job `trivy-scan`
   - scan filesystem
   - severites `HIGH,CRITICAL`
   - echec du job si vuln detectee
2. Ajout job SonarCloud dans CI:
   - job `sonarcloud`
   - lance tests coverage puis envoie `coverage/lcov.info`
3. Correction d un bug de workflow Sonar:
   - condition refaite au niveau steps pour eviter erreur YAML
4. Correction des vulns detectees par Trivy:
   - `lodash` -> `4.17.21`
   - `moment` -> `2.29.4`

### Fichiers touches
- `.github/workflows/ci.yml`
- `package.json`
- `package-lock.json`
- `README.md`

### Commande Trivy locale (cmd Windows)
```bat
docker run --rm -v "%cd%:/workdir" aquasec/trivy:latest fs --severity HIGH,CRITICAL --ignore-unfixed /workdir
```

### Variables a configurer pour SonarCloud (GitHub)
- Secret: `SONAR_TOKEN`
- Variable: `SONAR_ORGANIZATION`
- Variable: `SONAR_PROJECT_KEY`

### Phrase orale courte
"J ai ajoute Trivy et SonarCloud dans la CI, puis j ai corrige les vulnerabilities remontees pour passer le scan."

---

## 5) Deploiement (20 pts)

### Exigence
- URL publique accessible
- `/health` doit renvoyer 200
- Un push sur la branche cible doit declencher le deploiement auto

### Ce qui a ete fait (exact)
1. Ajout endpoint sante:
   - `app.js` -> `GET /health` retourne `200` + `{ "status": "ok" }`
2. Ajout workflow de deploiement:
   - `.github/workflows/deploy.yml`
   - declenchement sur `push` de la branche cible (par defaut `main`)
3. Verification post-deploiement:
   - ping de l URL publique `/health`
   - boucle de retry jusqu a `200`
4. Parametrage secret pour deploy:
   - `DEPLOY_HOOK_URL` (webhook plateforme, ex Render)
   - `APP_HEALTHCHECK_URL` (URL publique `/health`)

### Fichiers touches
- `.github/workflows/deploy.yml`
- `app.js`
- `README.md`

### Commande de preuve
```bash
curl -i https://ton-app.onrender.com/health
```
Attendu: HTTP `200`

### Phrase orale courte
"Le deploiement est automatise par GitHub Actions, et la verification finale se fait par un health check public."

---

## 6) Inventaire global des fichiers ajoutes/modifies

### Fichiers ajoutes
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `eslint.config.cjs`
- `tests/todo-api.test.js`
- `Dockerfile`
- `.dockerignore`
- `package-lock.json`
- `PRESENTATION_PROF.md`

### Fichiers modifies
- `app.js`
- `database/database.js`
- `routes/todo.js`
- `package.json`
- `README.md`
- `.gitignore`

---

## 7) Script de demonstration rapide (ordre soutenance)

```bash
cd c:\Users\lorde\OneDrive\Documents\CD\todo-api-node
npm install
npm run lint
npm test
npm run test:coverage
docker build -t ghcr.io/reemark/ci-cd:latest .
docker run --rm -p 3001:3000 ghcr.io/reemark/ci-cd:latest
```

Dans un autre terminal:
```bash
curl -i http://localhost:3001/health
```

Puis sur GitHub:
- `Actions` (CI, Trivy, SonarCloud, Deploy)
- `Packages` (image GHCR)

---

## 8) Questions probables du prof et reponses courtes

### "Comment tu prouves que tu n as pas de secret hardcode ?"
- "J ai retire les secrets du code (`app.js`, `database/database.js`) et j ai ajoute Gitleaks dans la CI."

### "Comment tu prouves la qualite ?"
- "Lint + tests + seuil de couverture impose dans la CI + SonarCloud."

### "Pourquoi Trivy et pas un autre ?"
- "Trivy est simple a integrer dans GitHub Actions et couvre vite les dependances vuln."

### "Comment tu prouves l auto deploy ?"
- "Le workflow `deploy.yml` se declenche sur push de la branche cible et verifie `/health` en 200."

