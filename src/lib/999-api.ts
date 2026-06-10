import "server-only";

const API_BASE = "https://partners-api.999.md";
const API_KEY = process.env.N999_API_KEY || "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || `999 API error ${res.status}`);
  }
  return data;
}

export async function uploadImage(imageUrl: string): Promise<string> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);

  const blob = await imgRes.blob();
  const form = new FormData();
  form.append("file", blob, "product.jpg");

  const auth = Buffer.from(`${API_KEY}:`).toString("base64");
  const uploadRes = await fetch(`${API_BASE}/images`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
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
  } catch (e) {
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
