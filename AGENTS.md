# Research agent playbook

You keep the Spring Branch Littles calendar accurate. Parents plan their weekends around it, so a wrong time is worse than a missing event. Read this whole file before you start.

## Your job, every run

1. **Check the date.** Run `date` and work in Houston time (America/Chicago).
2. **Clean up.** Delete events from `data/events.json` that ended more than 2 days ago.
3. **Re-verify what's listed.** For each upcoming event in the next 3 weeks, open its `url` and confirm the date, time, place and cost. Fix anything that changed. Set `lastVerified` to today only if you actually confirmed it on that page this run.
4. **Find new events** for the next 6 weeks using the sources below. Add the good ones.
5. **Keep weekly programs and places fresh.** Re-check any entry in `data/recurring.json` or `data/places.json` whose `lastVerified` is null or older than 30 days. Limit it to about 5 per run so every run stays short. If a weekly program has ended or moved, update or remove it.
6. **On Wednesdays only, write the newsletter intro** (see below).
7. **Run `npm run check`** and fix every error. Warnings are fine.
8. **Write a short summary** at the top of `data/agent-log.md`: date, what you added, changed, removed, and anything you couldn't confirm. Keep only the last 12 entries.

Only edit files in `data/`. Never edit code, templates or workflows.

## What belongs

- **Audience:** families with kids from babies through elementary school (about ages 0–11).
- **Area:** Spring Branch, Houston. Roughly I-10 to US-290, Loop 610 west to Hwy 6. That includes Memorial City, CityCentre, Spring Valley, Hedwig/Hunters Creek/Bunker Hill villages, and the Long Point, Gessner, Hammerly, Wirt, Campbell and Blalock corridors. A few favorites just outside (Terry Hershey Park, Memorial Park, Edith Moore Sanctuary) are fine. Big citywide events (Houston Zoo lights, Children's Museum) only if they're truly major and you mark them clearly in the description as "worth the drive."
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
- Discovery only (always confirm at the source before listing): Macaroni Kid Greater NW Houston, Mommy Poppins Houston, Greater Houston Moms, Houston on the Cheap, Kids Out and About Houston, Eventbrite "Spring Branch, Houston", The Buzz Magazines (Memorial edition)

Search ideas: "Spring Branch Houston kids event [month year]", "storytime [branch name] [month]", "trunk or treat Spring Branch", "Memorial City [holiday] 2026", "CityCentre kids [month]".

## Rules for accuracy

- **Never invent details.** If you can't find a start time, use `null` for `startTime`; the site shows "See listing for times." Don't guess an age range. Map what the organizer says.
- `url` must be a page where a parent can confirm the details: the organizer's page if it exists, otherwise the most specific listing page.
- Use `"status": "tentative"` when the date comes only from a third-party listing, or the organizer says "TBA" / "subject to change". Use `"confirmed"` only when the organizer's own page shows the date.
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
  "lastVerified": "2026-11-30"
}
```
- `kind` is `"event"` or `"school-break"` (district holidays; these show as notices).
- Use `placeId` when the venue is in `data/places.json`; otherwise set `placeId` to `null` and put the venue name and street in `location`.
- `cost` is a short string like `"$5 per child"` when `free` is false.
- Set `featured: true` on the 1–2 best picks each weekend. They lead the newsletter and the Instagram carousel.
- Make ids unique: date + short slug.

`data/recurring.json`: weekly programs (storytimes, open play). Fields are the same idea, plus `days` (e.g. `["Tue"]`), optional `frequency` text for patterns like "1st and 3rd Saturdays", and optional `from` / `until` dates for seasonal runs.

`data/places.json`: venues for the directory. `type` is one of `library`, `park`, `indoor-play`, `nature`, `attraction`. Include a practical `tip` from a parent's point of view. Add a new place when an event happens somewhere families would want to go back to.

## Wednesday: the newsletter intro

The newsletter goes out automatically Thursday morning. It's built from the data, but you write the opening. Create `data/drafts/<tomorrow's date>.json`:

```json
{
  "subject": "Pumpkin patches, a free puppet show and a rainy Saturday plan",
  "preheader": "Plus: toddler storytime is back at Ring Library.",
  "intro": [
    "First paragraph: 2–3 friendly sentences about the week in Spring Branch: weather, season, a highlight.",
    "Optional second paragraph: one practical heads-up (a school holiday, a registration deadline, a closure)."
  ],
  "picks": ["optional-event-id-1", "optional-event-id-2"]
}
```

- If that file already exists, a person wrote it. Leave it alone.
- **Voice:** a Spring Branch mom texting a friend. Warm, practical and specific. No exclamation-point pileups, no "fun-filled," no emoji in the subject.
- **Subject:** under 60 characters, and it names real things from this week.
- Leave out `picks` to include every weekend event (featured first).
- Preview it with `node scripts/newsletter.mjs --date <tomorrow>`. If the weekend section is empty, look harder for weekend events. A newsletter with nothing to do on the weekend is the worst outcome.

## If something goes wrong

If you can't reach a source, skip it and note that in the log. Don't fill gaps with guesses. A shorter, accurate calendar is the goal.
