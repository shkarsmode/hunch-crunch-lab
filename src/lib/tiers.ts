export type Tier = {
  id: "coin" | "dice" | "streak" | "golden" | "million";
  name: string;
  months: number;
  line: string;
  color: string;
};

export const TIERS: Tier[] = [
  { id: "coin", name: "Coin Flipper", months: 1, line: "Heads or tails, you showed up.", color: "#A9B6D3" },
  { id: "dice", name: "Dice Roller", months: 3, line: "Three months of rolling with us.", color: "#3FE0FF" },
  { id: "streak", name: "Lucky Streak", months: 6, line: "Six in a row. Statistically suspicious.", color: "#3EE6A0" },
  { id: "golden", name: "Golden Crunch", months: 12, line: "A whole year. Crunchy bows to you.", color: "#FFC94A" },
  { id: "million", name: "One in a Million", months: 24, line: "Two years. You are the outlier.", color: "#FF5C7A" },
];

export const FOUNDER_SLOTS = 100;

export function tierFor(months: number): Tier | null {
  let t: Tier | null = null;
  for (const x of TIERS) if (months >= x.months) t = x;
  return t;
}

export function nextTier(months: number): Tier | null {
  return TIERS.find((x) => x.months > months) ?? null;
}
