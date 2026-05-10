import { nameToSlug } from "./slugify";


/**
 * Normalizes character appearance data across different schema versions
 * @param {object} appearance 
 * @returns {object|null}
 */
export const getAppearance = (appearance) => {
  if (!appearance) return null;
  return {
    realWorld: appearance.realWorld ?? appearance.real_world ?? null,
    tsukuyomi: appearance.tsukuyomi ?? appearance.tsukuyomi_avatar ?? null,
  };
};

/**
 * Extracts effects from an ability object, handling multiple field naming conventions
 * @param {object} ability 
 * @returns {string[]}
 */
export const getEffects = (ability) => ability.effect ?? ability.effects ?? [];
