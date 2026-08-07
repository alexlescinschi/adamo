import { expect, test, type Page } from "playwright/test";
import { formatPrice } from "../src/lib/utils";

async function productHrefs(page: Page) {
  return page
    .getByTestId("product-grid")
    .locator('article a[href*="/product/"]')
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
    await expect(firstCard.locator("p").last().locator("span")).toHaveText([
      `${formatPrice(price / 6)} lei`,
      "6 luni | 0%",
    ]);
    expect(await firstCard.getAttribute("class")).toContain("active:-translate-y-[3px]");

    await loadNextPage(page, 2);
    const productsAfterClick = await productHrefs(page);
    expect(productsAfterClick).toEqual(expect.arrayContaining(initialProducts));
    await expect(loadMore).toHaveAttribute("href", "/ro/category/laptops?page=3");
  });
}

test("public contact number is consistent across phone and messaging channels", async ({ page }) => {
  await page.goto("/ro", { waitUntil: "networkidle" });

  await expect(page.getByText("067 222 999", { exact: true }).first()).toBeVisible();
  expect(await page.locator('a[href="https://wa.me/37367222999"]').count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator('a[href="viber://chat?number=%2B37367222999"]').count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator('a[href="tg://resolve?phone=37367222999"]').count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator('a[href="tel:+37367222999"]').count()).toBeGreaterThanOrEqual(3);
});

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
  expect(Math.abs((filterBox?.y || 0) - (sortBox?.y || 0))).toBeLessThan(2);
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

test("mobile filter and sort controls float together when scrolling up", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of ["/ro/category/laptops", "/ro/search?q=hp"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const controls = page.getByTestId("mobile-catalog-controls");
    const filter = controls.getByRole("button", { name: /Filtre/ });
    const sort = controls.getByLabel("Sortează produsele");
    await expect(controls).toHaveAttribute("data-floating", "false");

    const staticBoxes = await Promise.all([filter.boundingBox(), sort.boundingBox()]);
    expect(Math.abs(staticBoxes[0]!.y - staticBoxes[1]!.y)).toBeLessThan(2);
    expect(staticBoxes[0]!.x + staticBoxes[0]!.width).toBeLessThanOrEqual(staticBoxes[1]!.x);

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, Math.min(1600, document.documentElement.scrollHeight - innerHeight));
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
    await page.waitForTimeout(100);
    await expect(controls).toHaveAttribute("data-floating", "false");
    await page.evaluate(() => window.scrollBy(0, -160));
    await expect(controls).toHaveAttribute("data-floating", "true");

    const floatingBoxes = await Promise.all([filter.boundingBox(), sort.boundingBox()]);
    expect(Math.abs(floatingBoxes[0]!.y - floatingBoxes[1]!.y)).toBeLessThan(2);
    expect(floatingBoxes[0]!.x + floatingBoxes[0]!.width).toBeLessThanOrEqual(floatingBoxes[1]!.x);
    expect(floatingBoxes[0]!.y).toBeGreaterThanOrEqual(70);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test("mobile filter and sort pills scroll together without clipping their text", async ({ page }) => {
  await page.setViewportSize({ width: 240, height: 844 });
  await page.goto("/ru/category/laptops", { waitUntil: "networkidle" });
  const controls = page.getByTestId("mobile-catalog-controls");
  const filter = controls.getByRole("button", { name: /Фильтры/ });
  const sort = controls.getByLabel("Сортировать товары");

  await expect(filter.locator("span").first()).toHaveCSS("white-space", "nowrap");
  await expect(sort).toHaveCSS("white-space", "nowrap");
  expect(await controls.evaluate((element) => element.scrollWidth)).toBeGreaterThan(
    await controls.evaluate((element) => element.clientWidth),
  );
  await controls.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  expect(await controls.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
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

test("display sizes are grouped into ranges and preserve CRM filtering", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  const sidebar = page.locator("aside");
  const display = sidebar.getByText("Display", { exact: true }).locator("..");
  const labels = ['< 12.9"', '13.0" - 13.9"', '14.0" - 14.9"', '15.0" - 16.9"', '> 17.0"'];

  for (const label of labels) await expect(display.getByRole("button", { name: label, exact: true })).toBeVisible();
  await expect(display.getByRole("button", { name: '13.3"', exact: true })).toHaveCount(0);

  await display.getByRole("button", { name: '13.0" - 13.9"', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("f_display")).toBe("13-3,13-4,135,13-8");
  await display.getByRole("button", { name: '14.0" - 14.9"', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("f_display")).toBe("13-3,13-4,135,13-8,14-inch,14-1-inch,14-2,145");
  await expect(page.getByTestId("mobile-catalog-controls")).toHaveAttribute("data-active-filters", "2");

  await display.getByRole("button", { name: '13.0" - 13.9"', exact: true }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("f_display")).toBe("14-inch,14-1-inch,14-2,145");
  await loadNextPage(page, 2);
  expect(new URL(page.url()).searchParams.get("f_display")).toBe("14-inch,14-1-inch,14-2,145");
});

test("catalog categories use filter pills on separate rows", async ({ page }) => {
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  const links = page.locator("aside").getByTestId("category-filter-link");
  expect(await links.count()).toBeGreaterThan(1);
  await expect(links.first()).toHaveCSS("border-radius", "28px");
  const rows = await links.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
  expect(new Set(rows).size).toBe(rows.length);
});

test("search reuses catalog filters and load more", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/ro/search?q=hp", { waitUntil: "networkidle" });
  const grid = page.getByTestId("product-grid");
  test.skip((await grid.locator("article").count()) === 0, "CRM search credentials are required");
  await expect(grid.locator("article")).toHaveCount(24);

  const sidebar = page.locator("aside");
  await expect(sidebar.getByText("Categorii", { exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Nou", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: '13.0" - 13.9"', exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: '13.3"', exact: true })).toHaveCount(0);
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

for (const [device, viewport, bannerTestId, productsBefore] of [
  ["mobile", { width: 390, height: 844 }, "category-banner-mobile", 8],
  ["desktop", { width: 1280, height: 720 }, "category-banner-desktop", 12],
] as const) {
  test(`category banner follows ${productsBefore} products on ${device}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
    const grid = page.getByTestId("product-grid");
    const banner = grid.getByTestId(bannerTestId);
    await expect(banner).toBeVisible();
    await expect(banner.locator("img")).toHaveAttribute("src", /banners\/storefront/);
    expect(await banner.evaluate((element) => {
      const children = [...element.parentElement!.children];
      return children.slice(0, children.indexOf(element)).filter((child) => child.tagName === "ARTICLE").length;
    })).toBe(productsBefore);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("Mini-PC and localized categories load their CRM banners automatically", async ({ page }) => {
  await page.goto("/ro/category/minipc", { waitUntil: "networkidle" });
  const miniPcBanner = page.getByTestId("category-banner-desktop");
  await expect(miniPcBanner).toBeVisible();
  const miniPcSource = await miniPcBanner.locator("img").getAttribute("src");

  await page.goto("/ru/category/minipc", { waitUntil: "networkidle" });
  const russianBanner = page.getByTestId("category-banner-desktop");
  await expect(russianBanner).toBeVisible();
  await expect(russianBanner.locator("img")).not.toHaveAttribute("src", miniPcSource!);
});

test("footer promotions link opens the discounted catalog", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/ro", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Promoții", exact: true }).locator("..").getByRole("link", { name: "Vezi toate" })).toHaveAttribute("href", "/ro/category/laptops?sort=discount");
  const footer = page.locator("footer");
  await expect(footer.getByRole("heading", { name: "Ajutor", exact: true })).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Despre ADAMO", exact: true })).toBeVisible();
  const promotions = footer.getByRole("link", { name: "Promoții", exact: true });
  await expect(promotions).toHaveAttribute("href", "/ro/category/laptops?sort=discount");

  await promotions.click();
  await page.waitForURL(/sort=discount/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Laptopuri", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("aside").getByRole("button", { name: "Nou", exact: true })).toBeVisible();
  const cards = page.getByTestId("product-grid").locator("article");
  expect(await cards.count()).toBeGreaterThan(0);
  await expect(cards.locator(".line-through")).toHaveCount(await cards.count());
  const firstCard = cards.first();
  const [cardOldPrice, cardCurrentPrice] = await Promise.all([
    firstCard.getByTestId("old-price").boundingBox(),
    firstCard.getByTestId("current-price").boundingBox(),
  ]);
  expect(cardOldPrice!.y).toBeLessThan(cardCurrentPrice!.y);
  const productHref = await cards.first().locator('a[href*="/product/"]').first().getAttribute("href");
  expect(productHref).toBeTruthy();

  await firstCard.getByRole("button", { name: "Adaugă în coș" }).click();
  await page.getByRole("button", { name: "Coș", exact: true }).click();
  const cartOldPrice = page.getByTestId("old-price").last();
  const cartCurrentPrice = page.getByTestId("current-price").last();
  expect((await cartOldPrice.boundingBox())!.y).toBeLessThan((await cartCurrentPrice.boundingBox())!.y);

  await page.goto(productHref!);
  await expect(page.getByRole("link", { name: "Înapoi la produse", exact: true })).toHaveCount(0);
  const productInfo = page.getByTestId("product-info");
  expect((await productInfo.getByTestId("old-price").boundingBox())!.y).toBeLessThan((await productInfo.getByTestId("current-price").boundingBox())!.y);
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
  const titleFits = await page.locator("h1 > span").evaluateAll((lines) => lines.every((line) => {
    const box = line.getBoundingClientRect();
    return box.left >= 0 && box.right <= document.documentElement.clientWidth;
  }));
  expect(titleFits).toBe(true);
  await page.getByRole("button", { name: "Меню", exact: true }).click();
  await expect(page.getByRole("button", { name: "Каталог", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Ноутбуки", exact: true })).toBeVisible();
  await page.goto("/en", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Chose laptop", exact: true })).toBeVisible();
  await expect(page.locator("h1 em")).toHaveText("gaming");
});

test("mobile product card and gallery interactions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  const card = page.getByTestId("product-grid").locator("article").first();
  test.skip((await card.count()) === 0, "CRM catalog credentials are required");
  const cardImage = card.locator('a[href*="/product/"]').first();
  const cardDots = card.getByTestId("product-card-dots");
  if (await cardDots.count()) {
    const [imageBox, dotsBox] = await Promise.all([cardImage.boundingBox(), cardDots.boundingBox()]);
    expect(dotsBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height);
  }
  const catalogUrl = page.url();
  await card.getByRole("button", { name: "Adaugă în coș" }).click();
  expect(page.url()).toBe(catalogUrl);
  await card.locator("p").first().click();
  await page.waitForURL(/\/ro\/product\//);

  const productInfo = page.getByTestId("product-info");
  const rateClouds = productInfo.getByTestId("rate-clouds").locator(":scope > div");
  await expect(rateClouds).toHaveCount(7);
  expect(await rateClouds.evaluateAll((clouds) => clouds.map((cloud) => cloud.getAttribute("data-months")))).toEqual(["6", "8", "10", "12", "18", "24", "36"]);
  expect(await rateClouds.evaluateAll((clouds) => clouds.map((cloud) => cloud.getAttribute("data-rate")))).toEqual(["0", "0", "1", "1", "1", "1", "1"]);
  const cloudRows = await rateClouds.evaluateAll((clouds) => clouds.map((cloud) => cloud.getBoundingClientRect().y));
  expect(new Set(cloudRows).size).toBeGreaterThan(1);
  await expect(productInfo.getByRole("button", { name: "Achită în rate", exact: true })).toHaveCount(0);

  const quickOrder = page.getByRole("button", { name: /Comandă într-un clic/ });
  expect((await quickOrder.boundingBox())?.height).toBeGreaterThanOrEqual(64);
  await page.getByRole("button", { name: "Deschide galeria de imagini" }).click();
  const gallery = page.getByRole("dialog");
  await expect(gallery).toBeVisible();
  expect(await gallery.evaluate((element) => element.parentElement?.tagName)).toBe("BODY");
  const counter = gallery.locator("span").filter({ hasText: /^\d+ \/ \d+$/ });
  const firstCounter = await counter.textContent();
  expect(firstCounter).toMatch(/^1 \/ [2-9]\d*$/);
  await gallery.getByRole("button", { name: "Imaginea următoare" }).click();
  await expect(counter).not.toHaveText(firstCounter!);
  await page.keyboard.press("Escape");
  await expect(gallery).toBeHidden();
  const imageFrame = page.getByTestId("gallery-image-frame");
  const imageCounter = page.getByTestId("gallery-counter");
  expect((await imageCounter.boundingBox())!.y).toBeGreaterThanOrEqual((await imageFrame.boundingBox())!.y + (await imageFrame.boundingBox())!.height);
});

test("special order popup submits a CRM contact request", async ({ page }) => {
  const invalidEmail = await page.request.post("/api/contacts", { data: { first_name: "Ana", last_name: "Test", phone: "069123456", email: "invalid", comment: "Test" } });
  expect(invalidEmail.status()).toBe(400);
  let requestBody: any;
  await page.goto("/ro", { waitUntil: "networkidle" });
  await page.route("**/api/contacts", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  const header = page.locator("header");
  const specialOrder = header.getByRole("button", { name: "Comandă specială", exact: true });
  await expect(header.getByRole("link", { name: "Garanție", exact: true })).toHaveCount(0);
  expect(await specialOrder.evaluate((element) => getComputedStyle(element).color)).toBe(await header.getByRole("link", { name: "Contacte", exact: true }).evaluate((element) => getComputedStyle(element).color));
  await specialOrder.click();
  const dialog = page.getByRole("dialog", { name: "Comandă orice tehnică" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByAltText("Calculator disponibil la comandă specială")).toBeVisible();
  await dialog.getByLabel("Prenume").fill("Ana");
  await dialog.getByLabel("Nume", { exact: true }).fill("Test");
  await dialog.getByLabel("Telefon").fill("069123456");
  await dialog.getByLabel("Email (opțional)").fill("ana@example.com");
  await dialog.getByLabel("Ce produs cauți?").fill("Calculator pentru editare video");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Trimite cererea" }).click();
  await expect(dialog).toContainText("Cererea a fost trimisă");
  expect(requestBody).toMatchObject({ first_name: "Ana", last_name: "Test", phone: "069123456", email: "ana@example.com", comment: "Comandă specială: Calculator pentru editare video" });
});

test("condition appears by product price but not on catalog images", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  const grid = page.getByTestId("product-grid");
  const card = (id: number) => grid.locator(`article:has(a[href*="/product/${id}-"])`);

  await expect(page.locator("aside").getByText("Sticker", { exact: true })).toHaveCount(0);
  await expect(card(1458).getByTestId("condition-badge")).toHaveCount(0);
  await expect(card(1458).locator("p").first()).toContainText("GeForce RTX 50");
  await expect(card(1458).locator("p").first()).not.toContainText("Dedicată");
  await expect(card(1457).getByTestId("condition-badge")).toHaveCount(0);
  await expect(card(1452).getByTestId("condition-badge")).toHaveCount(0);

  await page.goto("/ru/product/1458", { waitUntil: "networkidle" });
  const productInfo = page.getByTestId("product-info");
  await expect(page.getByTestId("product-gallery").getByTestId("condition-badge")).toHaveCount(0);
  await expect(productInfo.getByTestId("condition-badge")).toHaveText("Новый");
  await expect(productInfo.getByText("Sticker", { exact: true })).toHaveCount(0);
  const [priceBox, conditionBox] = await Promise.all([
    productInfo.getByTestId("current-price").boundingBox(),
    productInfo.getByTestId("condition-badge").boundingBox(),
  ]);
  expect(conditionBox!.x).toBeGreaterThan(priceBox!.x + priceBox!.width);

  await page.goto("/en/product/1457", { waitUntil: "networkidle" });
  await expect(page.getByTestId("product-info").getByTestId("condition-badge")).toHaveText("Like new");

  await page.goto("/ro/product/1452", { waitUntil: "networkidle" });
  await expect(page.getByTestId("product-info").getByTestId("condition-badge")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ro/category/laptops", { waitUntil: "networkidle" });
  await expect(card(1458).getByTestId("condition-badge")).toHaveCount(0);
  await page.goto("/ro/product/1457", { waitUntil: "networkidle" });
  await expect(page.getByTestId("product-info").getByTestId("condition-badge")).toBeVisible();
});
