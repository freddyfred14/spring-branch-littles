# Spring Branch Littles

The website, newsletter and Instagram content for **Spring Branch Littles**, a weekly guide to things to do with kids (babies through elementary school) in Spring Branch and Memorial, Houston.

Once it's set up, it runs on its own:

| When (Houston time) | What happens | Workflow |
|---|---|---|
| Sat ~8 am | Every link on the site is checked; the report goes to `reports/link-report.md`. | `link-check.yml` |
| Sun ~7 am | A Claude agent researches events for the next 6 weeks, fixes bad links, re-checks listings, updates `data/` and writes Monday's newsletter intro and subject line. The site redeploys. | `research-agent.yml` |
| Mon ~6:45 am | The newsletter (the next two weeks of plans) is sent through Buttondown and archived on the site. | `newsletter.yml` |
| Wed ~7 am | Mid-week research refresh. | `research-agent.yml` |
| Tue ~8 am | Agent Reach reads the numbers, writes the week's growth plan and posts, publishes a guide, updates the City Launch Playbook, and emails you a checklist. | `agent-reach.yml` |
| Fri ~8 am | Agent Reach sends a short weekend pulse: 1–3 quick actions. | `agent-reach.yml` |
| Thu ~6:45 am | The weekend Instagram carousel is made and posted, and the weekend app alert goes out. | `weekend-social.yml` |
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
5. Optional review mode: add a repository **variable** (not a secret) `NEWSLETTER_STATUS` = `draft`. The Monday email then lands in Buttondown as a draft for you to send. Delete the variable to go fully automatic.

6. **Send new subscribers to your own thank-you page:** in Buttondown, open the subscribing settings and set the page people see after subscribing (the "redirect" or "after subscribing" URL) to `https://springbranchlittles.com/thanks/`.
7. **Make `hello@springbranchlittles.com` work:** the address is shown on the site. Set up free email forwarding to your Gmail, either in GoDaddy (Email Forwarding, if your plan includes it) or with a free forwarding service such as ImprovMX, which gives you two MX records to add in GoDaddy's DNS.

### 4. The research agent (Claude)
1. Create an API key at console.anthropic.com and add some credit. A twice-weekly research run should cost a few dollars a month. Set a monthly spend limit in the console to be safe.
2. Add it as the repository secret `ANTHROPIC_API_KEY`.
3. Install the Claude GitHub app on the repo (github.com/apps/claude), or run `claude /install-github-app` from Claude Code.
4. Run the first refresh by hand: **Actions → Research agent → Run workflow**. Check the commit it makes and `data/agent-log.md`.

### 5. Instagram auto-posting (optional, can come later)
Until this is set up, the Thursday weekend job still makes the carousel images and caption in `social/<date>/` (and on the site at `/social/<date>/slide-1.png`…) so you can post them by hand.

To post automatically:
1. Switch @springbranchlittles to a **Professional (Creator or Business) account** in the Instagram app.
2. At developers.facebook.com, create an app. Add the **Instagram** product and choose "API setup with Instagram login". Add the account as a tester, and generate a token with `instagram_business_basic` and `instagram_business_content_publish` permissions.
3. Add repository secrets `IG_USER_ID` (the Instagram account ID shown there) and `IG_ACCESS_TOKEN` (the long-lived token).
4. So the token renews itself, create a fine-grained GitHub personal access token for this repo with **Secrets: read and write**, and save it as the secret `GH_PAT`.

### 6. Event illustrations (optional)
Every upcoming event and weekly program without a photo gets an AI illustration from OpenAI's image API. The research agent writes a short scene description (`imagePrompt`) for each new event, and the **Event images** workflow turns it into a picture after every research run.
1. At platform.openai.com, create an API key and add a few dollars of credit (each image costs roughly 4–20¢). You may need to verify your organization before image models are available. Set a monthly budget limit there.
2. Add it as the repository secret `OPENAI_API_KEY`.
3. Run it the first time by hand: **Actions → Event images → Run workflow**. It makes up to 30 images per run and redeploys the site.
4. Optional repository variables: `OPENAI_IMAGE_MODEL` (by default it uses the newest image model your account has), `OPENAI_IMAGE_QUALITY` (`low`, `medium` or `high`; default `medium`) and `MAX_IMAGES`.

To redo one image, delete its file in `public/img/events/` and its `image`, `imageAlt` and `imageCredit` lines in the data file, edit its `imagePrompt` if you like, then run the workflow again. A real photo you add yourself always wins: items with an `image` are skipped.

### 7. The app and alerts
The site installs as a phone app from **springbranchlittles.com/app/** (iPhone: Share → Add to Home Screen; Android: Install). It works offline for pages you've opened. Alerts (push notifications) go through OneSignal, which is free at this size:
1. Make sure **Enforce HTTPS** is ticked in **Settings → Pages**. Alerts only work over https.
2. Sign up at onesignal.com and create an app. Choose **Web**, then **Typical Site**. Enter the site URL `https://springbranchlittles.com`, upload `public/icons/icon-192.png` as the default icon, and leave the prompt settings off (the site has its own "Turn on alerts" button). Turn on **Safari web push** if it's offered as a separate option.
3. Copy the **App ID** into `oneSignalAppId` in `site.config.json` (it's public, not a secret) and commit. Or send it to Claude.
4. In OneSignal, under **Settings → Keys & IDs**, create an **API key** and add it to GitHub as the repository secret `ONESIGNAL_API_KEY`.

Every Thursday morning, everyone with alerts on gets the weekend's picks. To send your own alert (a rain plan, a last-minute event), use **Actions → Send app alert → Run workflow**. Keep them rare, about one a week, so people keep alerts on.

### 8. Agent Reach (growth)
Agent Reach is head of growth for the Littles network, with Spring Branch as the pilot. Tuesdays it reads the numbers (including which channel every new subscriber came from), scores experiments, writes a plan with ready-to-paste posts in `reach/`, publishes a search-friendly guide at `/guides/`, and keeps `reach/city-playbook.md`, the recipe for launching the next city. It opens a GitHub issue with your checklist (GitHub emails it). Fridays it sends a short weekend pulse. Its playbook is `REACH.md`; edit it to change priorities, time or budget.
1. It uses the same `ANTHROPIC_API_KEY` as the research agent, on Claude Opus by default (about $3–8 a week for both runs). Set the repository variable `REACH_MODEL` to `claude-sonnet-5-5` to spend less.
2. To get the plan emails: on the repo page, click **Watch → Custom → Issues → Apply**.
3. Numbers it reads (each optional): `BUTTONDOWN_API_KEY` (subscribers, signups by channel, open and click rates), `IG_ACCESS_TOKEN` (followers), and site visits through GoatCounter: sign up free at goatcounter.com with the code `springbranchlittles`, put that code in `goatcounterCode` in `site.config.json`, create an API token (Settings → API, "Read statistics") and add it as the secret `GOATCOUNTER_TOKEN`.
4. Every signup form records where the person came from: the `?source=` tag on the link they used (ads, group posts, flyers), or the site that sent them. Always use the tagged links from the kits.
5. Kick it off: **Actions → Agent Reach → Run workflow**. The first run writes the strategy, the experiment board, the targets list and the first City Launch Playbook.
6. Each week, do the checklist and comment on the issue with what you did and saw ("posted in Spring Shadows Moms, 15 signups"). Add those notes to `reach/log.md` (or tell Claude) so it learns.

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
- **Write the newsletter intro yourself:** create `data/drafts/YYYY-MM-DD.json` for the Monday date. The agent won't overwrite one that's already there unless it's asked to.
- **Add a photo:** the easiest way is to send it to Claude in chat with the credit line. To do it yourself, save a JPG (about 1400px wide) in `public/img/<news|events|places|eats|gallery>/`, then add `"image": "/img/places/haden-park.jpg"`, `"imageAlt"` (what's in the photo) and `"imageCredit"` (whose photo it is) to that item. For the homepage photo strip, add entries to `data/gallery.json` with `image`, `imageAlt`, `imageCredit` and a short `caption`; it appears once there are 3 or more.
- **Add a restaurant logo:** save it (PNG or SVG, square-ish, at least 200px) in `public/img/eats/logos/`, then add `"logo": "/img/eats/logos/feges-bbq.png"` to that restaurant in `data/restaurants.json`. Use the logo from the restaurant's own website or social profile. Until then, cards show a badge with the restaurant's initials.
- **Change what the agent does:** edit `AGENTS.md`. It's plain English.
- **Pause automation:** in **Actions**, open a workflow and choose **Disable workflow**.

## Project layout

```
data/            all content (the agent edits only this)
  events.json      dated events and school breaks
  recurring.json   weekly storytimes and open play
  places.json      directory of places
  drafts/          newsletter intros, one per Monday
  issues/          sent newsletters (archived on the site)
  agent-log.md     what the agent did each run
src/             templates and logic (no dependencies)
scripts/         build, newsletter, social and Instagram scripts
public/          CSS, JS, favicon, link-preview image
social/          generated Instagram carousels
AGENTS.md        instructions for the research agent
REACH.md         instructions for Agent Reach (growth)
reach/           Agent Reach's strategy, weekly plans, posts, targets and numbers
```
