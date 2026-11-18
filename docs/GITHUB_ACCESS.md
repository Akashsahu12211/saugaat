# GitHub connection and first push

Repository: https://github.com/Akashsahu12211/saugaat

## Connector status on 18 November 2026
- Repository exists and is **public**.
- GitHub connector can read its metadata but `create_file` returned `403 Resource not accessible by integration`.
- The connected GitHub App installation list only includes organization `HackIndiaXYZ`, **not** personal account `Akashsahu12211`.
- No commits were made by the assistant. The repository is empty until the connection is authorized or the source is manually pushed.

## Fix GitHub connector authorization
1. In GitHub, open **Settings → Applications → Installed GitHub Apps**.
2. Find the ChatGPT/GitHub connector application and configure or install it for your **personal account** `Akashsahu12211`.
3. Give it permission to access repository `saugaat` (or all repositories if you intentionally prefer that). Ensure the connector has **Contents: Read and write** permissions.
4. Reconnect/refresh GitHub in ChatGPT's plugin settings if needed. Do not share GitHub access tokens in chat.

## Manual bootstrap while write access is blocked
Extract the project ZIP and open the extracted `saugaat-starter` folder in Git Bash or a terminal:

```bash
git init
git branch -M main
git add .
git commit -m "feat: bootstrap Saugaat with anonymous reservations and RSVP"
git remote add origin https://github.com/Akashsahu12211/saugaat.git
git push -u origin main
```

For a public repository, audit the files before pushing. `.env` is in `.gitignore`; **do not commit credentials**.

## Source runtime requirements
Use Node.js 22.18+ or a compatible Node.js 24 release, PostgreSQL and a securely generated `SESSION_SECRET`. Run `npm install`, `npm run db:generate`, `npx prisma db push`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev`.

GitHub CI configuration is included but it has **not run** until the repo receives commits. Contract tests test source invariants; they do not prove runtime behaviour.
