export const SITE_URL = (process.env.SITE_URL || "https://adamo.md").replace(/\/$/, "");
export const IS_STAGING = process.env.DEPLOY_ENV === "staging";

export function localizedAlternates(locale: string, path: string) {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      ro: `${SITE_URL}/ro${path}`,
      ru: `${SITE_URL}/ru${path}`,
      en: `${SITE_URL}/en${path}`,
      "x-default": `${SITE_URL}/ro${path}`,
    },
  };
}
