import { useEffect, useRef, useState } from "react";

// px distance between each segment in the chain
const SEG_DIST = 55;

const SPARKLES = ["✦", "⋆", "✧", "·", "✩", "꩜"];

function Sparkle({ x, y, char, color }) {
  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 9996,
        fontSize: 14,
        color,
        animation: "dragonSparkle 0.8s ease-out forwards",
        transform: "translate(-50%, -50%)",
        userSelect: "none",
      }}
    >
      {char}
    </div>
  );
}

function Seg({ pos, flipped, src, alt, shadow, zIndex }) {
  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scaleX(${flipped ? 1 : -1})`,
        pointerEvents: "none",
        zIndex,
        width: 80,
        height: 80,
        willChange: "transform, left, top",
        filter: `drop-shadow(${shadow})`,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default function DragonCursor() {
  const animRef = useRef(null);
  const targetRef = useRef({ x: -300, y: -300 });

  // Order: Yaccho(0) => Iroha(1) => Roka(2) => Kaguya(3) => MoonPeople(4) => NoiMikado(5) => Mami(6) => Zoro(7)
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
    // eslint-disable-next-line react-hooks/refs
    segsRef.current.map((p) => ({ ...p })),
  );
  const [flips, setFlips] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const flipsRef = useRef([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  const [sparkles, setSparkles] = useState([]);
  const sparkTimer = useRef(0);

  useEffect(() => {
    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const LERP_HEAD = 0.22;

    const animate = () => {
      const segs = segsRef.current;
      const t = targetRef.current;

      // Head lerps to mouse
      segs[0].x += (t.x - segs[0].x) * LERP_HEAD;
      segs[0].y += (t.y - segs[0].y) * LERP_HEAD;

      // Each follower: chain physics toward the one ahead
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

      // Flips: face toward target
      const newFlips = segs.map((p, i) => {
        const targetX = i === 0 ? t.x : segs[i - 1].x;
        const dx = targetX - p.x;
        if (Math.abs(dx) < 1) return flipsRef.current[i];
        return dx < 0;
      });
      flipsRef.current = newFlips;

      setRenderSegs(segs.map((p) => ({ x: p.x, y: p.y })));
      // Reverse ROKA's face direction (index 2) and MOONPEOPLE's face direction (index 4)
      setFlips(newFlips.map((f, i) => (i === 2 || i === 4 ? !f : f)));

      // Sparkles
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
    <>
      <style>{`
        @keyframes dragonSparkle {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-130%) scale(0.3); }
        }
      `}</style>

      {sparkles.map((sp) => (
        <Sparkle
          key={sp.id}
          x={sp.x}
          y={sp.y}
          char={sp.char}
          color={sp.color}
        />
      ))}

      {/* render tail first so head draws on top */}
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
    </>
  );
}
