/* eslint-disable react-hooks/purity */
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/CharacterPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchCharacter(slug) {
  const res = await fetch(`${API_BASE}/characters/${slug}`);
  if (!res.ok) throw new Error(`Character not found (${res.status})`);
  const data = await res.json();
  return data.character;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Normalize ability effects: seed has BOTH "effect" and "effects" as field names
const getEffects = (ability) => ability.effect ?? ability.effects ?? [];

// Normalize appearance: seed uses real_world / tsukuyomi_avatar
// model schema uses realWorld / tsukuyomi — handle both
const getAppearance = (appearance) => {
  if (!appearance) return null;
  return {
    realWorld: appearance.realWorld ?? appearance.real_world ?? null,
    tsukuyomi: appearance.tsukuyomi ?? appearance.tsukuyomi_avatar ?? null,
  };
};

// ─── Image switcher ───────────────────────────────────────────────────────────
const IMAGE_LABELS = ["Real World", "Tsukuyomi", "Alt", "Other"];

function ImageSwitcher({ images }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const switchTo = useCallback(
    (idx) => {
      if (idx === active || fading) return;
      setFading(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActive(idx);
        setFading(false);
      }, 260);
    },
    [active, fading],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!images || images.length === 0) {
    return (
      <div className="chr-img-placeholder">
        <span className="chr-img-placeholder-glyph">✦</span>
      </div>
    );
  }

  const single = images.length === 1;

  return (
    <div className="chr-img-block">
      <div className="chr-img-frame">
        <div className="chr-img-corner chr-img-corner--tl" />
        <div className="chr-img-corner chr-img-corner--tr" />
        <div className="chr-img-corner chr-img-corner--bl" />
        <div className="chr-img-corner chr-img-corner--br" />
        <img
          key={active}
          src={images[active].url}
          alt={`character view ${active + 1}`}
          className={`chr-img-main ${fading ? "chr-img-fade-out" : "chr-img-fade-in"}`}
        />
        <div className="chr-img-reflection" />
      </div>

      {!single && (
        <div className="chr-img-switcher">
          {images.map((_, i) => (
            <button
              key={i}
              className={`chr-switch-btn ${i === active ? "chr-switch-btn--active" : ""}`}
              onClick={() => switchTo(i)}
              aria-label={IMAGE_LABELS[i] ?? `View ${i + 1}`}
            >
              <span className="chr-switch-label">
                {IMAGE_LABELS[i] ?? `View ${i + 1}`}
              </span>
              <span className="chr-switch-glow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  Protagonist: "var(--chr-gold)",
  Supporting: "var(--chr-teal)",
  Antagonist: "var(--chr-rose)",
  Cameo: "var(--chr-muted)",
};

function RoleBadge({ role }) {
  return (
    <span
      className="chr-role-badge"
      style={{ "--badge-color": ROLE_COLORS[role] ?? "var(--chr-purple)" }}
    >
      {role}
    </span>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="chr-stat-row">
      <dt className="chr-stat-label">{label}</dt>
      <dd className="chr-stat-value">{value}</dd>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, ornamentColor, children }) {
  return (
    <div className="chr-section-card">
      <div className="chr-section-head">
        <span
          className="chr-section-orn"
          style={{ "--orn-color": ornamentColor ?? "var(--chr-purple)" }}
        />
        <h2 className="chr-section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Ability card ─────────────────────────────────────────────────────────────
const ABILITY_TYPE_COLORS = {
  Passive: "var(--chr-teal)",
  Active: "var(--chr-purple)",
  Ultimate: "var(--chr-gold)",
  Debuff: "var(--chr-rose)",
};

function AbilityCard({ ability }) {
  const effects = getEffects(ability);
  return (
    <div className="chr-ability-card">
      <div className="chr-ability-head">
        <span className="chr-ability-name">{ability.skillName}</span>
        {ability.type && (
          <span
            className="chr-ability-type"
            style={{
              "--atype-color":
                ABILITY_TYPE_COLORS[ability.type] ?? "var(--chr-muted)",
            }}
          >
            {ability.type}
          </span>
        )}
      </div>
      {effects.length > 0 && (
        <ul className="chr-ability-effects">
          {effects.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Relationship chip ────────────────────────────────────────────────────────
function RelChip({ rel }) {
  // A populated targetId is an object with a "name" field.
  // A raw (un-populated) ObjectId comes back as a string or an object without
  // "name" — in both cases we fall back to null so the UI shows "Unknown".
  const target =
    rel.targetId && typeof rel.targetId === "object" && rel.targetId.name
      ? rel.targetId
      : null;

  return (
    <div className="chr-rel-chip">
      {/* Avatar */}
      {target?.image?.[0]?.url ? (
        <img
          src={target.image[0].url}
          alt={target.name}
          className="chr-rel-avatar"
        />
      ) : (
        <div className="chr-rel-avatar chr-rel-avatar--placeholder">✦</div>
      )}

      {/* Info */}
      <div className="chr-rel-info">
        <span className="chr-rel-name">{target?.name ?? "Unknown"}</span>
        {rel.relationType && (
          <span className="chr-rel-type">{rel.relationType}</span>
        )}
        {rel.description && (
          <span className="chr-rel-desc">{rel.description}</span>
        )}
      </div>
    </div>
  );
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="chr-skeleton">
      <div className="chr-skeleton-img" />
      <div className="chr-skeleton-body">
        <div className="chr-skeleton-bar w-40" />
        <div className="chr-skeleton-bar w-60" />
        <div className="chr-skeleton-bar w-30" />
      </div>
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const pts = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.8,
    delay: `${Math.random() * 8}s`,
    dur: `${Math.random() * 5 + 4}s`,
  }));
  return (
    <div className="chr-particles" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="chr-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CharacterPage({ sidebarCollapsed }) {
  const { slug } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCharacter(slug)
      .then(setCharacter)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const c = character;
  const appearance = c ? getAppearance(c.description?.appearance) : null;

  return (
    <main className={`chr-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Particles />

      <div className="chr-breadcrumb">
        <Link to="/wiki/characters" className="chr-back-link">
          ← All Characters
        </Link>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="chr-error">
          <span className="chr-error-glyph">✦</span>
          <p>{error}</p>
          <Link to="/wiki/characters" className="chr-back-link">
            ← Back to Characters
          </Link>
        </div>
      ) : (
        <div className="chr-layout">
          {/* ── LEFT: image + quick stats ── */}
          <aside className="chr-aside">
            <ImageSwitcher images={c.image} />

            <div className="chr-quick-stats">
              <RoleBadge role={c.role} />

              {c.voiceActor && (
                <p className="chr-voice">
                  <span className="chr-voice-label">Voice</span>
                  {c.voiceActor}
                </p>
              )}

              {c.origin && (
                <dl className="chr-stat-list">
                  <StatRow label="Location" value={c.origin.location} />
                  <StatRow label="Birthday" value={c.origin.birthday} />
                  <StatRow label="Race" value={c.origin.race} />
                </dl>
              )}

              {c.metadata && (
                <dl className="chr-stat-list">
                  <StatRow label="Alias" value={c.metadata.alias} />
                  <StatRow label="Occupation" value={c.metadata.occupation} />
                  {c.metadata.family &&
                    Object.entries(c.metadata.family).map(([k, v]) =>
                      v ? (
                        <StatRow
                          key={k}
                          label={k.charAt(0).toUpperCase() + k.slice(1)}
                          value={v}
                        />
                      ) : null,
                    )}
                </dl>
              )}
            </div>
          </aside>

          {/* ── RIGHT: main content ── */}
          <div className="chr-main">
            <header className="chr-header">
              <div className="chr-eyebrow">
                <span className="chr-eyebrow-dot" />
                Character · {c.movie?.title ?? "CPK"}
              </div>
              <h1 className="chr-name">{c.name}</h1>
              <div className="chr-header-rule" />
            </header>

            {/* Overview */}
            {c.description?.summary && (
              <SectionCard title="Overview" ornamentColor="var(--chr-purple)">
                <p className="chr-synopsis">{c.description.summary}</p>
              </SectionCard>
            )}

            {/* Personality */}
            {c.description?.personality && (
              <SectionCard title="Personality" ornamentColor="var(--chr-teal)">
                <p className="chr-synopsis">{c.description.personality}</p>
              </SectionCard>
            )}

            {/* Appearance — reads both key naming conventions */}
            {(appearance?.realWorld || appearance?.tsukuyomi) && (
              <SectionCard title="Appearance" ornamentColor="var(--chr-gold)">
                <div className="chr-appearance-grid">
                  {appearance.realWorld && (
                    <div className="chr-appear-block">
                      <p className="chr-appear-heading">Real World</p>
                      <p className="chr-synopsis">{appearance.realWorld}</p>
                    </div>
                  )}
                  {appearance.tsukuyomi && (
                    <div className="chr-appear-block">
                      <p className="chr-appear-heading">Tsukuyomi</p>
                      <p className="chr-synopsis">{appearance.tsukuyomi}</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Abilities — handles both "effect" and "effects" field names */}
            {c.abilities?.length > 0 && (
              <SectionCard title="Abilities" ornamentColor="var(--chr-rose)">
                <div className="chr-abilities-grid">
                  {c.abilities.map((ab, i) => (
                    <AbilityCard key={i} ability={ab} />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Relationships */}
            {c.relationships?.length > 0 && (
              <SectionCard
                title="Relationships"
                ornamentColor="var(--chr-teal)"
              >
                <div className="chr-rels-grid">
                  {c.relationships.map((rel, i) => (
                    <RelChip key={i} rel={rel} />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
