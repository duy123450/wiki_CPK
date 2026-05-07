/* eslint-disable react-hooks/purity */
import { Link } from "react-router-dom";
import "../styles/NotFoundPage.css";

function OrbField() {
  const orbs = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${Math.random() * 180 + 40}px`,
    delay: `${Math.random() * 10}s`,
    duration: `${Math.random() * 8 + 8}s`,
  }));

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
  );
}

export default function NotFoundPage({ sidebarCollapsed }) {
  return (
    <main className={`nf-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <OrbField />
      <div className="nf-vignette" />

      <section className="nf-card">
        <p className="nf-eyebrow">
          <span className="nf-eyebrow-dot" />
          CPK Wiki · Lạc trong Tsukuyomi
        </p>

        <div className="nf-code-wrap" aria-hidden="true">
          <span className="nf-code-shadow">404</span>
          <h1 className="nf-code">404</h1>
        </div>

        <h2 className="nf-title">Không tìm thấy trang.</h2>
        <p className="nf-copy">
          Đường dẫn bạn vừa truy cập nằm ngoài khu vực đã được ghi lại. Hãy trở
          về trang chủ fan wiki hoặc tiếp tục khám phá hồ sơ nhân vật.
        </p>

        <div className="nf-actions">
          <Link to="/" className="nf-btn nf-btn-primary">
            Về Trang Chủ
          </Link>
          <Link to="/wiki/characters" className="nf-btn nf-btn-secondary">
            Xem Nhân Vật
          </Link>
        </div>
      </section>
    </main>
  );
}
