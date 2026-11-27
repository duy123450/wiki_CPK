import { Link } from 'react-router-dom'
import { nameToSlug } from '../../utils/slugify'

export default function RelChip({ rel }) {
  const target =
    rel.targetId && typeof rel.targetId === 'object' && rel.targetId.name
      ? rel.targetId
      : null

  const targetSlug = target ? nameToSlug(target.name) : null

  return (
    <Link
      to={targetSlug ? `/wiki/characters/${targetSlug}` : '#'}
      className="text-inherit no-underline"
    >
      <div
        className={`flex items-start gap-[10px] rounded-lg border border-solid border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] p-3 transition-[border-color] duration-200 hover:[transform:translateY(-2px)] hover:border-[rgba(103,232,249,0.25)] hover:bg-[rgba(103,232,249,0.05)] ${target ? 'cursor-pointer' : ''}`}
      >
        {target?.image?.[0]?.url ? (
          <img
            src={target.image[0].url}
            alt={target.name}
            className="h-10 w-10 shrink-0 rounded-full border border-solid border-[var(--chr-border-bright)] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-solid border-[var(--chr-border-bright)] bg-[var(--chr-surface)] text-[14px] text-[var(--chr-subtle)]">
            ✦
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-['Inter',sans-serif] text-[11px] tracking-[0.06em] font-semibold text-[var(--chr-text)]">
            {target?.name ?? 'Unknown'}
          </span>
          {rel.relationType && (
            <span className="text-[10px] tracking-[0.08em] text-[var(--chr-teal)] italic">
              {rel.relationType}
            </span>
          )}
          {rel.description && (
            <span className="text-[11px] leading-[1.5] text-[var(--chr-muted)]">
              {rel.description}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
