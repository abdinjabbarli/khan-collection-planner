# Deploying to Netlify

This guide connects the GitHub repository to Netlify. Nothing is deployed until you complete these steps yourself.

## 1. Merge the branch into main on GitHub

1. Open https://github.com/abdinjabbarli/khan-collection-planner.
2. Click **Pull requests**, then **New pull request**.
3. Set **base: main** and **compare: claude/eloquent-keller-vh55dg**.
4. Click **Create pull request**, review the changes, and click **Create pull request** again.
5. Click **Merge pull request**, then **Confirm merge**. Use a normal merge; do not force push.

## 2. Create the site in Netlify

1. Log in at https://app.netlify.com.
2. Click **Add new site**, then **Import an existing project**.
3. Choose **GitHub** and authorise Netlify if asked.
4. Pick **abdinjabbarli/khan-collection-planner**.
5. Set the branch to deploy to **main**.
6. Build settings are read from `netlify.toml`: build command `npm run build`, publish directory `dist`. Leave them as shown.
7. Click **Deploy**.

## 3. Verify

1. Wait for the deploy status to show **Published**.
2. Click the site URL shown at the top of the site page.
3. Confirm the app loads, and reload a page to confirm there is no 404.

## 4. Later updates

Netlify watches the `main` branch. Every merge into `main` triggers a new build and deploy automatically. Pull requests can also get deploy previews.

## 5. Troubleshooting

- **Blank page**: open the browser developer console for errors; confirm the publish directory is `dist`; confirm the build completed.
- **Node version errors**: `netlify.toml` sets `NODE_VERSION = "22"`. Check the build log shows Node 22.
- **Build failed**: in Netlify open **Deploys**, click the failed deploy, and read the **Deploy log**. Run `npm run build` locally to reproduce.
- **404 on reload**: confirm `netlify.toml` is in the repo root and contains the `/* -> /index.html` 200 redirect.
