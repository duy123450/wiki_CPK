export default function TrackTypeBadge({ type }) {
  const TYPE_COLORS = {
    'Opening': 'hsl(280, 80%, 65%)',
    'Ending': 'hsl(220, 75%, 65%)',
    'Insert Song': 'hsl(330, 70%, 62%)',
  };
  const color = TYPE_COLORS[type] ?? 'var(--st-purple)';
  return (
    <span className="st-type-badge" style={{ '--badge-color': color }}>
      {type ?? 'Track'}
    </span>
  );
}
