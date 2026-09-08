/**
 * The four ETEN reaction types (matches the `reaction_type` enum). A member has
 * at most one reaction per item; picking a new one replaces it, picking the same
 * one removes it. Pure data — safe on server or client.
 */

export type ReactionType = "like" | "insightful" | "celebrate" | "support";

export const REACTION_TYPES: {
  type: ReactionType;
  emoji: string;
  label: string;
}[] = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "insightful", emoji: "💡", label: "Insightful" },
  { type: "celebrate", emoji: "🎉", label: "Celebrate" },
  { type: "support", emoji: "🤝", label: "Support" },
];

export type ReactionCounts = Record<ReactionType, number>;

export function emptyReactionCounts(): ReactionCounts {
  return { like: 0, insightful: 0, celebrate: 0, support: 0 };
}
