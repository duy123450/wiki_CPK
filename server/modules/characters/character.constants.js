// ─── Canonical display order ──────────────────────────────────────────────────
const CHARACTER_ORDER = [
    "Sakayori Iroha", "Kaguya", "Runami Yachiyo", "Ayatsumugi Roka",
    "Isayama Mami", "Sakayori Asahi", "Komazawa Rai", "Komazawa Noi",
    "inuDoge", "Fushi",
];

const sortByCanonicalOrder = (characters) => {
    const indexMap = new Map(
        CHARACTER_ORDER.map((name, i) => [name.toLowerCase(), i])
    );
    return [...characters].sort((a, b) => {
        const ai = indexMap.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        const bi = indexMap.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
    });
};

module.exports = { CHARACTER_ORDER, sortByCanonicalOrder };

