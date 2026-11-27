import { Link } from 'react-router-dom';
import { nameToSlug } from '../../utils/characterUtils';
import { ROLE_COLORS } from '../../constants/ui.constants';
import '../../styles/CharactersPage.css';

const ROLE_BADGE_BACKGROUNDS = {
  Protagonist: 'rgba(232, 201, 122, 0.1)',
  Supporting: 'rgba(103, 232, 249, 0.1)',
  Antagonist: 'rgba(249, 168, 212, 0.1)',
  Cameo: 'rgba(240, 232, 255, 0.035)',
}

function RoleBadge({ role }) {
  const badgeColor = ROLE_COLORS[role] ?? 'var(--wiki-purple)'
  return (
    <span
      className="inline-flex w-fit items-center rounded-full border border-solid border-[var(--badge-color,var(--chrs-purple))] px-[10px] py-[3px] font-['Inter',sans-serif] text-[8.5px] uppercase tracking-[0.2em] text-[var(--badge-color,var(--chrs-purple))]"
      style={{
        '--badge-color': badgeColor,
        backgroundColor:
          ROLE_BADGE_BACKGROUNDS[role] ?? 'rgba(192, 132, 252, 0.1)',
      }}
    >
      {role}
    </span>
  );
}

export default function CharacterCard({ character, index }) {
  const slug = character.slug ?? nameToSlug(character.name);
  const coverUrl = character.image?.[0]?.url;

  return (
    <Link
      to={`/wiki/characters/${slug}`}
      className="group flex animate-[cardReveal_0.55s_cubic-bezier(0.16,1,0.3,1)_both] flex-col overflow-hidden rounded-[12px] border border-solid border-[var(--chrs-border)] bg-[var(--chrs-surface)] text-inherit no-underline transition-[border-color,transform,box-shadow] duration-250 hover:-translate-y-1 hover:border-[var(--chrs-border-bright)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(192,132,252,0.12)]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[rgba(10,8,28,0.8)]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={character.name}
            className="block h-full w-full object-cover object-top transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1a1030,#0d0820)]">
            <span className="text-[40px] text-[var(--chrs-subtle)]">✦</span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[40%] bg-[linear-gradient(to_top,rgba(5,4,15,0.85),transparent)]" />
        <div className="pointer-events-none absolute left-[7px] top-[7px] z-[3] h-[14px] w-[14px] border-l-[1.5px] border-t-[1.5px] border-[rgba(232,201,122,0.4)] transition-colors duration-250 group-hover:border-[var(--chrs-gold)]" />
        <div className="pointer-events-none absolute right-[7px] top-[7px] z-[3] h-[14px] w-[14px] border-r-[1.5px] border-t-[1.5px] border-[rgba(232,201,122,0.4)] transition-colors duration-250 group-hover:border-[var(--chrs-gold)]" />
        <div className="pointer-events-none absolute bottom-[7px] left-[7px] z-[3] h-[14px] w-[14px] border-b-[1.5px] border-l-[1.5px] border-[rgba(232,201,122,0.4)] transition-colors duration-250 group-hover:border-[var(--chrs-gold)]" />
        <div className="pointer-events-none absolute bottom-[7px] right-[7px] z-[3] h-[14px] w-[14px] border-b-[1.5px] border-r-[1.5px] border-[rgba(232,201,122,0.4)] transition-colors duration-250 group-hover:border-[var(--chrs-gold)]" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-[7px] px-[18px] pb-[18px] pt-4">
        <RoleBadge role={character.role} />
        <h2 className="m-0 font-['Inter',sans-serif] text-[clamp(14px,2vw,17px)] font-semibold leading-[1.25] tracking-[0.03em] text-[var(--chrs-text)]">
          {character.name}
        </h2>
        {character.voiceActor && (
          <p className="m-0 flex items-center gap-[6px] text-[11.5px] text-[rgba(240,232,255,0.55)]">
            <span className="font-['Inter',sans-serif] text-[8px] tracking-[0.2em] text-[var(--chrs-teal)] opacity-80">CV</span>
            {character.voiceActor}
          </p>
        )}
        {character.description?.summary && (
          <p className="m-0 flex-1 overflow-hidden text-[12.5px] font-light leading-[1.7] text-[rgba(240,232,255,0.55)] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box]">
            {character.description.summary}
          </p>
        )}
        <span className="mt-1 flex items-center gap-[5px] font-['Inter',sans-serif] text-[9.5px] uppercase tracking-[0.18em] text-[var(--chrs-purple)] opacity-75 transition-[opacity,gap] duration-200 group-hover:gap-2 group-hover:opacity-100">
          View Profile
          <span className="transition-transform duration-200 group-hover:translate-x-[3px]">→</span>
        </span>
      </div>
    </Link>
  );
}
