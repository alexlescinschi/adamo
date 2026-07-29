import { expect, test, type Page } from "playwright/test";
import { formatPrice } from "../src/lib/utils";

async function productHrefs(page: Page) {
  return page
    .getByTestId("product-grid")
    .locator('a[href*="/product/"]')
    .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))]);
}

async function loadNextPage(page: Page, expectedPage: number) {
  const loadMore = page.getByRole("link", { name: /Vezi mai multe/ });
  await loadMore.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);

  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/category/laptops" && url.searchParams.get("page") === String(expectedPage);
  });
  await loadMore.click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);

  await expect.poll(() => productHrefs(page)).toHaveLength(48);
  expect(new URL(page.url()).searchParams.get("page")).toBe(String(expectedPage));
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
}

for (const [device, viewport] of [
  ["desktop", { width: 1280, height: 720 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test(`load more appends products without moving the ${device} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
    const initialProducts = await productHrefs(page);
    test.skip(initialProducts.length === 0, "CRM catalog credentials are required");
    expect(initialProducts).toHaveLength(24);

    const loadMore = page.getByRole("link", { name: /Vezi mai multe/ });
    await expect(loadMore).toHaveAttribute("href", "/ro/category/laptops?page=2");
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
    const specs = page.getByTestId("product-grid").locator("article p").first();
    await expect(specs).toContainText("|");
    await expect(specs).not.toContainText(" / ");
    const firstCard = page.getByTestId("product-grid").locator("article").first();
    const price = Number((await firstCard.locator("strong").first().innerText()).replace(/\D/g, ""));
    await expect(firstCard.locator("p").last()).toHaveText(
      `${formatPrice(price / 6)} MDL | 6 luni | 0%.`
    );

    await loadNextPage(page, 2);
    const productsAfterClick = await productHrefs(page);
    expect(productsAfterClick).toEqual(expect.arrayContaining(initialProducts));
    await expect(loadMore).toHaveAttribute("href", "/ro/category/laptops?page=3");
  });
}

test("a direct catalog page loads the following page and preserves filters", async ({ page }) => {
  await page.goto("/ro/category/laptops?page=2&price_min=1", { waitUntil: "networkidle" });
  const initialProducts = await productHrefs(page);
  test.skip(initialProducts.length === 0, "CRM catalog credentials are required");
  expect(initialProducts).toHaveLength(24);

  const loadMore = page.getByRole("link", { name: /Vezi mai multe/ });
  const href = await loadMore.getAttribute("href");
  const nextUrl = new URL(href!, "http://localhost");
  expect(nextUrl.searchParams.get("page")).toBe("3");
  expect(nextUrl.searchParams.get("price_min")).toBe("1");

  await loadNextPage(page, 3);
  expect(await productHrefs(page)).toEqual(expect.arrayContaining(initialProducts));
});

test("search reuses catalog filters and load more", async ({ page }) => {
  await page.goto("/ro/search?q=hp", { waitUntil: "networkidle" });
  const grid = page.getByTestId("product-grid");
  test.skip((await grid.locator("article").count()) === 0, "CRM search credentials are required");
  await expect(grid.locator("article")).toHaveCount(24);

  const sidebar = page.locator("aside");
  await expect(sidebar.getByText("Categorii", { exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Nou", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Resetează tot", exact: true })).toBeVisible();
  await page.getByLabel("Sortează produsele").selectOption("price_asc");
  await page.waitForURL(/sort=price_asc/);
  await sidebar.getByRole("button", { name: "Resetează tot", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.has("sort")).toBe(false);
  expect(new URL(page.url()).searchParams.get("q")).toBe("hp");

  const loadMore = page.getByRole("link", { name: /Vezi mai multe/ });
  await loadMore.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await loadMore.click();
  await expect(grid.locator("article")).toHaveCount(48);
  expect(new URL(page.url()).searchParams.get("page")).toBe("2");
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  await sidebar.getByRole("button", { name: "Nou", exact: true }).click();
  await page.waitForURL(/f_stare=new/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("hp");
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
});

test("catalog sorting survives load more", async ({ page }) => {
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  await page.getByLabel("Sortează produsele").selectOption("price_desc");
  await page.waitForURL(/sort=price_desc/);
  await expect(page.getByRole("link", { name: /Vezi mai multe/ })).toHaveAttribute("href", "/ro/category/laptops?sort=price_desc&page=2");
});

test("footer promotions link opens the discounted catalog", async ({ page }) => {
  await page.goto("/ro", { waitUntil: "networkidle" });
  const footer = page.locator("footer");
  await expect(footer.getByRole("heading", { name: "Ajutor", exact: true })).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Despre ADAMO", exact: true })).toBeVisible();
  const promotions = footer.getByRole("link", { name: "Promoții", exact: true });
  await expect(promotions).toHaveAttribute("href", "/ro/category/laptops?type=promotions");

  await promotions.click();
  await page.waitForURL(/type=promotions/);
  await expect(page.getByRole("heading", { name: "Promoții", exact: true })).toBeVisible();
  const cards = page.getByTestId("product-grid").locator("article");
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.locator(".line-through")).toHaveCount(await cards.count());
});
