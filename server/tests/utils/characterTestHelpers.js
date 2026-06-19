/**
 * Character Service Test Helpers
 * Pure functions extracted from character.service.js for unit testing.
 *
 * These helpers are re-implemented here so they can be tested in isolation
 * without depending on the full service module.
 */

const CHARACTER_ORDER = [
  'Sakayori Iroha',
  'Kaguya',
  'Runami Yachiyo',
  'Ayatsumugi Roka',
  'Isayama Mami',
  'Sakayori Asahi',
  'Komazawa Rai',
  'Komazawa Noi',
  'inuDoge',
  'Fushi',
];

/**
 * Sort characters by canonical order (defined character list takes precedence)
 */
function sortByCanonicalOrder(characters) {
  const indexMap = new Map(
    CHARACTER_ORDER.map((name, i) => [name.toLowerCase(), i])
  );
  return [...characters].sort((a, b) => {
    const ai = indexMap.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const bi = indexMap.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Convert character name to URL slug
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Format raw character object for API response
 */
function formatCharacter(char) {
  return {
    _id: char._id,
    name: char.name,
    slug: char.slug || nameToSlug(char.name),
    role: char.role,
    description: char.description ?? null,
    origin: char.origin ?? null,
    abilities: char.abilities ?? [],
    relationships: (char.relationships ?? []).map((rel) => ({
      ...rel,
      targetId: rel.targetId ?? null,
    })),
    image: char.image ?? [],
    voiceActor: char.voiceActor ?? null,
    movie: char.movie,
  };
}

module.exports = {
  CHARACTER_ORDER,
  sortByCanonicalOrder,
  nameToSlug,
  formatCharacter,
};
