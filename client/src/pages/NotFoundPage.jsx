/* eslint-disable react-hooks/purity */
import { Link } from 'react-router-dom'
import '../styles/NotFoundPage.css'

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
    <div className="nf-orb-field" aria-hidden="true">
      {orbs.map((orb) => (
        <span
          key={orb.id}
          className="nf-orb"
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

export default function NotFoundPage({ sidebarCollapsed }) {
  return (
    <main
      className={`nf-root relative grid min-h-[100vh] place-items-center overflow-hidden px-[28px] pb-[120px] pt-[48px] max-[900px]:px-[18px] ${
        sidebarCollapsed
          ? 'sidebar-collapsed ml-0'
          : 'ml-[var(--sidebar-current-width,260px)]'
      } [background:radial-gradient(circle_at_20%_20%,rgba(121,213,230,0.18),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(221,143,176,0.16),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(233,200,123,0.12),transparent_34%),linear-gradient(180deg,var(--nf-bg-2),var(--nf-bg-1))] transition-[margin-left] duration-[220ms] ease max-[900px]:ml-0`}
    >
      <OrbField />
      <div className="nf-vignette" />

      <section className="relative z-[1] w-[min(760px,100%)] rounded-[32px] border border-solid border-[rgba(255,255,255,0.12)] px-[40px] py-[48px] text-center text-[var(--nf-text)] [background:linear-gradient(180deg,rgba(18,16,39,0.84),rgba(8,8,20,0.9))] [box-shadow:0_24px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px] max-[900px]:rounded-[24px] max-[900px]:px-[22px] max-[900px]:py-[36px]">
        <p className="mb-[18px] inline-flex items-center gap-[10px] text-[0.78rem] uppercase tracking-[0.22em] text-[var(--nf-muted)]">
          <span className="h-[8px] w-[8px] rounded-full [background:linear-gradient(135deg,var(--nf-cyan),var(--nf-gold))] [box-shadow:0_0_14px_rgba(121,213,230,0.75)]" />
          CPK Wiki · Lạc trong Tsukuyomi
        </p>

        <div className="relative mx-auto mb-2" aria-hidden="true">
          <span className="nf-code-shadow">404</span>
          <h1 className="nf-code">404</h1>
        </div>

        <h2 className="mb-[14px] text-[clamp(1.8rem,5vw,3rem)] leading-[1.05]">Không tìm thấy trang.</h2>
        <p className="mx-auto w-[min(560px,100%)] text-[1rem] leading-[1.8] text-[var(--nf-muted)] max-[900px]:leading-[1.65]">
          Đường dẫn bạn vừa truy cập nằm ngoài khu vực đã được ghi lại. Hãy trở
          về trang chủ fan wiki hoặc tiếp tục khám phá hồ sơ nhân vật.
        </p>

        <div className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
          <Link
            to="/"
            className="min-w-[180px] rounded-[999px] px-[20px] py-[14px] font-bold tracking-[0.04em] no-underline transition-[transform,box-shadow,border-color,background-color] duration-[180ms] [background:linear-gradient(135deg,var(--nf-gold),#f6e3b1)] text-[#15121f] [box-shadow:0_12px_36px_rgba(233,200,123,0.26)] hover:-translate-y-[2px] max-[900px]:w-full"
          >
            Về Trang Chủ
          </Link>
          <Link
            to="/wiki/characters"
            className="min-w-[180px] rounded-[999px] border border-solid border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.05)] px-[20px] py-[14px] font-bold tracking-[0.04em] text-[var(--nf-text)] no-underline transition-[transform,box-shadow,border-color,background-color] duration-[180ms] hover:-translate-y-[2px] max-[900px]:w-full"
          >
            Xem Nhân Vật
          </Link>
        </div>
      </section>
    </main>
  )
}
