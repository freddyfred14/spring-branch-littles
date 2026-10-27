// OpenAI image generation, shared by the event illustrations and the ad creatives.

// The newest image model this account can use. Model names change over time, so we ask rather than hard-code.
export async function pickImageModel(key) {
  const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  const image = body.data.map((m) => m.id).filter((id) => /^(gpt-image|dall-e)/.test(id));
  console.log(`Image models on this account: ${image.join(", ") || "none"}`);
  const version = (id) => (id.match(/\d+(\.\d+)?/g) || ["0"]).map(Number);
  const rank = (id) => [id.startsWith("gpt-image") ? 1 : 0, id.includes("mini") ? 0 : 1, ...version(id)];
  const cmp = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; };
  // Skip dated snapshots (e.g. gpt-image-1-2025-04-15) when the plain name exists.
  const plain = image.filter((id) => !/\d{4}-\d{2}-\d{2}$/.test(id));
  return (plain.length ? plain : image).sort(cmp)[0];
}

const SIZES = {
  landscape: { gpt: "1536x1024", dalle3: "1792x1024" },
  portrait: { gpt: "1024x1536", dalle3: "1024x1792" },
  square: { gpt: "1024x1024", dalle3: "1024x1024" },
};

// Returns the image as a JPEG (or PNG for dall-e) Buffer. Errors that will repeat for every request
// (wrong model, unverified organization, billing) are marked `fatal` so callers can stop early.
export async function generateImage(key, model, prompt, { shape = "landscape", quality = "medium" } = {}) {
  const settings = model.startsWith("dall-e")
    ? { size: model === "dall-e-3" ? SIZES[shape].dalle3 : "1024x1024", response_format: "b64_json", ...(model === "dall-e-3" ? { quality: quality === "high" ? "hd" : "standard" } : {}) }
    : { size: SIZES[shape].gpt, quality, output_format: "jpeg", output_compression: 82 };
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, n: 1, ...settings }),
  });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(body.error?.message || `HTTP ${res.status}`);
    err.fatal = /model|verif|billing|quota/i.test(err.message);
    throw err;
  }
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("the response had no image");
  return Buffer.from(b64, "base64");
}

// Like generateImage, but the model also gets reference images (e.g. our logo) to place in the design.
// Uses the image edits endpoint, which takes several input images for gpt-image models.
export async function generateWithReferences(key, model, prompt, refs, { shape = "portrait", quality = "medium" } = {}) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", SIZES[shape].gpt);
  form.append("quality", quality);
  form.append("output_format", "jpeg");
  form.append("output_compression", "85");
  for (const r of refs) form.append("image[]", new Blob([r.data], { type: r.type || "image/png" }), r.name || "reference.png");
  const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  const body = await res.json();
  if (!res.ok) {
    const err = new Error(body.error?.message || `HTTP ${res.status}`);
    err.fatal = /model|verif|billing|quota/i.test(err.message);
    throw err;
  }
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("the response had no image");
  return Buffer.from(b64, "base64");
}
