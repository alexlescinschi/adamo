export const MANUFACTURERS: Record<string, string> = {
  "3q": "7413",
  acer: "7449",
  apple: "7415",
  asus: "7427",
  benq: "7436",
  casper: "7422",
  chuwi: "23163",
  clevo: "7429",
  compaq: "7423",
  dell: "7440",
  emachines: "7412",
  fujitsu: "7438",
  "fujitsu-siemens": "7425",
  gigabyte: "42410",
  hp: "7437",
  huawei: "23160",
  jumper: "23164",
  lg: "7448",
  lenovo: "7421",
  msi: "7428",
  mediacom: "23162",
  medion: "7430",
  microsoft: "42408",
  nokia: "7416",
  "packard bell": "7443",
  panasonic: "7447",
  razer: "39078",
  samsung: "7444",
  sony: "7417",
  toshiba: "7431",
  viliv: "7414",
  xiaomi: "22419",
  zte: "23161",
};

export const CONDITIONS: Record<string, string> = {
  nou: "6370",
  uzat: "6371",
  "pentru piese": "6372",
};

export const REGIONS: Record<string, string> = {
  "chișinău": "12900",
  chisinau: "12900",
  bălți: "12912",
  cahul: "12908",
};

export function findManufacturerId(label: string): string {
  const key = label.toLowerCase().trim();
  return MANUFACTURERS[key] || "7712"; // "Altele" as fallback
}

export function findConditionId(label: string): string {
  const key = label.toLowerCase().trim();
  return CONDITIONS[key] || "6371"; // "Uzat" as fallback
}
