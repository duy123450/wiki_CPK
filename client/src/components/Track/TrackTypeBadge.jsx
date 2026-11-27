export default function TrackTypeBadge({ type }) {
  const TYPE_COLORS = {
    Opening: {
      color: 'hsl(280, 80%, 65%)',
      backgroundColor: 'hsla(280, 80%, 65%, 0.15)',
      borderColor: 'hsla(280, 80%, 65%, 0.4)',
    },
    Ending: {
      color: 'hsl(220, 75%, 65%)',
      backgroundColor: 'hsla(220, 75%, 65%, 0.15)',
      borderColor: 'hsla(220, 75%, 65%, 0.4)',
    },
    'Insert Song': {
      color: 'hsl(330, 70%, 62%)',
      backgroundColor: 'hsla(330, 70%, 62%, 0.15)',
      borderColor: 'hsla(330, 70%, 62%, 0.4)',
    },
  };
  const badgeStyle = TYPE_COLORS[type] ?? {
    color: 'var(--st-purple)',
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
  };
  return (
    <span
      className="inline-block w-fit rounded-[99px] border border-solid px-[0.6rem] py-[0.2rem] text-[0.65rem] font-bold uppercase tracking-[0.08em]"
      style={badgeStyle}
    >
      {type ?? 'Track'}
    </span>
  );
}
