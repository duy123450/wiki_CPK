import { Mail, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

import { QUICK_LINKS } from '../constants/ui.constants'

export default function Footer({ sidebarCollapsed }) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={`cpk-footer relative box-border w-[calc(100%-var(--sidebar-current-width))] max-w-[100vw] overflow-hidden border-t border-solid border-t-[rgba(148,163,184,0.1)] bg-[#070b14] pt-[60px] font-['Source_Sans_3','Segoe_UI',sans-serif] text-[#94a3b8] [margin-left:var(--sidebar-current-width)] [transition:width_0.35s_cubic-bezier(0.4,0,0.2,1),margin-left_0.35s_cubic-bezier(0.4,0,0.2,1)] max-[768px]:ml-0 max-[768px]:w-full max-[600px]:pt-10 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <div className="footer-main mx-auto grid max-w-[1100px] grid-cols-[1.6fr_1fr_1.2fr] gap-12 px-8 pb-12 max-[900px]:grid-cols-2 max-[900px]:gap-9 max-[600px]:grid-cols-1 max-[600px]:gap-8 max-[600px]:px-5 max-[600px]:pb-9">
        {/* ── Col 1: Brand ── */}
        <div className="footer-col footer-col--brand flex flex-col gap-[10px] max-[900px]:col-span-full max-[600px]:col-span-auto">
          <h3 className="footer-logo-title m-0 font-['Inter',sans-serif] text-xl font-bold leading-[1.2] tracking-[0.02em] text-[#e2d9f3] max-[600px]:text-[17px]">超かぐや姫</h3>
          <p className="footer-logo-sub m-0 font-['Inter',sans-serif] text-[10px] uppercase tracking-[0.25em] text-[#c084fc] opacity-80">Chou Kaguya Hime! Wiki</p>
          <p className="footer-desc mt-1 mb-0 text-[13px] leading-[1.75] text-[#64748b]">
            A fan-made wiki dedicated to the world of Chou Kaguya Hime —
            exploring characters, lore, music, and the story of the moon.
          </p>
          <p className="footer-desc footer-desc--vn mb-0 mt-0 border-l-2 border-solid border-l-[rgba(192,132,252,0.2)] pl-[10px] text-xs leading-[1.75] text-[#4a5568]">
            Một wiki được tạo bởi người hâm mộ, dành riêng cho thế giới của Chou
            Kaguya Hime — khám phá nhân vật, cốt truyện, âm nhạc và hành trình
            của mặt trăng.
          </p>
          <p className="footer-coded-by mt-[6px] mb-0 text-[11px] italic tracking-[0.12em] text-[#4a5568]">Coded by nerfIori ✦</p>
        </div>

        {/* ── Col 2: Quick Links ── */}
        <div className="footer-col flex flex-col gap-[10px]">
          <h4 className="footer-col-title m-0 mb-[6px] font-['Inter',sans-serif] text-[9.5px] font-semibold uppercase leading-[1.5] tracking-[0.25em] text-[#c084fc]">Quick Links / Liên kết nhanh</h4>
          <ul className="footer-links m-0 flex list-none flex-col gap-1 p-0">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="footer-link group flex items-center gap-2 py-[3px] text-[12.5px] text-[#64748b] no-underline transition-colors duration-200 hover:text-[#67e8f9]">
                  <span className="footer-link-dot h-[3px] w-[3px] shrink-0 rounded-full bg-current text-current opacity-50 transition-opacity duration-200 [.group:hover_&]:opacity-100" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 3: Contact ── */}
        <div className="footer-col flex flex-col gap-[10px]">
          <h4 className="footer-col-title m-0 mb-[6px] font-['Inter',sans-serif] text-[9.5px] font-semibold uppercase leading-[1.5] tracking-[0.25em] text-[#c084fc]">Contact / Liên hệ</h4>
          <p className="footer-contact-desc m-0 text-[13px] leading-[1.6] text-[#64748b]">
            Found an error or want to contribute? Reach out!
          </p>
          <p className="footer-contact-desc footer-contact-desc--vn m-0 border-l-2 border-solid border-l-[rgba(192,132,252,0.2)] pl-[10px] text-xs leading-[1.6] text-[#4a5568]">
            Phát hiện lỗi hoặc muốn đóng góp? Hãy liên hệ với mình nhé!
          </p>
          <a
            href="mailto:168daisuki8000@gmail.com"
            className="footer-email-btn mt-1 inline-flex w-fit items-center gap-[7px] rounded-md border border-solid border-[rgba(148,163,184,0.15)] px-[14px] py-2 text-[12.5px] text-[#94a3b8] no-underline [transition:color_0.2s,border-color_0.2s,background_0.2s] hover:border-[rgba(103,232,249,0.3)] hover:bg-[rgba(103,232,249,0.05)] hover:text-[#67e8f9]"
            aria-label="Send email"
          >
            <Mail size={14} strokeWidth={1.8} />
            168daisuki8000@gmail.com
          </a>
          <div className="footer-socials mt-1 flex flex-col gap-[6px]">
            <a
              href="https://github.com/duy123450/wiki_CPK"
              className="footer-social-link inline-flex w-fit items-center gap-[6px] text-[13px] text-[#64748b] no-underline transition-colors duration-200 hover:text-[#c084fc]"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
              <ExternalLink size={11} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <hr className="footer-divider m-0 h-px border-0 border-t border-solid border-t-[rgba(148,163,184,0.08)] bg-transparent" />

      {/* ── Disclaimer ── */}
      <div className="footer-disclaimer-wrapper mx-auto flex max-w-[1100px] flex-col gap-4 px-8 py-[28px_36px] max-[600px]:px-5 max-[600px]:py-[24px_30px]">
        <div className="footer-disclaimer-header flex flex-wrap items-center justify-between gap-[10px] max-[600px]:flex-col max-[600px]:items-start">
          <span className="footer-disclaimer-badge inline-flex max-w-full items-center overflow-hidden whitespace-nowrap rounded-full border border-solid border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.06)] px-[14px] py-1 font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.15em] text-[#fbbf24] text-ellipsis max-[600px]:px-[10px] max-[600px]:text-[8px]">
            Non-profit / Student Project · Dự án phi lợi nhuận / Sinh viên
          </span>
          <span className="footer-scroll-hint shrink-0 animate-[hintPulse_3s_ease-in-out_infinite] text-[10.5px] italic tracking-[0.08em] text-[#475569]">
            Scroll to read · Cuộn để đọc ↓
          </span>
        </div>

        <div className="footer-disclaimer-scroll box-border flex h-[220px] max-h-[220px] w-full flex-col overflow-x-hidden overflow-y-scroll rounded-[10px] border border-solid border-[rgba(148,163,184,0.1)] bg-[rgba(255,255,255,0.02)] px-[22px] py-5 [scrollbar-color:rgba(192,132,252,0.3)_rgba(255,255,255,0.03)] [scrollbar-width:thin] max-[600px]:h-[200px] max-[600px]:max-h-[200px] max-[600px]:px-[14px] max-[600px]:py-[14px]">
          {/* EN block */}
          <div className="footer-disclaimer-lang-block flex flex-col gap-[10px] px-0 py-1">
            <p className="footer-disclaimer-lang-label m-0 font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.25em] text-[#c084fc] opacity-80">🇬🇧 English</p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              This website is a{' '}
              <strong>non-commercial, non-profit fan project</strong> created
              purely for educational and fan-appreciation purposes. It is not
              affiliated with, endorsed by, or connected to any official studio,
              label, or rights holder in any way.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              All rights to <em>Chou Kaguya Hime!</em>, its characters, story,
              artwork, and all related materials remain the exclusive property
              of their respective rights holders, including{' '}
              <strong>FABTONE Inc.</strong>, <strong>Toy's Factory</strong>, and others.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              All music featured on this site — including works by{' '}
              <strong>BUMP OF CHICKEN</strong>, <strong>ryo</strong>, and{' '}
              <strong>TAKU INOUE</strong> — is the intellectual property of
              their respective artists, composers, and record labels. No audio
              files are hosted, stored, or distributed on this site.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Music is played exclusively via <strong>YouTube Embed</strong> to
              ensure that all streams and view counts are properly attributed to
              and counted for the original creators and their official channels.
              This is a deliberate choice to support artists rather than bypass
              them.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              If you are a rights holder and believe any content on this site
              infringes upon your intellectual property, please contact us at{' '}
              <a
                href="mailto:168daisuki8000@gmail.com"
                className="footer-inline-link text-[#67e8f9] underline underline-offset-[3px] transition-colors duration-200 hover:text-[#c084fc]"
              >
                168daisuki8000@gmail.com
              </a>{' '}
              and we will address the issue promptly.
            </p>
          </div>

          {/* Separator */}
          <div className="footer-lang-sep h-px shrink-0 bg-[rgba(148,163,184,0.08)] my-[18px] mx-0" />

          {/* VN block */}
          <div className="footer-disclaimer-lang-block flex flex-col gap-[10px] px-0 py-1">
            <p className="footer-disclaimer-lang-label m-0 font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.25em] text-[#c084fc] opacity-80">🇻🇳 Tiếng Việt</p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Trang web này là một{' '}
              <strong>dự án phi thương mại, phi lợi nhuận</strong> được tạo ra
              bởi người hâm mộ, hoàn toàn vì mục đích học tập và tôn vinh tác
              phẩm. Trang web không có bất kỳ sự liên kết, xác nhận hay hợp tác
              nào với các hãng phim, nhãn đĩa hay chủ sở hữu bản quyền chính
              thức.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Toàn bộ quyền sở hữu đối với <em>Chou Kaguya Hime!</em>, bao gồm
              nhân vật, cốt truyện, hình ảnh nghệ thuật và tất cả các nội dung
              liên quan, thuộc về các chủ sở hữu bản quyền tương ứng, trong đó
              có <strong>FABTONE Inc.</strong>, <strong>Toy's Factory</strong>, và nhiều bên khác.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Tất cả âm nhạc được giới thiệu trên trang này — bao gồm các tác
              phẩm của <strong>BUMP OF CHICKEN</strong>, <strong>ryo</strong> và{' '}
              <strong>TAKU INOUE</strong> — là tài sản sở hữu trí tuệ của các
              nghệ sĩ, nhạc sĩ và hãng đĩa tương ứng. Không có bất kỳ file âm
              thanh nào được lưu trữ hay phân phối trên trang web này.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Âm nhạc được phát <strong>hoàn toàn qua YouTube Embed</strong> để
              đảm bảo rằng tất cả lượt xem đều được tính về đúng cho các kênh
              chính thức của nghệ sĩ. Đây là lựa chọn có chủ đích nhằm ủng hộ
              các nghệ sĩ thay vì bỏ qua họ.
            </p>
            <p className="footer-disclaimer-text m-0 text-xs leading-[1.85] text-[#475569] [&_strong]:font-semibold [&_strong]:text-[#64748b] [&_em]:italic [&_em]:text-[#556070] max-[600px]:text-[11px]">
              Nếu bạn là chủ sở hữu bản quyền và cho rằng nội dung trên trang
              này vi phạm quyền sở hữu trí tuệ của bạn, vui lòng liên hệ với
              chúng tôi qua email{' '}
              <a
                href="mailto:168daisuki8000@gmail.com"
                className="footer-inline-link text-[#67e8f9] underline underline-offset-[3px] transition-colors duration-200 hover:text-[#c084fc]"
              >
                168daisuki8000@gmail.com
              </a>{' '}
              và chúng tôi sẽ xử lý ngay lập tức.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="footer-copyright mt-1 mb-0 text-[11px] leading-[1.7] tracking-[0.02em] text-[#334155]">
          © {year} Chou Kaguya Hime! Fan Wiki — All original fan content on this
          site belongs to nerfIori. All other rights reserved by their
          respective owners. ·{' '}
          <span className="footer-copyright--vn italic text-[#263244]">
            Mọi nội dung gốc thuộc về nerfIori. Các quyền còn lại thuộc về chủ
            sở hữu tương ứng.
          </span>
        </p>

        {/* Legal Pages Links */}
        <div className="footer-legal-links mt-[14px] flex items-center gap-3 font-['Inter',sans-serif] text-[10.5px]">
          <Link to="/terms" className="footer-legal-link uppercase tracking-[0.04em] text-[rgba(240,232,255,0.4)] no-underline [text-shadow:none] transition-[color_0.2s,text-shadow_0.2s] hover:text-[#c084fc] hover:[text-shadow:0_0_8px_rgba(192,132,252,0.35)]">
            Terms of Use / Điều khoản sử dụng
          </Link>
          <span className="footer-legal-divider select-none text-[rgba(240,232,255,0.12)]">•</span>
          <Link to="/privacy" className="footer-legal-link uppercase tracking-[0.04em] text-[rgba(240,232,255,0.4)] no-underline [text-shadow:none] transition-[color_0.2s,text-shadow_0.2s] hover:text-[#c084fc] hover:[text-shadow:0_0_8px_rgba(192,132,252,0.35)]">
            Privacy Policy / Chính sách bảo mật
          </Link>
        </div>
      </div>
    </footer>
  )
}
