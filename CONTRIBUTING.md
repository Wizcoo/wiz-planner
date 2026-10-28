# Contributing to Wiz Planner

Bug reports, usability feedback, translations, and pull requests are welcome.

## Development

Use Node.js 24 and npm. The standalone planner has no runtime dependencies:

```sh
npm ci
npm run planner:build
npm run dev
```

Open `http://localhost:3000` for the planner. `/legacy` contains the earlier Next.js / SQLite implementation.

Edit `planner/template.html`, `planner/style.css`, `planner/core.mjs`, and `planner/app.js`. Run `npm run planner:build` and include both generated HTML files with your changes. Do not edit the generated HTML directly.

## Before opening a pull request

```sh
npm run planner:build
npm test
npm run typecheck
npm run build
```

`npm test` creates an isolated directory in `.qa/` for database tests. The project database is not used. For UI changes, check task editing, calendar rendering, browser persistence, and exported HTML. Describe what you tested and any remaining limitations.

Keep the standalone page usable without a server, account, CDN, or network connection. Preserve independent deadlines, date-only calculations, import validation, and explicit storage failure feedback.

Do not commit databases, personal task exports, credentials, browser storage, or local environment files. Use synthetic data in reports and screenshots.

Contributions are submitted under the repository's MIT license.
