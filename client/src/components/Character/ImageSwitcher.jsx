import { useState, useRef, useCallback, useEffect } from "react";
import { IMAGE_LABELS } from "../../constants";

export default function ImageSwitcher({ images }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const switchTo = useCallback(
    (idx) => {
      if (idx === active || fading) return;
      setFading(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActive(idx);
        setFading(false);
      }, 260);
    },
    [active, fading],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!images || images.length === 0) {
    return (
      <div className="chr-img-placeholder">
        <span className="chr-img-placeholder-glyph">✦</span>
      </div>
    );
  }

  const single = images.length === 1;

  return (
    <div className="chr-img-block">
      <div className="chr-img-frame">
        <div className="chr-img-corner chr-img-corner--tl" />
        <div className="chr-img-corner chr-img-corner--tr" />
        <div className="chr-img-corner chr-img-corner--bl" />
        <div className="chr-img-corner chr-img-corner--br" />
        <img
          key={active}
          src={images[active].url}
          alt={`character view ${active + 1}`}
          className={`chr-img-main ${fading ? "chr-img-fade-out" : "chr-img-fade-in"}`}
        />
        <div className="chr-img-reflection" />
      </div>

      {!single && (
        <div className="chr-img-switcher">
          {images.map((_, i) => (
            <button
              key={i}
              className={`chr-switch-btn ${i === active ? "chr-switch-btn--active" : ""}`}
              onClick={() => switchTo(i)}
              aria-label={IMAGE_LABELS[i] ?? `View ${i + 1}`}
            >
              <span className="chr-switch-label">
                {IMAGE_LABELS[i] ?? `View ${i + 1}`}
              </span>
              <span className="chr-switch-glow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
