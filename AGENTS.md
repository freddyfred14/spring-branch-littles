# Research agent playbook

You keep the Spring Branch Littles calendar accurate. Parents plan their weekends around it, so a wrong time is worse than a missing event. Read this whole file before you start.

## Your job, every run

1. **Check the date.** Run `date` and work in Houston time (America/Chicago).
2. **Clean up.** Delete events from `data/events.json` that ended more than 2 days ago.
   **Fix bad links.** Read `reports/link-report.md`, written by the Sunday link check. For every row marked BROKEN or WRONG PAGE, find the organizer's page for that specific event or place and update its `url`. A "Client Challenge" title or a 403 usually means the site blocks robots but works for people; leave those alone. A link must take a parent straight to the event, not to a homepage or a general calendar, whenever such a page exists.
3. **Re-verify what's listed, and catch what's missing.** Open each library branch's own calendar (HCPL Spring Branch Memorial; HPL Ring and Hillendahl) and make sure every kids' program on it is in `events.json` or `recurring.json`. For each upcoming event in the next 3 weeks, open its `url` and confirm the date, time, place and cost. Fix anything that changed. Set `lastVerified` to today only if you actually confirmed it on that page this run.
4. **Find new events** for the next 6 weeks using the sources below. Aim for at least 8–12 Spring Branch & Memorial events in the next 3 weeks (at least 2 on the coming weekend), plus 3–6 Surrounding Houston events. Holidays, school breaks and seasonal events (Halloween, Thanksgiving week, Santa visits, tree lightings, spring festivals) are what parents search for most.
5. **Keep weekly programs and places fresh.** Re-check any entry in `data/recurring.json` or `data/places.json` whose `lastVerified` is null or older than 30 days. Limit it to about 5 per run so every run stays short. If a weekly program has ended or moved, update or remove it.
6. **Check kids' deals and restaurants** in `data/deals.json` and `data/restaurants.json` (see "Kid-friendly eats" below). Re-verify every deal at least every 2 weeks, and add new ones you find.
7. **Update neighborhood news** in `data/news.json` (see "Neighborhood news" below). Add 2–4 new items each week, and remove items older than 90 days or past their `expires` date.
8. **On Sundays only, write the newsletter intro** (see below).
9. **Run `npm run check`** and fix every error. Warnings are fine.
10. **Write a short summary** at the top of `data/agent-log.md`: date, what you added, changed, removed, and anything you couldn't confirm. Keep only the last 12 entries.

Only edit files in `data/`. Never edit code, templates or workflows.

## What belongs

- **Audience:** families with kids from babies through elementary school (about ages 0–11).
- **Area:** Spring Branch and Memorial, Houston. Roughly I-10 to US-290 from Loop 610 west to Hwy 6, plus everything south of I-10 to Buffalo Bayou / Westheimer: the Memorial area, Memorial City, CityCentre / Town & Country, the Memorial Villages (Hedwig, Hunters Creek, Bunker Hill, Piney Point, Spring Valley), Memorial Park and the Houston Arboretum, Briar Forest, and Terry Hershey Park / the Energy Corridor. Events elsewhere in Houston go in the separate **Surrounding Houston** section (`"area": "houston"`): pick the big, genuinely family-worthy ones (Children's Museum, Zoo, Botanic Garden, Discovery Green, Miller Outdoor Theatre, major holiday events, kids' shows).
- **Good fits:** library storytimes and kids' programs, park and nature programs, festivals, holiday events, school-break camps, free indoor play, kids' classes with drop-in sessions, church or school events open to the public, farmers markets with kids' activities.
- **Leave out:** anything adults-only, multi-week classes that need a long commitment (unless it's a notable registration deadline), private parties, MLM/vendor pitches, events with no public source page.

## Sources to check

Start with the organizers' own calendars, then use listing sites to discover events and confirm them at the source.

- Harris County Public Library events (Spring Branch Memorial branch): hcpl.net
- Houston Public Library calendar (Ring, Hillendahl, Spring Branch-area branches): houstonlibrary.org / calendar.houstonlibrary.org
- Houston Parks & Recreation: houstontx.gov/parks
- Harris County Precinct 4 parks events: hcp4.net
- Houston Audubon / Edith L. Moore Nature Sanctuary: houstonaudubon.org
- Spring Branch ISD calendar (school holidays, family events): springbranchisd.com
- Memorial City: memorialcity.com · CityCentre: citycentrehouston.com
- Spring Branch Management District: springbranchdistrict.com
- Memorial Villages, Spring Valley Village and Hedwig Village city websites
- Houston Arboretum & Nature Center (Tyke Hikes, Hatchlings, family days): houstonarboretum.org/events
- Memorial Park Conservancy event calendar: memorialparkconservancy.org/visit/event-calendar
- Memorial Villages city sites (bunkerhilltx.gov, hedwigtx.gov, hunterscreektx.org, pineypt.org, springvalleytx.com) and Memorial Villages Police Department
- Church and school events open to the public (trunk-or-treats, fall festivals, Christmas markets): search "Memorial Drive" + the event type
- Discovery only (always confirm at the source before listing): juliesheets.com (Memorial monthly calendars), Macaroni Kid Greater NW Houston, Mommy Poppins Houston, Greater Houston Moms, Houston on the Cheap, Kids Out and About Houston, Eventbrite "Spring Branch, Houston", The Buzz Magazines (Memorial edition)

Search ideas: "Memorial Houston kids events [month year]", "Spring Branch Houston kids event [month year]", "storytime [branch name] [month]", "trunk or treat Spring Branch", "Memorial City [holiday] 2026", "CityCentre kids [month]".

## Rules for accuracy

- **Never invent details.** If you can't find a start time, use `null` for `startTime`; the site shows "See listing for times." Don't guess an age range. Map what the organizer says.
- **`url` is always the organizer's own page** for that specific event: the venue, library, city, school, park conservancy, or the organizer's own Eventbrite/ticketing page. Never a blog, roundup, news listing or resale site (Mommy Poppins, Houston on the Cheap, CultureMap, juliesheets, Macaroni Kid, Yelp, Visit Houston, The Buzz…). `npm run check` rejects those. Use roundups only to *discover* events, then find the organizer's page. Put the roundup in `sources` if you like.
- If you can't find an organizer page that shows **this year's** date, don't list the event. Blogs often recycle last year's dates.
- Use `"status": "confirmed"` when the event is listed with a date by the organizer **or** by a reputable calendar or local publication (library and city calendars, Eventbrite, Mommy Poppins, Houston on the Cheap, Kids Out and About, The Buzz, neighborhood blogs). Use `"tentative"` only when the date itself is uncertain: the organizer says "TBA", sources give different dates, or it's a yearly event whose new date hasn't been announced. The site shows tentative events as "Date may change".
- If something is cancelled, remove it.
- If sources disagree, trust the organizer's page and note the conflict in the agent log.
- Don't copy marketing text. Write a fresh, plain description of under 300 characters: what kids actually do, and anything a parent needs (tickets, registration, parking, what to bring).

## Data formats

All dates are `YYYY-MM-DD`, times are 24-hour `HH:MM`. Ages use these keys: `baby` (0–1), `toddler` (1–3), `preschool` (3–5), `elementary` (5–11). Tag every age group the event suits.

`data/events.json`: one-off or dated events.
```json
{
  "id": "2026-12-05-citycentre-tree-lighting",
  "kind": "event",
  "title": "Tree lighting and Santa visit",
  "date": "2026-12-05",
  "endDate": null,
  "startTime": "17:00",
  "endTime": "20:00",
  "placeId": "citycentre",
  "location": null,
  "ages": ["baby", "toddler", "preschool", "elementary"],
  "free": true,
  "cost": null,
  "indoor": false,
  "description": "Live music, cocoa and a tree lighting at 7 pm. Santa photos on the plaza until 8.",
  "registration": null,
  "url": "https://example.com/the-organizers-page",
  "status": "confirmed",
  "featured": false,
  "area": "local",
  "lastVerified": "2026-11-30"
}
```
- `kind` is `"event"` or `"school-break"` (district holidays; these show as notices).
- `area` is `"local"` (Spring Branch, Memorial and the Villages; see "What belongs") or `"houston"` (everywhere else). The site shows them in separate sections.
- Use `placeId` when the venue is in `data/places.json`; otherwise set `placeId` to `null` and put the venue name and street in `location`.
- `cost` is a short string like `"$5 per child"` when `free` is false.
- Set `featured: true` on the 1–2 best picks each weekend. They lead the newsletter and the Instagram carousel.
- Make ids unique: date + short slug.

`data/recurring.json`: weekly programs (storytimes, open play). Fields are the same idea, plus `days` (e.g. `["Tue"]`), optional `frequency` text for patterns like "1st and 3rd Saturdays", and optional `from` / `until` dates for seasonal runs.

`data/places.json`: venues for the directory. `type` is one of `library`, `park`, `indoor-play`, `nature`, `attraction`. Include a practical `tip` from a parent's point of view. Add a new place when an event happens somewhere families would want to go back to.

## Kid-friendly eats

**Restaurants** (`data/restaurants.json`) belong on the list when they make eating out easier with kids: a play area or playground, a patio or lawn where kids can move, a real kids' menu, or a kid-delighting extra (free soft-serve, crayons-and-paper tables, a train that runs overhead). Spring Branch & Memorial spots are `"area": "local"`; standouts elsewhere in Houston are `"houston"`.

```json
{
  "id": "feges-bbq-spring-branch",
  "name": "Feges BBQ",
  "neighborhood": "Spring Branch",
  "address": "8217 Long Point Rd, Houston, TX 77055",
  "url": "https://the-restaurants-own-page",
  "perks": ["play-area", "patio", "kids-menu"],
  "price": "$$",
  "area": "local",
  "description": "What it's like with kids, in two sentences.",
  "tip": "One practical parent tip, or null.",
  "sources": ["https://where-you-confirmed-it"],
  "lastVerified": "2026-10-24"
}
```
- `perks` come from: `play-area`, `indoor-play`, `patio`, `lawn`, `kids-menu`, `free-treat`. Only list a perk you've seen confirmed (photos, the restaurant's site, or recent reviews).
- Weekly programs elsewhere in Houston (like classes at The Bunny Hive in the Heights) go in `recurring.json` with `"area": "houston"`; they show in the Surrounding Houston row.
- `price` is `$`, `$$` or `$$$`. Use `null` for `address` if you can't confirm it. `url` should be the restaurant's own website; never guess one, and replace Yelp or blog links when you find the real site.
- Remove restaurants that have closed or lost their play area.

**Kids' deals** (`data/deals.json`) are recurring promos like kids-eat-free nights. They change often. Find the deal on the restaurant's own site or social media and link that; replace any roundup links still in the file (the check warns about them).

```json
{
  "id": "feges-kids-eat-free-wed",
  "title": "Kids eat free",
  "restaurantId": "feges-bbq-spring-branch",
  "restaurantName": null,
  "where": null,
  "days": ["Wed"],
  "startTime": "17:00",
  "endTime": "20:00",
  "details": "Kids 12 and under eat free with an adult entrée.",
  "area": "local",
  "url": "https://where-a-parent-can-confirm",
  "status": "confirmed",
  "expires": null,
  "lastVerified": "2026-10-24"
}
```
- Use `restaurantId` when the restaurant is in `restaurants.json`. For chains, set `restaurantId` to `null`, put the chain in `restaurantName` and say which locations in `where` ("All Houston-area locations").
- `"status": "confirmed"` when the restaurant or a reputable, current deals roundup lists it; `"tentative"` when the only evidence is old or conflicting.
- Seasonal or limited-time promos (summer kids-eat-free, holiday specials) get an `expires` date.
- Prefer deals with a Spring Branch or Memorial location. Aim to have something on every day of the week.
- Remove a deal if you can't find any current evidence of it.

## Neighborhood news

Short, useful updates for parents in Spring Branch and Memorial. Each item is a 2–3 sentence summary **in your own words** with a link to the original story. Never copy an article's text or headline word for word.

**Good news items:** new or reopened playgrounds and parks; kid-friendly businesses opening or closing (play spaces, kids' classes, family restaurants with play areas); library changes (renovations, closures, new programs, canceled storytimes); SBISD announcements parents act on (registration windows, calendar changes, school-board decisions that affect families, bond projects at neighborhood schools); road or trail closures near parks; recalls or safety alerts that are widely relevant; community projects (new sidewalks to schools, park improvements).

**Leave out:** crime blotter and tragedies, politics and campaign news, real-estate prices, anything paywalled that parents can't read, and press releases with nothing new.

**Sources:** Spring Branch Management District news (sbmd.org/community/news), SBISD news (springbranchisd.com), Harris County Public Library and Houston Public Library news, Memorial Park Conservancy news, Houston Parks & Recreation, Community Impact (Memorial / Spring Branch coverage), Houston Chronicle, Houston Public Media, CultureMap Houston, The Buzz Magazines (Memorial), Memorial Villages city sites.

`data/news.json` format:
```json
{
  "id": "2026-11-02-haden-park-new-shade-sails",
  "date": "2026-11-02",
  "category": "parks",
  "title": "Haden Park's playground gets new shade sails",
  "summary": "Two or three plain sentences: what happened, when, and why a parent would care.",
  "url": "https://example.com/original-story",
  "source": "Spring Branch Management District",
  "area": "local",
  "expires": null,
  "featured": false,
  "story": null,
  "lastVerified": "2026-11-02"
}
```
- `category` is one of `openings`, `parks`, `schools`, `libraries`, `heads-up`, `community`.
- `date` is when the news came out, or today if unclear.
- Set `expires` for time-sensitive items (a closure, a registration deadline) so they disappear afterwards.
- Titles are under 120 characters, written like a friendly headline, not clickbait.

## Sunday: the newsletter intro

The newsletter ("The Littles List") goes out automatically Monday morning. It's **curated, not complete**: a short story of the week, the most compelling Spring Branch & Memorial events of the next two weeks (up to 6), a compact "Every week" list of local storytimes and weekly programs (added automatically from `recurring.json`, no photos), 2–3 restaurants, 2 blog articles, and school-break reminders. Everything else lives on the site's calendar. Don't call it a Monday letter. You choose what goes in and write the opening. Create `data/drafts/<tomorrow's date>.json`:

```json
{
  "subject": "Pumpkin patches, a free puppet show and a rainy Saturday plan",
  "preheader": "Plus: toddler storytime is back at Ring Library.",
  "intro": [
    "First paragraph: 2–3 friendly sentences about the next two weeks in Spring Branch: season, holidays, the highlights.",
    "Optional second paragraph: one practical heads-up (a school holiday, a registration deadline, a closure)."
  ],
  "picks": ["event-id-1", "event-id-2", "event-id-3", "event-id-4", "event-id-5"],
  "restaurants": ["restaurant-id-1", "restaurant-id-2", "restaurant-id-3"],
  "posts": ["post-id-1", "post-id-2"]
}
```

- If that file already exists, a person wrote it. Leave it alone.
- **Voice:** a Spring Branch mom texting a friend. Warm, practical and specific. No exclamation-point pileups, no "fun-filled," no emoji in the subject.
- **Subject:** under 60 characters, and it names real things from the next two weeks.
- **`picks`: up to 6 Spring Branch & Memorial events from the next two weeks** (dated events with `"area": "local"` only, from `events.json`), in date order. Never Surrounding Houston events: the newsletter is neighborhood-only, and those stay on the site. Choose what a parent would actually rearrange their weekend for: seasonal and one-time events, free festivals, things kids talk about afterward. At least one for each weekend when there is one, and a mix of ages. If fewer than 4 good local events are coming up, find more in step 4 before writing the draft. Skip ordinary weekly programs (they're on the calendar). If you leave `picks` out, the newsletter picks by a simple score, which is worse.
- **`restaurants`: 2–3 ids from `restaurants.json`**, different from last week's (check `data/issues/`). Favor one with a kids' deal in the coming week, and match the season (patios when it's mild, indoor play when it's hot or rainy).
- **`posts`: 2 blog articles from `data/posts.json`** (`"type": "article"`, the ones with cover photos), newest first, that haven't been in an issue yet. Use a quick read only when there aren't two articles left. Agent Reach writes them on Tuesdays.
- **Pick the story of the week.** Choose the most interesting news item for local parents, usually something new from the past week: an opening, a new playground, a big change at a school or library. Set `"featured": true` on it in `data/news.json`, set every other item to `"featured": false`, and give it a `story`: **1–2 short paragraphs, under 100 words in all**, in your own words. What's happening, when, and why a parent would care. That's it; readers click through for more. Only use facts from the source; don't add details. It opens the newsletter and gets the big card on the site. Never feature the same item two weeks in a row.
- Preview it with `node scripts/newsletter.mjs --date <tomorrow>`. Read it as a busy parent on a phone: under a 3-minute read, every pick worth the space. If a weekend has nothing local worth picking, look harder. A newsletter with nothing to do on a weekend is the worst outcome.

## Photos

Never download or add photos or logos yourself. Photos are added only by the site owner, who makes sure we have permission. If an item already has `image`, `imageAlt` and `imageCredit`, keep them unless the item is removed. When you notice a great photo opportunity (a new playground opening, a festival), mention it in the agent log so the owner can ask for one.

**Illustrations.** After your run, a separate job makes an AI illustration for every upcoming event and weekly program that has no `image`. For each new event or weekly program you add, write an `imagePrompt`: one or two sentences describing a happy scene of that activity, for example "A friendly librarian reads a picture book to a circle of preschoolers on a carpet in a bright library children's area." Describe kids of the right ages, the activity and the setting. Don't name the venue, brands or real people, and don't ask for text or signs; keep it under 600 characters. Don't write `image`, `imageAlt` or `imageCredit` yourself; the job fills them in.

## If something goes wrong

If you can't reach a source, skip it and note that in the log. Don't fill gaps with guesses. A shorter, accurate calendar is the goal.
