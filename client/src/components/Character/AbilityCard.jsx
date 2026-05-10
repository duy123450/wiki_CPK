import { getEffects } from "../../utils/characterUtils";
import { ABILITY_TYPE_COLORS } from "../../constants";

export default function AbilityCard({ ability }) {
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
