import { useEffect, useRef, useState } from "react";
import "../styles/DragonCursor.css";

const SEG_DIST = 55;
const SPARKLES = ["✦", "⋆", "✧", "·", "✩", "꩜"];
const DRAGON_ENABLED_KEY = "cpk-dragon-cursor-enabled";

function Sparkle({ x, y, char, color }) {
  return (
    <div className="dragon-sparkle" style={{ left: x, top: y, color }}>
      {char}
    </div>
  );
}

function Seg({ pos, flipped, src, alt, shadow, zIndex }) {
  return (
    <div
      className="dragon-seg"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scaleX(${flipped ? 1 : -1})`,
        zIndex,
        filter: `drop-shadow(${shadow})`,
      }}
    >
      <img src={src} alt={alt} />
    </div>
  );
}

export default function DragonCursor() {
  const animRef = useRef(null);
  const targetRef = useRef({ x: -300, y: -300 });

  // Read initial state from localStorage (defaults to true if not set)
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(DRAGON_ENABLED_KEY);
    return stored === null ? true : stored === "true";
  });

  const segsRef = useRef([
    { x: -300, y: -300 },
    { x: -355, y: -300 },
    { x: -410, y: -300 },
    { x: -465, y: -300 },
    { x: -520, y: -300 },
    { x: -575, y: -300 },
    { x: -630, y: -300 },
    { x: -685, y: -300 },
  ]);

  const [renderSegs, setRenderSegs] = useState(
    segsRef.current.map((p) => ({ ...p })),
  );
  const [flips, setFlips] = useState(Array(8).fill(false));
  const flipsRef = useRef(Array(8).fill(false));
  const [sparkles, setSparkles] = useState([]);
  const sparkTimer = useRef(0);

  // Persist enabled state to localStorage
  useEffect(() => {
    window.localStorage.setItem(DRAGON_ENABLED_KEY, isEnabled.toString());
    // Dispatch custom event so Sidebar and other components stay in sync
    window.dispatchEvent(
      new CustomEvent("dragon-cursor-toggle", {
        detail: { enabled: isEnabled },
      }),
    );
  }, [isEnabled]);

  // Export toggle function globally so Sidebar can call it
  useEffect(() => {
    window.toggleDragonCursor = () => {
      setIsEnabled((prev) => !prev);
    };
    return () => {
      delete window.toggleDragonCursor;
    };
  }, []);

  useEffect(() => {
    // Mouse support
    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    // Touch support — theo dõi ngón tay đầu tiên
    const onTouchMove = (e) => {
      // preventDefault để tránh scroll khi dragon đang active
      // Không gọi preventDefault ở đây để không chặn scroll trang
      const touch = e.touches[0];
      if (touch) {
        targetRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch) {
        targetRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  useEffect(() => {
    const LERP_HEAD = 0.22;

    const animate = () => {
      const segs = segsRef.current;
      const t = targetRef.current;

      segs[0].x += (t.x - segs[0].x) * LERP_HEAD;
      segs[0].y += (t.y - segs[0].y) * LERP_HEAD;

      for (let i = 1; i < segs.length; i++) {
        const ahead = segs[i - 1];
        const dx = ahead.x - segs[i].x;
        const dy = ahead.y - segs[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist > SEG_DIST) {
          const pull = (dist - SEG_DIST) / dist;
          segs[i].x += dx * pull * 0.35;
          segs[i].y += dy * pull * 0.35;
        }
      }

      const newFlips = segs.map((p, i) => {
        const targetX = i === 0 ? t.x : segs[i - 1].x;
        const dx = targetX - p.x;
        if (Math.abs(dx) < 1) return flipsRef.current[i];
        return dx < 0;
      });
      flipsRef.current = newFlips;

      setRenderSegs(segs.map((p) => ({ x: p.x, y: p.y })));
      setFlips(newFlips.map((f, i) => (i === 2 || i === 4 ? !f : f)));

      sparkTimer.current++;
      if (sparkTimer.current % 7 === 0) {
        const colors = [
          `hsl(${Math.random() * 60 + 200},100%,80%)`,
          `hsl(${Math.random() * 60 + 260},100%,80%)`,
          `hsl(${Math.random() * 40 + 20},100%,75%)`,
          `hsl(${Math.random() * 40},100%,80%)`,
          `hsl(${Math.random() * 60 + 300},100%,80%)`,
          `hsl(${Math.random() * 60 + 10},100%,80%)`,
          `hsl(${Math.random() * 60 + 180},100%,80%)`,
          `hsl(${Math.random() * 60 + 30},100%,80%)`,
        ];
        const newSparks = segs.map((p, i) => ({
          id: Date.now() + Math.random() + i,
          x: p.x + (Math.random() - 0.5) * 18,
          y: p.y + (Math.random() - 0.5) * 18,
          char: SPARKLES[Math.floor(Math.random() * SPARKLES.length)],
          color: colors[i],
        }));
        setSparkles((s) => [...s.slice(-32), ...newSparks]);
        newSparks.forEach((sp) =>
          setTimeout(
            () => setSparkles((s) => s.filter((x) => x.id !== sp.id)),
            800,
          ),
        );
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{ display: isEnabled ? "block" : "none" }}>
      {sparkles.map((sp) => (
        <Sparkle
          key={sp.id}
          x={sp.x}
          y={sp.y}
          char={sp.char}
          color={sp.color}
        />
      ))}

      <Seg
        pos={renderSegs[7]}
        flipped={flips[7]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/ZoroChibi_mmr28n.png"
        alt="Zoro"
        shadow="0 4px 16px rgba(100,200,150,0.6)"
        zIndex={9992}
      />
      <Seg
        pos={renderSegs[6]}
        flipped={flips[6]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/MamiChibi_ul1hrw.png"
        alt="Mami"
        shadow="0 4px 16px rgba(255,180,120,0.6)"
        zIndex={9993}
      />
      <Seg
        pos={renderSegs[5]}
        flipped={flips[5]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629482/NoiMikadoChibi_cqqhdn.png"
        alt="NoiMikado"
        shadow="0 4px 16px rgba(220,100,200,0.6)"
        zIndex={9994}
      />
      <Seg
        pos={renderSegs[4]}
        flipped={flips[4]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/MoonPeople_ipnssa.png"
        alt="MoonPeople"
        shadow="0 4px 16px rgba(100,150,255,0.6)"
        zIndex={9995}
      />
      <Seg
        pos={renderSegs[3]}
        flipped={flips[3]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/KaguyaChibi_fspqxf.png"
        alt="Kaguya"
        shadow="0 4px 16px rgba(255,150,180,0.6)"
        zIndex={9996}
      />
      <Seg
        pos={renderSegs[2]}
        flipped={flips[2]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629482/RokaChibi_qefo1f.png"
        alt="Roka"
        shadow="0 4px 16px rgba(150,100,80,0.5)"
        zIndex={9997}
      />
      <Seg
        pos={renderSegs[1]}
        flipped={flips[1]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/IrohaChibi_qwmv8n.png"
        alt="Iroha"
        shadow="0 4px 16px rgba(180,100,255,0.5)"
        zIndex={9998}
      />
      <Seg
        pos={renderSegs[0]}
        flipped={flips[0]}
        src="https://res.cloudinary.com/dvlaoxjzi/image/upload/q_auto/f_auto/v1775629481/YachiyoChibi_opfpce.png"
        alt="Yaccho"
        shadow="0 4px 16px rgba(100,160,255,0.5)"
        zIndex={9999}
      />
    </div>
  );
}
