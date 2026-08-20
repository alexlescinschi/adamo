import { expect, test } from "playwright/test";
import { getDict } from "../src/lib/translations";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value)
    .flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key))
    .sort();
}

function placeholders(value: unknown, prefix = "", result: Record<string, string[]> = {}) {
  if (typeof value === "string") {
    result[prefix] = [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
    return result;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      placeholders(child, prefix ? `${prefix}.${key}` : key, result);
    }
  }
  return result;
}

test("RO, RU and EN dictionaries have matching keys and placeholders", () => {
  const ro = getDict("ro");
  const ru = getDict("ru");
  const en = getDict("en");

  expect(leafPaths(ru)).toEqual(leafPaths(ro));
  expect(leafPaths(en)).toEqual(leafPaths(ro));
  expect(placeholders(ru)).toEqual(placeholders(ro));
  expect(placeholders(en)).toEqual(placeholders(ro));
});

test("every emitted API error code has translations", () => {
  const apiRoot = path.resolve(process.cwd(), "src/app/api");
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const file = path.join(directory, entry);
      if (statSync(file).isDirectory()) visit(file);
      else if (file.endsWith(".ts")) files.push(file);
    }
  };
  visit(apiRoot);

  const codes = new Set<string>();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:code:\s*|errorResponse\()"([A-Za-z]+)"/g)) codes.add(match[1]);
  }

  for (const locale of ["ro", "ru", "en"] as const) {
    const errors = getDict(locale).errors as Record<string, string>;
    for (const code of codes) expect(errors[code], `${locale}.${code}`).toBeTruthy();
  }
});

for (const locale of ["ru", "en"] as const) {
  test(`${locale.toUpperCase()} technical pages do not render Romanian chrome`, async ({ request }) => {
    const paths = [
      `/${locale}/login`,
      `/${locale}/register`,
      `/${locale}/checkout/invoice?orderId=1`,
      `/${locale}/checkout/iute?status=cancelled&orderId=1`,
    ];
    const forbidden = [
      "Autentificare",
      "Înregistrare",
      "Parolă",
      "Nu ai cont?",
      "Ai deja cont?",
      "Factura nu mai este disponibilă",
      "Aplicația a fost anulată",
      "Toate drepturile rezervate",
      "Creat cu",
      "Laptopuri premium",
    ];

    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      for (const marker of forbidden) expect(html, `${path}: ${marker}`).not.toContain(marker);
    }
  });
}

test("RU and EN metadata is localized", async ({ request }) => {
  const ru = await request.get("/ru").then((response) => response.text());
  const en = await request.get("/en").then((response) => response.text());

  expect(ru).toContain("Ноутбуки и компьютеры в Кишинёве, Молдова | ADAMO.MD");
  expect(ru).toContain("ru_RU");
  expect(en).toContain("Laptops &amp; Computers in Chisinau, Moldova | ADAMO.MD");
  expect(en).toContain("en_US");
  expect(ru).not.toContain("Laptopuri și calculatoare în Chișinău, Moldova");
  expect(en).not.toContain("Laptopuri și calculatoare în Chișinău, Moldova");
});

test("locale defaults to ro regardless of Accept-Language; cookie still overrides", async ({ request }) => {
  // ponytail: SEO fix 2026-08-20 — Accept-Language sniffing removed, default is always ro.
  const ignoredHeader = await request.get("/", {
    headers: { "Accept-Language": "ro;q=0,en;q=1" },
    maxRedirects: 0,
  });
  expect(ignoredHeader.headers().location).toContain("/ro");

  const dotted = await request.get("/product/model-15.6", {
    headers: { "Accept-Language": "ru" },
    maxRedirects: 0,
  });
  expect(dotted.headers().location).toContain("/ro/product/model-15.6");

  const russian = await request.get("/ru");
  expect(russian.status()).toBe(200);
  expect(russian.headers()["set-cookie"]).toContain("NEXT_LOCALE=ru");

  const account = await request.get("/account", { maxRedirects: 0 });
  expect(account.headers().location).toContain("/ru/account");
});

test("utility routes are noindex and home owns its canonical", async ({ request }) => {
  const login = await request.get("/en/login").then((response) => response.text());
  const home = await request.get("/en").then((response) => response.text());

  expect(login).toContain('name="robots" content="noindex, nofollow"');
  expect(home).toContain('rel="canonical" href="https://adamo.md/en"');
  expect(login).not.toContain('rel="canonical" href="https://adamo.md/en"');
});
