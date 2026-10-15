export type Category = { name: string; emoji: string; color: string };

// Colours are always paired with a text label, so colour is never the only signal.
export const CATEGORIES: Category[] = [
  { name: "Groceries", emoji: "🛒", color: "#16a34a" },
  { name: "Rent & bills", emoji: "🏠", color: "#4f46e5" },
  { name: "Eating out", emoji: "🍕", color: "#ea580c" },
  { name: "Transport", emoji: "🚇", color: "#0891b2" },
  { name: "Going out", emoji: "🎉", color: "#db2777" },
  { name: "Study & books", emoji: "📚", color: "#7c3aed" },
  { name: "Subscriptions", emoji: "📱", color: "#ca8a04" },
  { name: "Other", emoji: "💸", color: "#64748b" },
];

export const DEFAULT_CATEGORY = "Other";

export function categoryInfo(name: string): Category {
  return CATEGORIES.find((c) => c.name === name) ?? { name, emoji: "💸", color: "#64748b" };
}
