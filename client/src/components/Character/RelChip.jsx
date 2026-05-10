import { Link } from "react-router-dom";
import { nameToSlug } from "../../utils/slugify";

export default function RelChip({ rel }) {
  const target =
    rel.targetId && typeof rel.targetId === "object" && rel.targetId.name
      ? rel.targetId
      : null;

  const targetSlug = target ? nameToSlug(target.name) : null;

  return (
    <Link
      to={targetSlug ? `/wiki/characters/${targetSlug}` : "#"}
      style={{ textDecoration: "none", color: "inherit" }}
      className={target ? "chr-rel-chip-link" : ""}
    >
      <div className="chr-rel-chip">
        {target?.image?.[0]?.url ? (
          <img
            src={target.image[0].url}
            alt={target.name}
            className="chr-rel-avatar"
          />
        ) : (
          <div className="chr-rel-avatar chr-rel-avatar--placeholder">✦</div>
        )}

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
    </Link>
  );
}
