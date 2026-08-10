import { defineArrayMember, defineField, defineType } from "sanity";

const languageGroups = [
  { name: "ro", title: "Română", default: true },
  { name: "ru", title: "Русский" },
  { name: "en", title: "English" },
];

const richText = (name: string, title: string, group: string) =>
  defineField({
    name,
    title,
    group,
    type: "array",
    validation: (rule) => rule.required(),
    of: [
      defineArrayMember({
        type: "block",
        styles: [
          { title: "Text", value: "normal" },
          { title: "Titlu secțiune", value: "h2" },
          { title: "Subtitlu", value: "h3" },
          { title: "Citat", value: "blockquote" },
        ],
        marks: {
          decorators: [
            { title: "Bold", value: "strong" },
            { title: "Italic", value: "em" },
          ],
          annotations: [
            {
              name: "link",
              title: "Link",
              type: "object",
              fields: [
                defineField({
                  name: "href",
                  title: "Adresă",
                  type: "url",
                  validation: (rule) =>
                    rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }),
                }),
              ],
            },
          ],
        },
      }),
      defineArrayMember({
        type: "image",
        options: { hotspot: true },
        fields: [
          defineField({
            name: "alt",
            title: "Text alternativ",
            type: "string",
            validation: (rule) => rule.required(),
          }),
        ],
      }),
    ],
  });

const localizedFields = [
  ["ro", "RO"],
  ["ru", "RU"],
  ["en", "EN"],
].flatMap(([language, label]) => [
  defineField({
    name: `title_${language}`,
    title: `Titlu ${label}`,
    group: language,
    type: "string",
    validation: (rule) => rule.required().max(100),
  }),
  richText(`body_${language}`, `Conținut ${label}`, language),
  defineField({
    name: `seoTitle_${language}`,
    title: `Titlu SEO ${label}`,
    group: language,
    type: "string",
    validation: (rule) => rule.max(60),
  }),
  defineField({
    name: `seoDescription_${language}`,
    title: `Descriere SEO ${label}`,
    group: language,
    type: "text",
    rows: 3,
    validation: (rule) => rule.max(160),
  }),
]);

const page = defineType({
  name: "page",
  title: "Pagină",
  type: "document",
  groups: languageGroups,
  fields: [
    defineField({
      name: "name",
      title: "Denumire internă",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Adresă pagină",
      type: "slug",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    ...localizedFields,
  ],
  preview: {
    select: { title: "name", subtitle: "slug.current" },
  },
});

const postFields = [
  ["ro", "RO"],
  ["ru", "RU"],
  ["en", "EN"],
].flatMap(([language, label]) => [
  defineField({
    name: `title_${language}`,
    title: `Titlu ${label}`,
    group: language,
    type: "string",
    validation: (rule) => rule.required().max(100),
  }),
  defineField({
    name: `excerpt_${language}`,
    title: `Rezumat ${label}`,
    group: language,
    type: "text",
    rows: 3,
    validation: (rule) => rule.required().max(240),
  }),
  richText(`body_${language}`, `Conținut ${label}`, language),
  defineField({
    name: `seoTitle_${language}`,
    title: `Titlu SEO ${label}`,
    group: language,
    type: "string",
    validation: (rule) => rule.max(60),
  }),
  defineField({
    name: `seoDescription_${language}`,
    title: `Descriere SEO ${label}`,
    group: language,
    type: "text",
    rows: 3,
    validation: (rule) => rule.max(160),
  }),
]);

const post = defineType({
  name: "post",
  title: "Articol",
  type: "document",
  groups: languageGroups,
  fields: [
    defineField({
      name: "slug",
      title: "Adresă articol",
      type: "slug",
      options: { source: "title_ro", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Data publicării",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Imagine principală",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "alt",
          title: "Text alternativ",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    ...postFields,
  ],
  orderings: [
    {
      title: "Cele mai noi",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title_ro", subtitle: "publishedAt", media: "coverImage" },
  },
});

const contactSettings = defineType({
  name: "contactSettings",
  title: "Date de contact",
  type: "document",
  groups: languageGroups,
  fields: [
    defineField({ name: "phone", title: "Telefon", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "email", title: "Email", type: "email", validation: (rule) => rule.required() }),
    ...[
      ["ro", "RO"],
      ["ru", "RU"],
      ["en", "EN"],
    ].flatMap(([language, label]) => [
      defineField({
        name: `address_${language}`,
        title: `Adresă ${label}`,
        group: language,
        type: "string",
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: `hours_${language}`,
        title: `Program ${label}`,
        group: language,
        type: "text",
        rows: 3,
        validation: (rule) => rule.required(),
      }),
    ]),
  ],
  preview: { prepare: () => ({ title: "Date de contact" }) },
});

export const schemaTypes = [page, post, contactSettings];
