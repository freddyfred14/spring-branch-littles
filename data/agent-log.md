# Agent log

Newest first. The research agent adds an entry each run.

## 2026-10-30 · Friday weekend check

- Friday weekend check: confirmed 4, updated 1, removed 0. Confirmed on organizer pages: CityCentre trick-or-treat (Fri, 5–6:45 pm, rain or shine), Scream on the Green (Fri, 6–9 pm; costume contest needs pre-registration), Día de los Muertos at the Children's Museum (Sun, 9–5; several permanent galleries listed as temporarily closed), Wings Over Houston (Oct 31–Nov 1; gates 8 am, flying about 10:30).
- Weather (NWS): Sat 50% showers/storms, Sun dry. Wings Over Houston got a rain-plan note (flies unless severe, no rain date). Scream on the Green (Fri) showed no rain notice.
- No weekly programs run Fri–Sun in Spring Branch/Memorial, and no local weekend events are listed. Library calendars were not re-checked (not part of this check).

## 2026-10-28 · Wednesday calendar refresh (partial)

- Removed: Levy Park Howl-O-Ween (ended Oct 25).
- Fixed: library kids' Halloween party (Oct 29) is 4:15–5:15 pm per the branch page, not 5–7. CityCentre trick-or-treat details added (5–6:45 pm, Plaza show at 7). Standing Tall cost is $20 adult / $16 child, members free.
- Confirmed on organizer pages: CityCentre trick-or-treat, Scream on the Green (Oct 30, 6–9 pm), Día de los Muertos (Nov 1, now "confirmed"), Wings Over Houston (Oct 31–Nov 1; gate times not listed), Standing Tall (Nov 8).
- Couldn't confirm: Children's Museum Free Family Night (Oct 29). The page showed a 2023 date, so `lastVerified` was left alone. Check the museum's calendar.
- Library branch page now lists only Book Buddies (Wed 4:45–5:30) as a new item; not added, since its age range and frequency weren't shown. No November events were posted yet.
- Not done this run: new-event discovery, news refresh, deal and restaurant re-checks, link-report fixes, Zoo Boo/Arboretum/Deck the Hall/Holiday in the Plaza re-checks. Holiday in the Plaza stays tentative.

## 2026-10-25 · more local events for this week

- Added from the Spring Branch Memorial library branch page (hcpl.net/locations/sm/): Baby Bouncers playtime (Wednesdays 10:15 and 11:15), Halloween party for tweens & teens (Tue Oct 27, 4:30–5:30), Halloween party for kids 4–8 (Thu Oct 29, 5–7). The kids' party also appears on community calendars.
- Children's Museum Free Family Night (Oct 29) includes trick-or-treating and the Halloween Happy House, per the museum's calendar.
- Weekly local programs now appear in the homepage's This week row on their next date. The full Every week list is on the Calendar page.
- Leads that didn't check out: a Bayou City Fellowship trunk-or-treat (Cypress campus, not Spring Branch), "St. Timothy Lutheran" (different church), and Memorial Drive UMC (Tulsa).
- Worth checking each week: library branch pages (HCPL Spring Branch Memorial; HPL Ring, Hillendahl, Spring Branch-area branches), Houston Audubon's monthly "Cabin, Coffee, Conversation" Saturday at Edith Moore, Arboretum Hatchlings (select Wednesdays), CityCentre and Memorial City events pages, and church/school fall festivals near Memorial Dr and Long Point.

## 2026-10-25 · links now go to organizers; blog-only events removed

- Every event and weekly program now links to the organizer's own page. Blog/roundup links are rejected by `npm run check`.
- Fixed: Levy Park Howl-O-Ween is Sun Oct 25 (not Mon Oct 26); Wings Over Houston is Oct 31–Nov 1; Zoo Boo runs Sep 25–Oct 31; Ring toddler storytime is Wed 10:30–11:30 with registration; Tiny Tykes has 10:15 and 11:15 sessions; the Arboretum's Nov 7 hunt is "Fall Foliage".
- Removed because no organizer page shows a 2026 date: Spring Branch Memorial library Halloween party, MVPD trunk-or-treat, Children's Museum free weekend (Nov 7–8) and Diwali, Monster Mayhem, Galaxy Frights (Oct 31), Boo on the Boardwalk, Elmo's Got the Moves (resale listings only). Re-add any of them when the organizer posts it.
- Removed from weekly: Christ the King open play (no official hours) and Hillendahl toddler storytime (2025 schedule). Hillendahl lists Baby Storytime (10:30–11:30) and Toddler Playtime (11:00–11:30); confirm their days and add them.
- To do: restaurants and deals still link to roundups (the check warns). Replace them with the restaurants' own pages.
- CityCentre trick-or-treat: link from the site owner. Re-confirm the date and time on that page (couldn't open it from the setup session).

## 2026-10-25 · Tiny Tykes added, confirmation rules relaxed

- Added Tiny Tykes (Spring Branch Memorial Library, Thursdays 10:15–10:45, new walkers). The time comes from the library's own event page, as checked by the site owner. Some search listings show 11:15, so re-check it.
- Events listed on a reputable calendar now count as confirmed. Only Holiday in the Plaza stays tentative ("Date may change"), because sources disagree on its 2026 date.
- Still to confirm and add: Hillendahl Library Baby Storytime (10:30–11:30, ages 0–18 months) and Explore and Play Toddler Playtime (11:00–11:30). The days weren't in the listings found.

## 2026-10-24 · neighborhood news added

- New `data/news.json` with 3 items: Greenside opening at Memorial City, Memorial Park's Camp Logan Playground (late 2027), and a heads-up about canceled library storytimes.
- Found while researching: Spring Branch Memorial Library has a Thursday "Tiny Tykes" storytime for walkers (canceled Oct 22 for staffing). Confirm its usual time and add it to `recurring.json`.

## 2026-10-24 · coverage expanded to Memorial

- Added the Memorial area to the coverage (Memorial City, CityCentre, the Memorial Villages, Memorial Park, the Houston Arboretum).
- Added places: Houston Arboretum & Nature Center, Vale-Asche Foundation Playground (Memorial Park).
- Added events: Spring Branch Memorial Library Halloween party (Oct 29), CityCentre trick-or-treat (Oct 30), MVPD trunk-or-treat & haunted house (Oct 30), Arboretum scavenger hunt (Nov 7), Children's Museum free weekend (Nov 7–8), and Arboretum Tyke Hikes (Mondays Nov 2–16).
- The three Halloween events come from a Memorial-area roundup (juliesheets.com), not the organizers' pages, so they're marked tentative. Confirm them on the next run.
- Searched for but couldn't confirm 2026 dates: Santa at Memorial City Mall, CityCentre tree lighting, Memorial Park movie nights, Memorial Villages fall festival.

## 2026-10-24 · initial setup

- Seeded 11 places, 5 weekly programs and 3 dated events from web search results.
- Nothing could be confirmed on the organizers' own sites from the setup session, so every weekly program and place has `lastVerified: null`. Holiday in the Plaza (Nov 28) is marked tentative.
- Unconfirmed details to check first: the Spring Branch Memorial storytime day/time, the Ring and Hillendahl toddler storytime days (from 2025 listings), Christ the King open-play hours, and the Terry Hershey Park source link.
