# Growth kickoff: get the first readers in

Goal for the first 30 days: **the first 250 subscribers**, mostly from people who already trust you (friends, class parents, local groups), with ads on top. Everything points to **springbranchlittles.com/join**.

---

## 1. Connect Instagram and Facebook (about 30 minutes, once)

Ads, auto-posting and the Meta Pixel all hang off a Facebook **Page** and a **business portfolio**, even if you only care about Instagram.

1. **Make @springbranchlittles a Professional account.** In the Instagram app: Settings → Account type and tools → Switch to professional account → **Business**, category "Community" or "Website".
2. **Create a Facebook Page** named *Spring Branch Littles* (facebook.com/pages/create). Use the dino logo as the profile picture and add the website. Many Facebook groups let you join and post as a Page, which keeps your personal profile separate.
3. **Link them:** go to business.facebook.com (Meta Business Suite) → Settings → Accounts → Instagram accounts → Add, and connect @springbranchlittles to the Page.
4. **Create an ad account and add a card:** Business Suite → Settings → Accounts → Ad accounts → Add → Create new. Currency USD, time zone Central.
5. **Create the Meta Pixel:** Events Manager (business.facebook.com/events_manager) → Connect data sources → Web → name it "Spring Branch Littles" → copy the **Pixel ID** (a long number). **Send it to Claude**: it goes in `metaPixelId` in `site.config.json`, and the site starts reporting a "Lead" every time someone subscribes.
6. **Make sure subscribers land on the thank-you page.** In Buttondown → Settings → Subscribing, set the page shown after subscribing to `https://springbranchlittles.com/thanks/`. This is what lets the Pixel count signups.
7. **Auto-posting (optional):** follow README → "Instagram auto-posting" to add `IG_USER_ID` and `IG_ACCESS_TOKEN`. Then the Thursday weekend carousel posts itself.

---

## 2. Your first ads ($70 test, 7 days)

The creative is ready in `marketing/ads/2026-10-25/` (feed, story and square versions of four ads, with copy in `README.md`). Make more any time: **Actions → Ad creatives → Run workflow** (about $1 per run).

In **Ads Manager** (adsmanager.facebook.com):

| Setting | Choose |
|---|---|
| Objective | **Leads**, conversion location **Website**, event **Lead** (once the Pixel is on the site). Before that: **Traffic → landing page views**. |
| Budget | **$10 a day**, 7 days, at the campaign level |
| Location | ZIP codes **77024, 77055, 77080, 77043, 77079, 77041**, "People living in this location" |
| Age | 25–45 (Advantage+ audience on; it finds parents on its own) |
| Placements | Advantage+ (Instagram and Facebook feeds, Stories, Reels) |
| Ads | One ad per concept (start with **plan-ahead**, **storytime** and **holidays**). Upload the feed, story and square images to the same ad. Copy, headline and link are in the ads `README.md`; keep the `?source=` links so we can tell them apart. |

**After 5–7 days:** turn off the most expensive ad per subscriber, put its budget on the best one, and test a new concept. What's a good cost per subscriber varies a lot by area. Watch the trend: it should drop as the Pixel learns.

Simpler option for the very first test: in the Instagram app, **Boost** the plan-ahead image as a post, with the website `https://springbranchlittles.com/join/?source=ig-boost`, local area, $5–10 a day.

---

## 3. Facebook groups and local communities

Search engines don't show most Facebook groups, so finish this list in Facebook itself. Search **Groups** for these terms, join the ones with recent posts, and **read each group's rules before posting** (many allow helpful local resources but ban "promotion"; when unsure, message an admin and ask).

**Leads we found:**
- **Houston Moms**: the citywide parenting blog and community ([houstonmom.com](https://houstonmom.com/), [Facebook page](https://www.facebook.com/RealHoustonMoms/)). Its neighborhood guide has a [Spring Branch page](https://houstonmom.com/family-directory/houston-neighborhood-guide-families/spring-branch/). Good for a guest post or partnership, too.
- **Spring Shadows Moms Club**: a Spring Branch moms' club that meets monthly ([about it, from the Spring Branch Management District](https://sbmd.org/these-mothers-invention-is-a-community-support-group/)). Ask about sharing in their group or newsletter.
- **Spring Valley Moms Club**: Spring Valley and Hilshire Village moms, with a members' Facebook group ([svmomsclub.com](https://www.svmomsclub.com/)).
- **Memorial Villages Moms**: a local site for families in the Memorial Villages ([memorialvillagesmoms.com](https://memorialvillagesmoms.com/)). A natural partner: offer to share their posts, and ask about yours.
- **Greater Houston Moms**: a big Houston parent community and blog ([greaterhoustonmoms.com](https://greaterhoustonmoms.com/)).
- **Hike It Baby Houston**: outdoor family group; search it on Facebook.
- **Spring Branch Management District** ([Facebook](https://www.facebook.com/springbranchmd/)): tag them when you post about Spring Branch events; they share community content.

**Search terms to try in Facebook Groups:** "Spring Branch moms", "Spring Branch neighbors", "Memorial moms Houston", "Memorial Villages", "Hedwig Village", "Bunker Hill Village", "Spring Valley Village", "Spring Shadows", "Westbranch", "Energy Corridor moms", "West Houston moms", "SBISD parents", "Houston toddler moms", "Houston moms of preschoolers".

**PTAs and school communities:** Spring Branch ISD elementary PTAs often run Facebook pages and weekly newsletters. Start with schools near you (for example Bunker Hill, Frostwood, Hunters Creek, Memorial Drive, Valley Oaks, Rummel Creek, Wilchester, Housman, Ridgecrest, Treasure Forest, Pine Shadows and Spring Shadows elementaries) and ask whether they'd share a free family events list. Also preschools, Mother's Day Out programs and church MOPS groups.

**How to post in a group:** lead with the list, not the newsletter. For example: "Kid-friendly things happening in Spring Branch & Memorial the next two weeks: …(3–4 real events with dates)… I put together a free list every Monday if anyone wants it: springbranchlittles.com/join/?source=fb-<group-name>". At most once every 2–3 weeks per group, and always answer comments. Agent Reach writes these posts for you each Tuesday.

**Nextdoor:** post once in your neighborhood as yourself ("I made a free weekly list of kids' events nearby…"). Nextdoor allows sharing local resources but frowns on repeated promotion. A free Nextdoor business page for Spring Branch Littles is worth setting up.

---

## 4. Quick wins this week (in order)

1. **Text your people (15 minutes, the fastest first 50).** Send a personal note to 20–30 parent friends and your class or neighborhood group chats: "I started a free Monday email with kids' events around Spring Branch & Memorial for the next two weeks. Would love for you to try it: springbranchlittles.com/join/?source=friends". Ask them to forward it.
2. **Set up the Buttondown thank-you page and the Pixel** (steps 1.5–1.6), so every signup from here on is counted.
3. **Post in 3 Facebook groups** that allow it, using the format above. Halloween week is perfect timing.
4. **Run Agent Reach now** (Actions → Agent Reach → Run workflow, focus: "launch plan: first 250 subscribers"). It writes your group posts, Instagram captions and a partner email, and publishes a Thanksgiving-break guide.
5. **Instagram basics:** put `springbranchlittles.com/join` in your bio; post the four ads as regular posts too; make one 10-second Reel per week ("3 free things to do with kids this weekend in Spring Branch"), and use **Collab posts** with local kids' businesses (The Bunny Hive, kids' gyms) so the post shows on both accounts.
6. **Partner with one local business:** a giveaway (a class pack, a birthday party) where entering means subscribing. Their audience becomes yours. Follow Instagram's promotion rules (say it isn't sponsored by Instagram, and post official rules).
7. **Flyers with a QR code** at the Spring Branch Memorial and Ring library bulletin boards, coffee shops, pediatric offices and kids' gyms (ask first). Claude can make a printable flyer.
8. **Start the ads** (section 2) once the Pixel is in.

Once there's traffic, Agent Reach's weekly numbers will show what's working, and it will double down on it.
