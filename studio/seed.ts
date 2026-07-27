import { getCliClient } from "sanity/cli";
import { PAGE_DEFINITIONS } from "./structure";

const client = getCliClient({ apiVersion: "2026-07-23" });

const block = (texts: string[], key: string) =>
  texts.map((text, index) => ({
    _key: `${key}-${index}`,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: `${key}-${index}-text`, _type: "span", marks: [], text }],
  }));

const initialBody: Record<string, { ro: string[]; ru: string[]; en: string[] }> = {
  "livrare-si-plata": {
    ro: ["Livrarea este gratuită pe întreg teritoriul Republicii Moldova și se efectuează de luni până vineri.", "Termenul obișnuit este de 1-2 zile lucrătoare. Comanda poate fi achitată la primire."],
    ru: ["Доставка бесплатна по всей территории Республики Молдова и выполняется с понедельника по пятницу.", "Обычный срок доставки составляет 1-2 рабочих дня. Заказ можно оплатить при получении."],
    en: ["Delivery is free throughout the Republic of Moldova and takes place Monday through Friday.", "The usual delivery time is 1-2 business days. The order can be paid for upon receipt."],
  },
  "returnare-si-garantie": {
    ro: ["Produsele cumpărate beneficiază de garanție conform legii și condițiilor comerciale ale producătorului.", "Serviciile de reparație se acordă în baza certificatului de garanție. Perioada de reparație este stabilită între 15 zile calendaristice și o lună de la acceptarea cererii de către centrul de service ADAMO."],
    ru: ["На приобретённые товары предоставляется гарантия в соответствии с законом и коммерческими условиями производителя.", "Ремонт выполняется на основании гарантийного сертификата. Срок ремонта составляет от 15 календарных дней до одного месяца с момента принятия заявки сервисным центром ADAMO."],
    en: ["Purchased products are covered by warranty according to the law and the manufacturer's commercial terms.", "Repair services are provided based on the warranty certificate. Repairs take between 15 calendar days and one month from acceptance by the ADAMO service center."],
  },
  "politica-de-confidentialitate": {
    ro: ["Adamo SRL respectă confidențialitatea datelor personale ale clienților săi. Colectăm doar datele necesare procesării comenzilor: nume, email, telefon și adresă de livrare.", "Datele sunt utilizate pentru procesarea și livrarea comenzilor, comunicarea cu clienții și îmbunătățirea serviciilor. Aplicăm măsuri tehnice și organizatorice pentru protejarea lor."],
    ru: ["Adamo SRL уважает конфиденциальность персональных данных своих клиентов. Мы собираем только данные, необходимые для обработки заказов: имя, электронную почту, телефон и адрес доставки.", "Данные используются для обработки и доставки заказов, общения с клиентами и улучшения услуг. Для их защиты применяются технические и организационные меры."],
    en: ["Adamo SRL respects the privacy of its customers' personal data. We collect only the data needed to process orders: name, email, phone number, and delivery address.", "The data is used to process and deliver orders, communicate with customers, and improve services. We apply technical and organizational measures to protect it."],
  },
};

const transaction = client.transaction();

for (const { slug, ro, ru, en } of PAGE_DEFINITIONS) {
  const body = initialBody[slug] || {
    ro: ["Conținutul acestei pagini trebuie completat și verificat înainte de publicare."],
    ru: ["Содержимое этой страницы необходимо заполнить и проверить перед публикацией."],
    en: ["This page must be completed and reviewed before publication."],
  };
  transaction.createIfNotExists({
    _id: `drafts.page-${slug}`,
    _type: "page",
    name: ro,
    slug: { _type: "slug", current: slug },
    title_ro: ro,
    body_ro: block(body.ro, `${slug}-ro`),
    title_ru: ru,
    body_ru: block(body.ru, `${slug}-ru`),
    title_en: en,
    body_en: block(body.en, `${slug}-en`),
  });
}

transaction.createIfNotExists({
  _id: "drafts.contact-settings",
  _type: "contactSettings",
  phone: "+37379966909",
  email: "adamocomputers@gmail.com",
  address_ro: "Mun. Chișinău, Rîșcani, str. Dumitru Rîșcanu 11",
  hours_ro: "Luni - Vineri: 09:00 - 18:00\nSâmbătă: 10:00 - 16:00",
  address_ru: "Кишинёв, Рышкановка, ул. Думитру Рышкану 11",
  hours_ru: "Понедельник - Пятница: 09:00 - 18:00\nСуббота: 10:00 - 16:00",
  address_en: "11 Dumitru Riscanu Street, Riscani, Chisinau",
  hours_en: "Monday - Friday: 09:00 - 18:00\nSaturday: 10:00 - 16:00",
});

await transaction.commit();
const draftCount = await client.withConfig({ perspective: "raw" }).fetch<number>(
  "count(*[_id in path('drafts.**')])",
);
console.log(`Seeded ${PAGE_DEFINITIONS.length} pages and contact settings (${draftCount} drafts total).`);
