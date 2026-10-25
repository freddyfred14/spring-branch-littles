# Spring Branch Littles

The website, newsletter and Instagram content for **Spring Branch Littles**, a weekly guide to things to do with kids (babies through elementary school) in Spring Branch and Memorial, Houston.

Once it's set up, it runs on its own:

| When (Houston time) | What happens | Workflow |
|---|---|---|
| Mon ~7 am | A Claude agent researches events for the next 6 weeks, re-checks listings and updates `data/`. The site redeploys. | `research-agent.yml` |
| Wed ~7 am | Same, and the agent also writes Thursday's newsletter intro and subject line. | `research-agent.yml` |
| Thu ~6:45 am | The Instagram carousel is generated, the newsletter is sent through Buttondown, the issue is archived on the site, and the carousel is posted to Instagram. | `thursday.yml` |
| Every morning | The site rebuilds so "This week" always starts today. | `deploy.yml` |
| 1st of month | The Instagram access token is refreshed. | `refresh-instagram-token.yml` |

**Guardrails.** The agent can only search the web and edit files in `data/`. Every change must pass `npm run check` (required fields, valid dates, a source link on every listing) before it's committed. The newsletter won't send if it has fewer than 3 items. Each listing links to its source, and anything not confirmed by the organizer shows as "Not yet confirmed." If a run fails, GitHub emails you.

---

## One-time setup (about an hour)

### 1. Domain
Buy `springbranchlittles.com` (Cloudflare Registrar, Namecheap or Porkbun, about $10–12/year). If you use a different domain, change `url` in `site.config.json`.

### 2. GitHub repository and hosting
1. Create a GitHub account if you don't have one, and a **new repository** named `spring-branch-littles`. Private is fine.
2. Push this folder to it:
   ```sh
   git remote add origin https://github.com/<you>/spring-branch-littles.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, and set **Source** to **GitHub Actions**.
   GitHub Pages on a private repo needs a paid GitHub plan (Pro is $4/month). With a free account, make the repo public. The site is public anyway, and no secrets live in the code.
4. Still in **Settings → Pages**, enter `springbranchlittles.com` as the custom domain. Then at your registrar, add the DNS records GitHub shows you: four `A` records for the root domain and a `CNAME` for `www`. Tick **Enforce HTTPS** once it's available.
5. Go to **Settings → Actions → General → Workflow permissions** and choose **Read and write permissions**.

### 3. Newsletter (Buttondown)
1. Sign up at buttondown.com with the username `springbranchlittles`. That username is what the signup forms post to. If you pick a different one, change `buttondownUsername` in `site.config.json`.
2. Set the newsletter name, sender name, and a short welcome email. Turn on double opt-in.
3. API sending requires a paid plan (Basic, about $9/month). Go to **Settings → API** and copy the API key.
4. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret** and add `BUTTONDOWN_API_KEY`.
5. Optional review mode: add a repository **variable** (not a secret) `NEWSLETTER_STATUS` = `draft`. The Thursday email then lands in Buttondown as a draft for you to send. Delete the variable to go fully automatic.

### 4. The research agent (Claude)
1. Create an API key at console.anthropic.com and add some credit. A twice-weekly research run should cost a few dollars a month. Set a monthly spend limit in the console to be safe.
2. Add it as the repository secret `ANTHROPIC_API_KEY`.
3. Install the Claude GitHub app on the repo (github.com/apps/claude), or run `claude /install-github-app` from Claude Code.
4. Run the first refresh by hand: **Actions → Research agent → Run workflow**. Check the commit it makes and `data/agent-log.md`.

### 5. Instagram auto-posting (optional, can come later)
Until this is set up, the Thursday job still makes the carousel images and caption in `social/<date>/` (and on the site at `/social/<date>/slide-1.png`…) so you can post them by hand.

To post automatically:
1. Switch @springbranchlittles to a **Professional (Creator or Business) account** in the Instagram app.
2. At developers.facebook.com, create an app. Add the **Instagram** product and choose "API setup with Instagram login". Add the account as a tester, and generate a token with `instagram_business_basic` and `instagram_business_content_publish` permissions.
3. Add repository secrets `IG_USER_ID` (the Instagram account ID shown there) and `IG_ACCESS_TOKEN` (the long-lived token).
4. So the token renews itself, create a fine-grained GitHub personal access token for this repo with **Secrets: read and write**, and save it as the secret `GH_PAT`.

---

## Working on it yourself

Requires Node 20+.

```sh
npm run check              # validate data/
npm run build              # build the site into dist/
npm run serve              # preview at http://localhost:4321
npm run newsletter:preview # print this week's newsletter as Markdown
npm ci && npx playwright install chromium
npm run social             # make this weekend's carousel in social/
```

- **Add or fix a listing:** edit `data/events.json`, `data/recurring.json` or `data/places.json` (formats are in `AGENTS.md`), then commit. The site redeploys on every push.
- **Write the newsletter intro yourself:** create `data/drafts/YYYY-MM-DD.json` for the Thursday date. The agent won't overwrite one that's already there unless it's asked to.
- **Change what the agent does:** edit `AGENTS.md`. It's plain English.
- **Pause automation:** in **Actions**, open a workflow and choose **Disable workflow**.

## Project layout

```
data/            all content (the agent edits only this)
  events.json      dated events and school breaks
  recurring.json   weekly storytimes and open play
  places.json      directory of places
  drafts/          newsletter intros, one per Thursday
  issues/          sent newsletters (archived on the site)
  agent-log.md     what the agent did each run
src/             templates and logic (no dependencies)
scripts/         build, newsletter, social and Instagram scripts
public/          CSS, JS, favicon, link-preview image
social/          generated Instagram carousels
AGENTS.md        instructions for the research agent
```
