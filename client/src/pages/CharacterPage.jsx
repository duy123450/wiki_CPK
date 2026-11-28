import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ROLE_COLORS } from '../constants/ui.constants'

import { getAppearance } from '../utils/characterUtils'
import { generateParticles } from '../utils/uiUtils'
import { useCharacter } from '../hooks/useCharacter'

// Components
import AbilityCard from '../components/Character/AbilityCard'
import RelChip from '../components/Character/RelChip'
import ImageSwitcher from '../components/Character/ImageSwitcher'

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const roleBackgrounds = {
    Protagonist: 'rgba(232,201,122,0.10)',
    Supporting: 'rgba(103,232,249,0.10)',
    Antagonist: 'rgba(249,168,212,0.10)',
    Cameo: 'rgba(240,232,255,0.035)',
  }
  const badgeColor = ROLE_COLORS[role] ?? '#c084fc'
  return (
    <span
      className="inline-flex w-fit items-center gap-[6px] rounded-full border border-solid px-[14px] py-[5px] font-['Inter',sans-serif] text-[9px] tracking-[0.22em] uppercase"
      style={{
        borderColor: badgeColor,
        backgroundColor: roleBackgrounds[role] ?? 'rgba(192,132,252,0.10)',
        color: badgeColor,
      }}
    >
      {role}
    </span>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-[2px]">
      <dt className="font-['Inter',sans-serif] text-[8.5px] tracking-[0.2em] text-[#c084fc] uppercase opacity-[0.75]">
        {label}
      </dt>
      <dd className="m-0 text-[12.5px] leading-[1.5] text-[rgba(240,232,255,0.78)]">
        {value}
      </dd>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, ornamentColor, children }) {
  return (
    <div className="rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.03)] p-[clamp(18px,3vw,28px)] transition-[border-color] duration-[250ms] hover:border-[rgba(192,132,252,0.3)]">
      <div className="mb-4 flex items-center gap-[10px]">
        <span
          className="h-4 w-[3px] shrink-0 rounded-[2px]"
          style={{ backgroundColor: ornamentColor ?? '#c084fc' }}
        />
        <h2 className="m-0 font-['Inter',sans-serif] text-[11px] font-semibold tracking-[0.22em] text-[#c084fc] uppercase">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[320px_1fr] gap-10 max-[900px]:grid-cols-1">
      <div className="aspect-[3/4] rounded-xl bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] motion-safe:animate-character-skeleton-slide motion-reduce:animate-none" />
      <div className="flex flex-col gap-[14px] pt-3">
        <div className="h-[18px] w-[40%] rounded-[6px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] motion-safe:animate-character-skeleton-slide motion-reduce:animate-none" />
        <div className="h-[18px] w-[60%] rounded-[6px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] motion-safe:animate-character-skeleton-slide motion-reduce:animate-none" />
        <div className="h-[18px] w-[30%] rounded-[6px] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] motion-safe:animate-character-skeleton-slide motion-reduce:animate-none" />
      </div>
    </div>
  )
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const [pts] = useState(() => generateParticles(30))
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-[rgba(192,132,252,0.7)] motion-safe:animate-character-particle-drift motion-reduce:animate-none"
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
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CharacterPage({ sidebarCollapsed }) {
  const { slug } = useParams()
  const { character, loading, error } = useCharacter(slug)

  const c = character
  const appearance = c ? getAppearance(c.description?.appearance) : null

  return (
    <main
      className={`relative box-border min-h-[100vh] min-h-[100dvh] max-w-[100vw] overflow-x-hidden bg-[#05040f] px-[clamp(16px,5vw,56px)] pt-[clamp(24px,5vw,56px)] pb-20 font-['Source_Sans_3',sans-serif] text-[#f0e8ff] transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] w-[calc(100%_-_var(--sidebar-current-width,260px))] ml-[var(--sidebar-current-width,260px)] max-[768px]:w-full max-[768px]:ml-0 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Particles />

      <div className="relative z-[1] mb-7">
        <Link
          to="/wiki/characters"
          className="font-['Inter',sans-serif] text-[10px] tracking-[0.22em] text-[#c084fc] uppercase no-underline opacity-[0.75] transition-opacity duration-200 hover:opacity-100"
        >
          ← All Characters
        </Link>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="relative z-[1] flex flex-col items-center gap-4 px-5 py-20 text-center text-sm text-[rgba(240,232,255,0.35)]">
          <span className="text-4xl text-[rgba(240,232,255,0.18)]">✦</span>
          <p>{error}</p>
          <Link
            to="/wiki/characters"
            className="font-['Inter',sans-serif] text-[10px] tracking-[0.22em] text-[#c084fc] uppercase no-underline opacity-[0.75] transition-opacity duration-200 hover:opacity-100"
          >
            ← Back to Characters
          </Link>
        </div>
      ) : (
        <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[320px_1fr] items-start gap-[clamp(24px,4vw,48px)] motion-safe:animate-character-reveal motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 max-[900px]:grid-cols-1">
          {/* ── LEFT: image + quick stats ── */}
          <aside className="sticky top-6 flex flex-col gap-5 max-[900px]:static">
            <ImageSwitcher images={c.image} />

            <div className="flex flex-col gap-[14px] rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
              <RoleBadge role={c.role} />

              {c.voiceActor && (
                <p className="m-0 flex flex-col gap-[2px] text-[13px] text-[rgba(240,232,255,0.8)]">
                  <span className="mb-[2px] block font-['Inter',sans-serif] text-[8.5px] tracking-[0.22em] text-[#67e8f9] uppercase opacity-80">
                    Voice
                  </span>
                  {c.voiceActor}
                </p>
              )}

              {c.origin && (
                <dl className="m-0 flex flex-col gap-2 border-t border-solid border-[rgba(180,140,255,0.12)] pt-2">
                  <StatRow label="Location" value={c.origin.location} />
                  <StatRow label="Birthday" value={c.origin.birthday} />
                  <StatRow label="Race" value={c.origin.race} />
                </dl>
              )}

              {c.metadata && (
                <dl className="m-0 flex flex-col gap-2 border-t border-solid border-[rgba(180,140,255,0.12)] pt-2">
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
                      ) : null
                    )}
                </dl>
              )}
            </div>
          </aside>

          {/* ── RIGHT: main content ── */}
          <div className="flex flex-col gap-6">
            <header className="mb-1 flex flex-col gap-[10px]">
              <div className="inline-flex items-center gap-[7px] font-['Inter',sans-serif] text-[10px] tracking-[0.25em] text-[#e8c97a] uppercase opacity-[0.85]">
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#e8c97a] shadow-[0_0_8px_#e8c97a] motion-safe:animate-character-dot-pulse motion-reduce:animate-none" />
                Character · {c.movie?.title ?? 'CPK'}
              </div>
              <h1 className="m-0 font-['Inter',sans-serif] text-[clamp(26px,4.5vw,52px)] leading-[1.1] font-bold text-white [text-shadow:0_0_50px_rgba(192,132,252,0.3),0_2px_4px_rgba(0,0,0,0.5)]">
                {c.name}
              </h1>
              <div className="mt-1 h-px w-[clamp(40px,10vw,90px)] border-0 bg-[linear-gradient(to_right,#e8c97a,transparent)]" />
            </header>

            {/* Overview */}
            {c.description?.summary && (
              <SectionCard title="Overview" ornamentColor="#c084fc">
                <p className="m-0 text-[13.5px] leading-[1.85] font-light text-[rgba(240,232,255,0.72)]">
                  {c.description.summary}
                </p>
              </SectionCard>
            )}

            {/* Personality */}
            {c.description?.personality && (
              <SectionCard title="Personality" ornamentColor="#67e8f9">
                <p className="m-0 text-[13.5px] leading-[1.85] font-light text-[rgba(240,232,255,0.72)]">
                  {c.description.personality}
                </p>
              </SectionCard>
            )}

            {/* Appearance — reads both key naming conventions */}
            {(appearance?.realWorld || appearance?.tsukuyomi) && (
              <SectionCard title="Appearance" ornamentColor="#e8c97a">
                <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
                  {appearance.realWorld && (
                    <div>
                      <p className="m-0 mb-2 font-['Inter',sans-serif] text-[9px] tracking-[0.2em] text-[#e8c97a] uppercase opacity-80">
                        Real World
                      </p>
                      <p className="m-0 text-[13.5px] leading-[1.85] font-light text-[rgba(240,232,255,0.72)]">
                        {appearance.realWorld}
                      </p>
                    </div>
                  )}
                  {appearance.tsukuyomi && (
                    <div>
                      <p className="m-0 mb-2 font-['Inter',sans-serif] text-[9px] tracking-[0.2em] text-[#e8c97a] uppercase opacity-80">
                        Tsukuyomi
                      </p>
                      <p className="m-0 text-[13.5px] leading-[1.85] font-light text-[rgba(240,232,255,0.72)]">
                        {appearance.tsukuyomi}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Abilities — handles both "effect" and "effects" field names */}
            {c.abilities?.length > 0 && (
              <SectionCard title="Abilities" ornamentColor="#f9a8d4">
                <div className="flex flex-col gap-3">
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
                ornamentColor="#67e8f9"
              >
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
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
  )
}
