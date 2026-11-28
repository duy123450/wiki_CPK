/* eslint-disable react-hooks/purity */
function OrbField() {
  const orbs = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${Math.random() * 180 + 40}px`,
    delay: `${Math.random() * 10}s`,
    duration: `${Math.random() * 8 + 8}s`,
  }))

  return (
    <div
      className="nf-orb-field pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {orbs.map((orb) => (
        <span
          key={orb.id}
          className="nf-orb absolute rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_70%)] opacity-[0.85] blur-[8px] motion-safe:animate-not-found-float motion-reduce:animate-none"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}
    </div>
  )
}

export default function StatusPageLayout({
  sidebarCollapsed,
  eyebrow,
  code,
  codeTone,
  title,
  description,
  children,
}) {
  const restricted = codeTone === 'restricted'
  const shadowColor = restricted
    ? 'text-[rgba(221,143,176,0.14)]'
    : 'text-[rgba(233,200,123,0.14)]'
  const strokeColor = restricted
    ? '[-webkit-text-stroke:1px_rgba(221,143,176,0.72)]'
    : '[-webkit-text-stroke:1px_rgba(255,255,255,0.72)]'

  return (
    <main
      className={`nf-root relative grid min-h-screen place-items-center overflow-hidden px-[28px] pb-[120px] pt-[48px] [background:radial-gradient(circle_at_20%_20%,rgba(121,213,230,0.18),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(221,143,176,0.16),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(233,200,123,0.12),transparent_34%),linear-gradient(180deg,#14132a,#090814)] transition-[margin-left] duration-[220ms] ease max-[900px]:ml-0 max-[900px]:px-[18px] ${
        sidebarCollapsed ? 'sidebar-collapsed ml-0' : 'ml-[var(--sidebar-current-width,260px)]'
      }`}
    >
      <OrbField />
      <div
        className="nf-vignette pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.34)_100%)]"
        aria-hidden="true"
      />

      <section className="relative z-[1] w-[min(760px,100%)] rounded-[32px] border border-solid border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(18,16,39,0.84),rgba(8,8,20,0.9))] px-[40px] py-[48px] text-center text-[#f6f0ff] shadow-[0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px] max-[900px]:rounded-[24px] max-[900px]:px-[22px] max-[900px]:py-[36px]">
        <p className="mb-[18px] inline-flex items-center gap-[10px] text-[0.78rem] uppercase tracking-[0.22em] text-[rgba(246,240,255,0.72)]">
          <span className="h-[8px] w-[8px] rounded-full bg-[linear-gradient(135deg,#79d5e6,#e9c87b)] shadow-[0_0_14px_rgba(121,213,230,0.75)]" />
          {eyebrow}
        </p>

        <div className="relative mx-auto mb-2" aria-hidden="true">
          <span
            className={`nf-code-shadow absolute inset-0 translate-x-[10px] translate-y-[10px] text-[clamp(5rem,18vw,10rem)] font-extrabold leading-[0.9] tracking-[0.08em] ${shadowColor}`}
          >
            {code}
          </span>
          <h1
            className={`nf-code relative z-[1] m-0 text-[clamp(5rem,18vw,10rem)] font-extrabold leading-[0.9] tracking-[0.08em] text-transparent ${strokeColor} [text-shadow:0_0_30px_rgba(121,213,230,0.16)]`}
          >
            {code}
          </h1>
        </div>

        <h2 className="mb-[14px] text-[clamp(1.8rem,5vw,3rem)] leading-[1.05]">
          {title}
        </h2>
        <p className="mx-auto w-[min(560px,100%)] text-[1rem] leading-[1.8] text-[rgba(246,240,255,0.72)] max-[900px]:leading-[1.65]">
          {description}
        </p>

        <div className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
          {children}
        </div>
      </section>
    </main>
  )
}
