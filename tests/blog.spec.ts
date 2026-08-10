import { expect, test } from "playwright/test";

test("blog shows article cards and loads the next nine", async ({ page, request }) => {
  const response = await request.get("/api/blog?locale=ro&page=1");
  expect(response.ok()).toBeTruthy();
  const firstPage = await response.json();
  expect(firstPage.items.length).toBeLessThanOrEqual(9);
  test.skip(firstPage.items.length === 0, "Published Sanity articles are required");

  await page.goto("/ro/blog", { waitUntil: "networkidle" });
  const cards = page.getByTestId("blog-card");
  await expect(cards).toHaveCount(firstPage.items.length);
  await expect(cards.first().locator("h2")).not.toBeEmpty();
  await expect(cards.first().locator("p")).not.toBeEmpty();
  await expect(cards.first().locator("img")).toHaveCount(1);

  if (firstPage.totalPages > 1) {
    const firstSlugs = firstPage.items.map((post: { slug: string }) => post.slug);
    await page.getByTestId("blog-load-more").click();
    await expect.poll(() => cards.count()).toBeGreaterThan(firstPage.items.length);
    const hrefs = await cards.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(firstSlugs.every((slug: string) => hrefs.includes(`/ro/blog/${slug}`))).toBeTruthy();
  } else {
    await expect(page.getByTestId("blog-load-more")).toHaveCount(0);
  }
});
