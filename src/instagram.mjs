// Instagram API (Instagram Login), shared by the weekend carousel and the blog posts.
// Env: IG_USER_ID, IG_ACCESS_TOKEN, optional IG_GRAPH_HOST (default graph.instagram.com), IG_GRAPH_VERSION (default v23.0)
const HOST = process.env.IG_GRAPH_HOST || "graph.instagram.com";
const VERSION = process.env.IG_GRAPH_VERSION || "v23.0";

export async function igCall(method, path, params) {
  const url = new URL(`https://${HOST}/${VERSION}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: process.env.IG_ACCESS_TOKEN })) url.searchParams.set(k, v);
  const res = await fetch(url, { method });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`${method} ${path}: ${JSON.stringify(body.error || body)}`);
  return body;
}

export async function refreshToken() {
  const res = await fetch(`https://${HOST}/refresh_access_token?grant_type=ig_refresh_token&access_token=${process.env.IG_ACCESS_TOKEN}`);
  const body = await res.json();
  if (!res.ok || !body.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

// Instagram downloads images by URL, so they must already be live on the website.
export async function assertLive(urls) {
  for (const u of urls) {
    const r = await fetch(u, { method: "HEAD" });
    if (!r.ok) throw new Error(`${u} returned ${r.status}. Deploy the site before posting.`);
  }
}

// Posts 2–10 images as one carousel and returns the published media id.
export async function postCarousel(imageUrls, caption) {
  const user = process.env.IG_USER_ID;
  await assertLive(imageUrls);
  const children = [];
  for (const image_url of imageUrls) children.push((await igCall("POST", `${user}/media`, { image_url, is_carousel_item: "true" })).id);
  const container = await igCall("POST", `${user}/media`, { media_type: "CAROUSEL", children: children.join(","), caption });
  for (let i = 0; i < 20; i++) {
    const { status_code } = await igCall("GET", container.id, { fields: "status_code" });
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR") throw new Error("Instagram could not process the carousel.");
    await new Promise((r) => setTimeout(r, 5000));
  }
  return (await igCall("POST", `${user}/media_publish`, { creation_id: container.id })).id;
}
