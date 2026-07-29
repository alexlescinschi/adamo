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
      `${formatPrice(price / 6)} lei | 6 luni | 0%.`
    );

    await loadNextPage(page, 2);
    const productsAfterClick = await productHrefs(page);
    expect(productsAfterClick).toEqual(expect.arrayContaining(initialProducts));
    await expect(loadMore).toHaveAttribute("href", "/ro/category/laptops?page=3");
  });
}

test("mobile filters fill the screen and keep the action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ru/category/laptops", { waitUntil: "networkidle" });
  const filterButton = page.getByRole("button", { name: /Фильтры/ });
  const sortButton = page.getByLabel("Сортировать товары");
  const [titleBox, filterBox, sortBox] = await Promise.all([
    page.getByRole("heading", { name: "Ноутбуки", exact: true }).boundingBox(),
    filterButton.boundingBox(),
    sortButton.boundingBox(),
  ]);
  expect(filterBox?.y).toBeGreaterThan((titleBox?.y || 0) + (titleBox?.height || 0));
  expect(filterBox?.y).toBe(sortBox?.y);
  expect(filterBox?.x).toBeLessThan(sortBox?.x || 0);
  await expect(filterButton).toHaveCSS("border-radius", "28px");
  await expect(sortButton).toHaveCSS("border-radius", "28px");
  await filterButton.click();
  const dialog = page.getByRole("dialog", { name: "Фильтры" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("width", "390px");
  const action = dialog.getByRole("button", { name: /Показать \d+ товаров/ });
  await dialog.locator(".overflow-y-auto").evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect(action).toBeInViewport();
});

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
  await expect(sidebar.getByRole("button", { name: /Aplică preț/ })).toHaveCount(0);
  await sidebar.getByPlaceholder("min").fill("5000");
  await expect.poll(() => new URL(page.url()).searchParams.get("price_min")).toBe("5000");
  await sidebar.getByRole("button", { name: "Resetează tot", exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.has("price_min")).toBe(false);
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
  const sort = page.getByLabel("Sortează produsele");
  await sort.selectOption("price_desc");
  await page.waitForURL(/sort=price_desc/);
  await expect(page.getByRole("link", { name: /Vezi mai multe/ })).toHaveAttribute("href", "/ro/category/laptops?sort=price_desc&page=2");
  await sort.selectOption("discount");
  await page.waitForURL(/sort=discount/);
  const discounted = page.getByTestId("product-grid").locator("article");
  expect(await discounted.count()).toBeGreaterThan(0);
  await expect(discounted.locator(".line-through")).toHaveCount(await discounted.count());
});

test("footer promotions link opens the discounted catalog", async ({ page }) => {
  await page.goto("/ro", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Promoții", exact: true }).locator("..").getByRole("link", { name: "Vezi toate" })).toHaveAttribute("href", "/ro/category/laptops?sort=discount");
  const footer = page.locator("footer");
  await expect(footer.getByRole("heading", { name: "Ajutor", exact: true })).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Despre ADAMO", exact: true })).toBeVisible();
  const promotions = footer.getByRole("link", { name: "Promoții", exact: true });
  await expect(promotions).toHaveAttribute("href", "/ro/category/laptops?sort=discount");

  await promotions.click();
  await page.waitForURL(/sort=discount/);
  await expect(page.getByRole("heading", { name: "Laptopuri", exact: true })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: "Nou", exact: true })).toBeVisible();
  const cards = page.getByTestId("product-grid").locator("article");
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.locator(".line-through")).toHaveCount(await cards.count());
  const productHref = await cards.first().locator('a[href*="/product/"]').first().getAttribute("href");
  expect(productHref).toBeTruthy();
  await page.goto(productHref!);
  await expect(page.getByRole("link", { name: "Înapoi la produse", exact: true })).toHaveCount(0);
});

test("home renders promotions in RU and EN", async ({ page }) => {
  for (const [locale, title] of [["ru", "Акции"], ["en", "Promotions"]]) {
    await page.goto(`/${locale}`, { waitUntil: "networkidle" });
    const section = page.getByRole("heading", { name: title, exact: true }).locator("../..");
    await expect(section.locator("article")).toHaveCount(2);
  }
});

test("home uses localized hero copy and single-column mobile benefits", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ro", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Alege Laptop", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Garanție 12 luni/ }).locator("..")).toHaveCSS("gap", "0px");
  const whyItems = page.getByRole("heading", { name: "De ce ADAMO.MD?", exact: true }).locator("..").locator("article");
  const itemRows = await whyItems.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().y));
  expect(new Set(itemRows).size).toBe(5);

  await page.goto("/ru", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Выбрать ноутбук", exact: true })).toBeVisible();
  await page.goto("/en", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Chose laptop", exact: true })).toBeVisible();
  await expect(page.locator("h1 em")).toHaveText("gaming");
});
