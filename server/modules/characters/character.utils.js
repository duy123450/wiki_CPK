const nameToSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const formatCharacter = (char) => ({
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
});

module.exports = { nameToSlug, formatCharacter };
