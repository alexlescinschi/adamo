import type { Locale } from "@/lib/translations";

export interface ContentPageDefinition {
  slug: string;
  group: "help" | "company";
  title: Record<Locale, string>;
}

export const CONTENT_PAGES: ContentPageDefinition[] = [
  { slug: "intrebari-si-raspunsuri", group: "help", title: { ro: "Întrebări și răspunsuri", ru: "Вопросы и ответы", en: "Questions and answers" } },
  { slug: "program-bonus", group: "help", title: { ro: "Program bonus", ru: "Бонусная программа", en: "Bonus program" } },
  { slug: "cumparare-in-credit", group: "help", title: { ro: "Cumpărare în credit", ru: "Покупка в кредит", en: "Buying on credit" } },
  { slug: "urmarirea-comenzii", group: "help", title: { ro: "Urmărirea comenzii", ru: "Отслеживание заказа", en: "Order tracking" } },
  { slug: "comanda-speciala", group: "help", title: { ro: "Comandă specială", ru: "Специальный заказ", en: "Special order" } },
  { slug: "promotii", group: "help", title: { ro: "Promoții", ru: "Акции", en: "Promotions" } },
  { slug: "cum-plasez-o-comanda", group: "help", title: { ro: "Cum plasez o comandă?", ru: "Как оформить заказ?", en: "How do I place an order?" } },
  { slug: "livrare-si-plata", group: "help", title: { ro: "Livrare și plată", ru: "Доставка и оплата", en: "Delivery and payment" } },
  { slug: "returnare-si-garantie", group: "help", title: { ro: "Returnare și garanție", ru: "Возврат и гарантия", en: "Returns and warranty" } },
  { slug: "termeni-si-conditii", group: "company", title: { ro: "Termeni și condiții", ru: "Условия использования", en: "Terms and conditions" } },
  { slug: "politica-de-confidentialitate", group: "company", title: { ro: "Politica de confidențialitate", ru: "Политика конфиденциальности", en: "Privacy policy" } },
  { slug: "despre-noi", group: "company", title: { ro: "Despre noi", ru: "О нас", en: "About us" } },
  { slug: "cum-aleg-un-laptop", group: "company", title: { ro: "Cum aleg un laptop?", ru: "Как выбрать ноутбук?", en: "How to choose a laptop" } },
  { slug: "centru-service", group: "company", title: { ro: "Centru de service", ru: "Сервисный центр", en: "Service center" } },
  { slug: "contact", group: "company", title: { ro: "Contacte", ru: "Контакты", en: "Contact" } },
];

export function contentPageTitle(slug: string, locale: string) {
  const page = CONTENT_PAGES.find((item) => item.slug === slug);
  const language: Locale = locale === "ru" || locale === "en" ? locale : "ro";
  return page?.title[language];
}
