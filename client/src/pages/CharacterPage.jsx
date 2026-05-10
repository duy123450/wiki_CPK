/* eslint-disable react-hooks/purity */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ROLE_COLORS } from "../constants";
import "../styles/CharacterPage.css";

import { getAppearance } from "../utils/characterUtils";
import { generateParticles } from "../utils/uiUtils";
import { useCharacter } from "../hooks/useCharacter";

// Components
import AbilityCard from "../components/Character/AbilityCard";
import RelChip from "../components/Character/RelChip";
import ImageSwitcher from "../components/Character/ImageSwitcher";

// ─── Role badge ───────────────────────────────────────────────────────────────

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
  const [pts] = useState(() => generateParticles(30));
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
  const { character, loading, error } = useCharacter(slug);

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

