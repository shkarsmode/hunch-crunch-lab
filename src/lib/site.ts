export const SITE_NAME = "Hunch Crunch Lab";
export const CHANNEL_URL = "https://www.youtube.com/@HunchCrunch";
export const PRICE = "$3";
export const PRICE_CENTS = 300;
export const PATREON_URL = process.env.NEXT_PUBLIC_PATREON_URL ?? "";

export function shortUrl(id: string) {
  return `https://youtube.com/shorts/${id}`;
}
