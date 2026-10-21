# Deploying to Netlify

This guide connects the GitHub repository to Netlify. Nothing is deployed until you complete these steps yourself; no secrets or tokens are needed.

## 1. Branch workflow

1. Work on a branch (not directly on `main`) and push it to GitHub.
2. On GitHub, open **Pull requests > New pull request** with **base: main** and **compare: your working branch**.
3. Once Netlify is connected, review the **deploy preview** it adds to the pull request.
4. Merge with a normal merge commit (**Merge pull request**, then **Confirm merge**).
5. Never force-push, especially to `main`.
6. Netlify auto-deploys `main` after every merge.

## 2. First-time Netlify setup

1. Log in at https://app.netlify.com.
2. Click **Add new site**, then **Import an existing project**.
3. Choose **GitHub** and authorise Netlify if asked.
4. Pick this repository (`khan-collection-planner`).
5. Set the production branch to **main**.
6. Build settings are read from `netlify.toml`; leave them as shown:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 22
7. Click **Deploy**.

## 3. Verify

1. Wait until the deploy status shows **Published**.
2. Open the site URL shown on the site page.
3. Confirm the app loads and the "Get started" section appears on a first visit.
4. Reload the page and confirm there is no 404.
5. Work through [TESTING.md](TESTING.md).

To check the build locally first: `npm run build`, then `npm run preview`.

## 4. Later updates

Every merge into `main` triggers a new build and deploy. Pull requests get deploy previews.

## 5. Troubleshooting

- **Blank page**: open the browser developer console for errors; confirm the publish directory is `dist` and the build completed.
- **Node version errors**: `netlify.toml` sets `NODE_VERSION = "22"`. Check the build log shows Node 22.
- **Build failed**: in Netlify open **Deploys**, click the failed deploy and read the deploy log. Run `npm run build` locally to reproduce; type errors fail the build.
- **404 on reload**: confirm `netlify.toml` is in the repository root and contains the `/*` to `/index.html` redirect with status 200.
- **Data missing after deploy**: data is stored per browser and per site address in `localStorage`; a new site URL starts empty.
- **Deploy preview not appearing**: check that Netlify has access to the repository (GitHub > Settings > Applications) and that deploy previews are enabled in the site settings.
