import {
  Users,
  Music,
  Film,
  BookOpen,
  Scroll,
  Star,
  Map,
  Sparkles,
} from "lucide-react";

/**
 * @fileoverview UI and Navigation constants
 */

/** @type {Object.<string, import('lucide-react').Icon>} Mapping of icon keys to Lucide components */
export const ICON_MAP = {
  users: Users,
  music: Music,
  film: Film,
  "book-open": BookOpen,
  scroll: Scroll,
  star: Star,
  map: Map,
  sparkles: Sparkles,
  "file-text": BookOpen,
};

/** @type {string[]} Labels for character image switcher */
export const IMAGE_LABELS = ["Real World", "Tsukuyomi", "Alt", "Other"];

/** @type {Object.<string, string>} CSS variables for character roles */
export const ROLE_COLORS = {
  Protagonist: "var(--wiki-gold)",
  Supporting: "var(--wiki-teal)",
  Antagonist: "var(--wiki-rose)",
  Cameo: "var(--wiki-muted)",
};

/** @type {Object.<string, string>} CSS variables for ability types */
export const ABILITY_TYPE_COLORS = {
  Passive: "var(--wiki-teal)",
  Active: "var(--wiki-purple)",
  Ultimate: "var(--wiki-gold)",
  Debuff: "var(--wiki-rose)",
};

/** @type {Array.<{label: string, href: string}>} Links for the footer and sidebar */
export const QUICK_LINKS = [
  { label: "Movie Info / Phim", href: "/wiki/chou-kaguya-hime-overview" },
  { label: "Characters / Nhân vật", href: "/wiki/characters" },
  { label: "Music / Âm nhạc", href: "/wiki/soundtrack" },
  { label: "Lore & World / Thế giới", href: "/wiki/lore" },
];
