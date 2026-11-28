import { getEffects } from '../../utils/characterUtils'
import { ABILITY_TYPE_COLORS } from '../../constants/ui.constants'

export default function AbilityCard({ ability }) {
  const effects = getEffects(ability)
  return (
    <div className="rounded-lg border border-solid border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] px-4 py-[14px] transition-[border-color] duration-200 hover:border-[rgba(192,132,252,0.25)]">
      <div className="mb-2 flex items-center justify-between gap-[10px]">
        <span className="font-['Inter',sans-serif] text-[11.5px] tracking-[0.08em] font-semibold text-[#f0e8ff]">
          {ability.skillName}
        </span>
        {ability.type && (
          <span
            className="whitespace-nowrap rounded-[4px] border border-solid border-current px-2 py-[2px] font-['Inter',sans-serif] text-[8.5px] tracking-[0.18em] text-[var(--atype-color,#c084fc)] uppercase opacity-90"
            style={{
              '--atype-color':
                ABILITY_TYPE_COLORS[ability.type] ?? 'rgba(240,232,255,0.35)',
            }}
          >
            {ability.type}
          </span>
        )}
      </div>
      {effects.length > 0 && (
        <ul className="m-0 flex flex-col gap-1 py-0 pr-0 pl-[14px]">
          {effects.map((e, i) => (
            <li
              key={i}
              className="text-[12.5px] leading-[1.6] font-light text-[rgba(240,232,255,0.65)]"
            >
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
