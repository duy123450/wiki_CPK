import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/NotFoundPage.css' // Reusing the gorgeous floating orb styling

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

export default function AccessRestrictedPage({ sidebarCollapsed }) {
  return (
    <main className={`nf-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <OrbField />
      <div className="nf-vignette" />

      <section className="nf-card">
        <p className="nf-eyebrow">
          <span className="nf-eyebrow-dot" />
          CPK Wiki · Bảo Vệ Hệ Thống
        </p>

        <div className="nf-code-wrap" aria-hidden="true">
          <span className="nf-code-shadow" style={{ color: 'rgba(221, 143, 176, 0.14)' }}>403</span>
          <h1 className="nf-code" style={{ WebkitTextStroke: '1px rgba(221, 143, 176, 0.72)' }}>403</h1>
        </div>

        <h2 className="nf-title">Access Restricted</h2>
        <p className="nf-copy">
          Phát hiện môi trường gỡ lỗi (Developer Tools) đang hoạt động. Vui lòng tắt DevTools và tải lại trang để tiếp tục truy cập các nội dung giới hạn.
        </p>

        <div className="nf-actions">
          <Link to="/auth" className="nf-btn nf-btn-primary">
            Đăng Nhập
          </Link>
          <a href="/" className="nf-btn nf-btn-secondary">
            Thử Lại (Tải Lại)
          </a>
        </div>
      </section>
    </main>
  )
}
