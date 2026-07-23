import type { StructureResolver } from "sanity/structure";

export const PAGE_DEFINITIONS = [
  { slug: "intrebari-si-raspunsuri", ro: "Întrebări și răspunsuri", ru: "Вопросы и ответы", en: "Questions and answers" },
  { slug: "program-bonus", ro: "Program bonus", ru: "Бонусная программа", en: "Bonus program" },
  { slug: "cumparare-in-credit", ro: "Cumpărare în credit", ru: "Покупка в кредит", en: "Buying on credit" },
  { slug: "urmarirea-comenzii", ro: "Urmărirea comenzii", ru: "Отслеживание заказа", en: "Order tracking" },
  { slug: "comanda-speciala", ro: "Comandă specială", ru: "Специальный заказ", en: "Special order" },
  { slug: "promotii", ro: "Promoții", ru: "Акции", en: "Promotions" },
  { slug: "cum-plasez-o-comanda", ro: "Cum plasez o comandă?", ru: "Как оформить заказ?", en: "How do I place an order?" },
  { slug: "livrare-si-plata", ro: "Livrare și plată", ru: "Доставка и оплата", en: "Delivery and payment" },
  { slug: "returnare-si-garantie", ro: "Returnare și garanție", ru: "Возврат и гарантия", en: "Returns and warranty" },
  { slug: "termeni-si-conditii", ro: "Termeni și condiții", ru: "Условия использования", en: "Terms and conditions" },
  { slug: "politica-de-confidentialitate", ro: "Politica de confidențialitate", ru: "Политика конфиденциальности", en: "Privacy policy" },
  { slug: "despre-noi", ro: "Despre noi", ru: "О нас", en: "About us" },
  { slug: "cum-aleg-un-laptop", ro: "Cum aleg un laptop?", ru: "Как выбрать ноутбук?", en: "How to choose a laptop" },
  { slug: "centru-service", ro: "Centru de service", ru: "Сервисный центр", en: "Service center" },
  { slug: "contact", ro: "Contacte", ru: "Контакты", en: "Contact" },
] as const;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Conținut")
    .items([
      S.listItem()
        .title("Pagini")
        .child(
          S.list()
            .title("Pagini")
            .items(
              PAGE_DEFINITIONS.map(({ slug, ro: title }) =>
                S.listItem()
                  .title(title)
                  .child(S.document().schemaType("page").documentId(`page-${slug}`)),
              ),
            ),
        ),
      S.documentTypeListItem("post").title("Blog"),
      S.listItem()
        .title("Date de contact")
        .child(S.document().schemaType("contactSettings").documentId("contact-settings")),
    ]);
