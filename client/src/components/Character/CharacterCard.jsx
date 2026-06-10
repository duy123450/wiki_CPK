import { Link } from 'react-router-dom';
import { nameToSlug } from '../../utils/characterUtils';
import { ROLE_COLORS } from '../../constants/ui.constants';
import '../../styles/CharactersPage.css';

function RoleBadge({ role }) {
  return (
    <span
      className="chrs-role-badge"
      style={{ '--badge-color': ROLE_COLORS[role] ?? 'var(--wiki-purple)' }}
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
      className="chrs-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="chrs-card-img-wrap">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={character.name}
            className="chrs-card-img"
            loading="lazy"
          />
        ) : (
          <div className="chrs-card-img-placeholder">
            <span className="chrs-card-glyph">✦</span>
          </div>
        )}
        <div className="chrs-card-img-scrim" />
        <div className="chrs-card-corner chrs-card-corner--tl" />
        <div className="chrs-card-corner chrs-card-corner--tr" />
        <div className="chrs-card-corner chrs-card-corner--bl" />
        <div className="chrs-card-corner chrs-card-corner--br" />
      </div>

      {/* Info */}
      <div className="chrs-card-body">
        <RoleBadge role={character.role} />
        <h2 className="chrs-card-name">{character.name}</h2>
        {character.voiceActor && (
          <p className="chrs-card-voice">
            <span className="chrs-card-voice-label">CV</span>
            {character.voiceActor}
          </p>
        )}
        {character.description?.summary && (
          <p className="chrs-card-summary">{character.description.summary}</p>
        )}
        <span className="chrs-card-cta">
          View Profile <span className="chrs-card-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}
