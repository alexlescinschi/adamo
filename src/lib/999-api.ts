import "server-only";

const API_BASE = "https://partners-api.999.md";
const API_KEY = process.env.N999_API_KEY || "";
const IMAGE_HOSTS = new Set(
  (process.env.N999_IMAGE_HOSTS || "adamo-md-static.s3.eu-north-1.amazonaws.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    signal: options?.signal ?? AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || `999 API error ${res.status}`);
  }
  return data;
}

export async function uploadImage(imageUrl: string): Promise<string> {
  const url = new URL(imageUrl);
  if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Image host is not allowed");
  }
  const imgRes = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: "error" });
  if (!imgRes.ok) throw new Error("Failed to fetch image");
  const contentType = imgRes.headers.get("content-type") || "";
  const contentLength = Number(imgRes.headers.get("content-length") || 0);
  if (!contentType.startsWith("image/") || contentLength > 10_000_000) throw new Error("Invalid image response");

  const blob = await imgRes.blob();
  if (blob.size > 10_000_000) throw new Error("Image is too large");
  const form = new FormData();
  form.append("file", blob, "product.jpg");

  const auth = Buffer.from(`${API_KEY}:`).toString("base64");
  const uploadRes = await fetch(`${API_BASE}/images`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
    signal: AbortSignal.timeout(15000),
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Image upload failed");
  return uploadData.image_id;
}

export async function createAdvert(data: {
  category_id: string;
  subcategory_id: string;
  offer_type: string;
  features: { id: string; value: unknown; unit?: string }[];
}): Promise<{ advert: { id: string; state: string } }> {
  return apiFetch("/adverts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function hideAdvert(advertId: string): Promise<void> {
  try {
    await apiFetch(`/adverts/${advertId}/access-policy`, {
      method: "PUT",
      body: JSON.stringify({ access_policy: "private" }),
    });
  } catch {
    // Fallback: try PATCH with hidden state
    await apiFetch(`/adverts/${advertId}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "hidden" }),
    });
  }
}

export async function getAdvert(advertId: string): Promise<any> {
  return apiFetch(`/adverts/${advertId}?lang=ro`);
}

export async function updateAdvert(
  advertId: string,
  data: { features: { id: string; value: unknown; unit?: string }[] }
): Promise<void> {
  await apiFetch(`/adverts/${advertId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
