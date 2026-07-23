import { expect, test } from "playwright/test";

test("staging pages and protected APIs", async ({ request }) => {
  const blog = await request.get("/ro/blog");
  expect(blog.status()).toBe(200);
  await expect(blog.text()).resolves.toContain("Blog");

  const sitemapPage = await request.get("/ro/harta-site-ului");
  expect(sitemapPage.status()).toBe(200);
  await expect(sitemapPage.text()).resolves.toContain("Harta site-ului");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  await expect(robots.text()).resolves.toContain("Disallow: /");

  const legacyPrivacy = await request.get("/ro/privacy", { maxRedirects: 0 });
  expect([307, 308]).toContain(legacyPrivacy.status());
  expect(legacyPrivacy.headers().location).toBe("/ro/politica-de-confidentialitate");

  expect((await request.get("/api/debug-env")).status()).toBe(404);
  expect((await request.post("/api/integrations/sync-999", { data: { product_id: 1 } })).status()).toBe(401);
  expect((await request.post("/api/invoice", { data: { orderId: 1, invoiceAccessToken: "short" } })).status()).toBe(400);
  expect((await request.post("/api/checkout", { data: {} })).status()).toBe(400);
});
