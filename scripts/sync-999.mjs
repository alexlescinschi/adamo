import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const CRM = process.env.CRM_API_URL || "https://api.crm.adamo.md/v1";
const API = "https://partners-api.999.md";
const PREFIX = "marketplace:999:v1:product:";
const REGISTRY = "marketplace:999:v1:products";
const LOCK = "marketplace:999:v1:lock";
const M = {
  manufacturer: { acer: "7449", apple: "7415", asus: "7427", dell: "7440", hp: "7437", huawei: "23160", lenovo: "7421", microsoft: "42408", msi: "7428", samsung: "7444", xiaomi: "22419" },
  cpu: { "intel core i3": "7375", "intel core i5": "7374", "intel core i7": "7373", "intel core i9": "23178", "amd ryzen 3": "23175", "amd ryzen 5": "23176", "amd ryzen 7": "23177", "amd ryzen 9": "29136" },
  refresh: { "60 hz": "39857", "90 hz": "39858", "120 hz": "39859", "144 hz": "39860", "165 hz": "39934", "240 hz": "40823" },
  gpu: { "intel iris xe": "40611", "intel uhd": "40626", "intel hd": "40627", "geforce rtx 20": "40623", "geforce rtx 30": "40624", "geforce rtx 40": "40625", "geforce rtx 50": "41939" },
  gpuType: { "dedicată": "32685", "incorporată": "32686", incorporata: "32686" },
  ram: { "1 gb": "22044", "2 gb": "40600", "3 gb": "40601", "4 gb": "22046", "6 gb": "22047", "8 gb": "22048", "12 gb": "40603", "16 gb": "40604", "18 gb": "40605", "24 gb": "40606", "32 gb": "40607", "64 gb": "40608", "128 gb": "40609" },
  storageType: { emmc: "23165", ssd: "7401", hdd: "7400", "hdd+ssd": "7402", "hdd+ssd cache": "7403", "2xhdd": "7404" },
  storageSize: { "64 gb": "7379", "128 gb": "7380", "160 gb": "8695", "250 gb": "7381", "256 gb": "7382", "320 gb": "7383", "500 gb": "7384", "512 gb": "45349", "640 gb": "7385", "750 gb": "7386", "1024 gb": "7387", "1524 gb": "7388" },
  display: { "12.1\"": "40806", "13.3\"": "40807", "13.4\"": "40808", "13.6\"": "40809", "14.2\"": "40811", "14.5\"": "40812", "15.1\"": "40815", "15.3\"": "40813", "15.4\"": "47904", "15.6\"": "40814", "16.1\"": "40816", "16.2\"": "40817", "16.3\"": "40818", "17.3\"": "40819", "18\"": "40820" },
  resolution: { "1024x600": "48020", "1280x800": "48760", "1366x768": "23166", "1440x900": "23167", "1600x900": "23168", "1920x1080": "23169", "1920x1200": "45558", "2408x1506": "47950", "2560x1440": "40821", "2560x1600": "47942", "2880x1800": "45414", "3000x2000": "48202", "3024x1964": "48182", "3072x1920": "48329", "3240x2160": "48381", "3840x2160": "28436", "3840x2400": "47976" },
};

const need = (name) => { const value = process.env[name] || ""; if (!value) throw new Error(`${name} is not configured`); return value; };
const norm = (value) => String(value || "").trim().toLowerCase();
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const api = async (url, init) => { const res = await fetch(url, init); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`); return data; };
const add = (features, id, values, source) => { const value = values[norm(source)]; if (value) features.push({ id, value }); };
const auth = (key) => ({ Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` });

function build(product, phone) {
  const summary = product.offerSummary;
  const price = Number(summary?.minPrice || 0);
  if (!summary || summary.inventoryUnitCount <= 0 || price <= 0 || (product.category_slug || product.category?.slug) !== "laptops") return null;
  const specs = Object.fromEntries((product.specs || []).map((spec) => [norm(spec.code || spec.label), String(spec.valueLabel || "")]));
  const title = String(product.name || product.translation?.storefrontName || "").replace(/\s+/g, " ").trim().slice(0, 60).replace(/\s+\S*$/, "");
  const features = [{ id: "12", value: title }, { id: "13", value: String(product.translation?.description || product.description || "").slice(0, 5000) }, { id: "2", value: price, unit: "mdl" }, { id: "7", value: "12900" }, { id: "685", value: M.manufacturer[norm(specs.producator)] || "7712" }, { id: "795", value: "37797" }, { id: "686", value: "7451" }, { id: "593", value: ["nou", "new"].includes(norm(specs.stare)) ? "6370" : ["pentru piese", "for parts"].includes(norm(specs.stare)) ? "6372" : "6371" }, { id: "16", value: [phone] }];
  const oldPrice = Number(summary.priceTiers?.[0]?.listPrice || 0);
  if (oldPrice > price) features.push({ id: "1640", value: oldPrice });
  add(features, "675", M.cpu, specs["serie-procesor"]); add(features, "687", M.display, specs.display); features.push({ id: "975", value: M.resolution[norm(specs.rezolutie)] || "23170" }); add(features, "2247", M.refresh, specs["frecventa-ecran"]); add(features, "2283", M.gpu, specs["serie-placa-video"]); add(features, "1988", M.gpuType, specs["tip-placa-video"]); add(features, "1244", M.ram, specs["memorie-ram"]); add(features, "679", M.storageType, specs["tip-stocare"]); add(features, "677", M.storageSize, specs["capacitatea-hard-disk"]);
  if (norm(specs.tip).includes("tactil")) features.push({ id: "690", value: true });
  return { features, images: (product.images || []).slice(0, 10).map((image) => image?.url).filter(Boolean) };
}

async function uploadImages(urls, headers) {
  const ids = [];
  for (const url of urls) { const source = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!source.ok) throw new Error(`Could not fetch ${url}`); const form = new FormData(); form.append("file", await source.blob(), "product.jpg"); ids.push((await api(`${API}/images`, { method: "POST", headers, body: form })).image_id); }
  return ids;
}

async function setVisible(advertId, state, headers) {
  try { await api(`${API}/adverts/${advertId}/access-policy`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ access_policy: state ? "public" : "private" }) }); }
  catch { await api(`${API}/adverts/${advertId}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ state: state ? "public" : "hidden" }) }); }
}

async function main() {
  if (process.env.N999_SYNC_ENABLED !== "true") return console.log("999 sync disabled");
  const redis = new Redis({ url: need("UPSTASH_REDIS_REST_URL"), token: need("UPSTASH_REDIS_REST_TOKEN") });
  if (!await redis.set(LOCK, "1", { nx: true, ex: 270 })) return console.log("999 sync already running");
  try {
    const headers = auth(need("N999_API_KEY")); const phone = need("N999_PHONE"); const allow = new Set((process.env.N999_SYNC_PRODUCT_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
    const login = await api(`${CRM}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login: need("CRM_API_LOGIN"), password: need("CRM_API_PASSWORD") }) });
    const feed = await api(`${CRM}/ecommerce/products/ids`); const sourceIds = Array.isArray(feed.ids) ? feed.ids.map(String) : []; const ids = allow.size ? [...allow] : sourceIds; const mappedIds = await redis.smembers(REGISTRY); const report = { created: 0, updated: 0, hidden: 0, unchanged: 0, errors: 0 };
    for (const id of ids) {
      const key = `${PREFIX}${id}`; const existing = await redis.get(key);
      try {
        if (!sourceIds.includes(id)) { if (existing?.advertId && existing.state !== "hidden") { await setVisible(existing.advertId, false, headers); await redis.set(key, { ...existing, state: "hidden", syncedAt: new Date().toISOString() }); report.hidden++; } continue; }
        const product = await api(`${CRM}/ecommerce/products/${id}?locale=ro`, { headers: { Authorization: `Bearer ${login.accessToken}` } }); const source = build(product, phone);
        if (!source) { if (existing?.advertId && existing.state !== "hidden") { await setVisible(existing.advertId, false, headers); await redis.set(key, { ...existing, state: "hidden", syncedAt: new Date().toISOString() }); report.hidden++; } continue; }
        const sourceHash = digest(source); if (existing?.advertId && existing.hash === sourceHash && existing.state === "public") { report.unchanged++; continue; }
        const imageIds = await uploadImages(source.images, headers); const features = imageIds.length ? [...source.features, { id: "14", value: imageIds }] : source.features;
        if (existing?.advertId) { if (existing.state === "hidden") await setVisible(existing.advertId, true, headers); await api(`${API}/adverts/${existing.advertId}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ features }) }); await redis.set(key, { ...existing, hash: sourceHash, state: "public", syncedAt: new Date().toISOString(), lastError: null }); report.updated++; }
        else { const created = await api(`${API}/adverts`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ category_id: "2", subcategory_id: "4", offer_type: "776", features }) }); const advertId = String(created.advert?.id || ""); if (!advertId) throw new Error("999 did not return advert ID"); await redis.set(key, { advertId, hash: sourceHash, state: "public", syncedAt: new Date().toISOString(), lastError: null }); await redis.sadd(REGISTRY, id); report.created++; }
      } catch (error) { await redis.set(key, { ...(existing || {}), state: existing?.state || "error", lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error", syncedAt: new Date().toISOString() }); report.errors++; }
    }
    if (!allow.size) for (const id of mappedIds) { if (sourceIds.includes(String(id))) continue; const key = `${PREFIX}${id}`; const existing = await redis.get(key); if (existing?.advertId && existing.state !== "hidden") { await setVisible(existing.advertId, false, headers); await redis.set(key, { ...existing, state: "hidden", syncedAt: new Date().toISOString() }); report.hidden++; } }
    console.log(JSON.stringify(report)); if (report.errors) process.exitCode = 1;
  } finally { await redis.del(LOCK); }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack : error); process.exit(1); });
