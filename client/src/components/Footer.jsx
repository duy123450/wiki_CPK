import { Mail, Github, ExternalLink } from "lucide-react";
import "../styles/Footer.css";

const QUICK_LINKS = [
  { label: "Characters / Nhân vật", href: "/wiki/characters" },
  { label: "Music / Âm nhạc", href: "/wiki/soundtrack" },
  { label: "Locations / Địa điểm", href: "/wiki/locations" },
  { label: "Movie Info / Phim", href: "/wiki/movie-overview" },
  { label: "Lore & World / Thế giới", href: "/wiki/lore" },
];

export default function Footer({ sidebarCollapsed }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`cpk-footer ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="footer-main">
        {/* ── Col 1: Brand ── */}
        <div className="footer-col footer-col--brand">
          <h3 className="footer-logo-title">超かぐや姫</h3>
          <p className="footer-logo-sub">Chou Kaguya Hime! Wiki</p>
          <p className="footer-desc">
            A fan-made wiki dedicated to the world of Chou Kaguya Hime —
            exploring characters, lore, music, and the story of the moon.
          </p>
          <p className="footer-desc footer-desc--vn">
            Một wiki được tạo bởi người hâm mộ, dành riêng cho thế giới của Chou
            Kaguya Hime — khám phá nhân vật, cốt truyện, âm nhạc và hành trình
            của mặt trăng.
          </p>
          <p className="footer-coded-by">Coded by nerfIori ✦</p>
        </div>

        {/* ── Col 2: Quick Links ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Quick Links / Liên kết nhanh</h4>
          <ul className="footer-links">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="footer-link">
                  <span className="footer-link-dot" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 3: Contact ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contact / Liên hệ</h4>
          <p className="footer-contact-desc">
            Found an error or want to contribute? Reach out!
          </p>
          <p className="footer-contact-desc footer-contact-desc--vn">
            Phát hiện lỗi hoặc muốn đóng góp? Hãy liên hệ với mình nhé!
          </p>
          <a
            href="mailto:nerfiori68@gmail.com"
            className="footer-email-btn"
            aria-label="Send email"
          >
            <Mail size={14} strokeWidth={1.8} />
            nerfiori68@gmail.com
          </a>
          <div className="footer-socials">
            <a
              href="https://github.com"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github size={16} strokeWidth={1.8} />
              GitHub
              <ExternalLink size={11} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <hr className="footer-divider" />

      {/* ── Disclaimer ── */}
      <div className="footer-disclaimer-wrapper">
        <div className="footer-disclaimer-header">
          <span className="footer-disclaimer-badge">
            Non-profit / Student Project · Dự án phi lợi nhuận / Sinh viên
          </span>
          <span className="footer-scroll-hint">
            Scroll to read · Cuộn để đọc ↓
          </span>
        </div>

        <div className="footer-disclaimer-scroll">
          {/* EN block */}
          <div className="footer-disclaimer-lang-block">
            <p className="footer-disclaimer-lang-label">🇬🇧 English</p>
            <p className="footer-disclaimer-text">
              This website is a{" "}
              <strong>non-commercial, non-profit fan project</strong> created
              purely for educational and fan-appreciation purposes. It is not
              affiliated with, endorsed by, or connected to any official studio,
              label, or rights holder in any way.
            </p>
            <p className="footer-disclaimer-text">
              All rights to <em>Chou Kaguya Hime!</em>, its characters, story,
              artwork, and all related materials remain the exclusive property
              of their respective rights holders, including{" "}
              <strong>FABTONE Inc.</strong> and <strong>Toy's Factory</strong>.
            </p>
            <p className="footer-disclaimer-text">
              All music featured on this site — including works by{" "}
              <strong>BUMP OF CHICKEN</strong>, <strong>ryo</strong>, and{" "}
              <strong>TAKU INOUE</strong> — is the intellectual property of
              their respective artists, composers, and record labels. No audio
              files are hosted, stored, or distributed on this site.
            </p>
            <p className="footer-disclaimer-text">
              Music is played exclusively via <strong>YouTube Embed</strong> to
              ensure that all streams and view counts are properly attributed to
              and counted for the original creators and their official channels.
              This is a deliberate choice to support artists rather than bypass
              them.
            </p>
            <p className="footer-disclaimer-text">
              If you are a rights holder and believe any content on this site
              infringes upon your intellectual property, please contact us at{" "}
              <a
                href="mailto:nerfiori68@gmail.com"
                className="footer-inline-link"
              >
                nerfiori68@gmail.com
              </a>{" "}
              and we will address the issue promptly.
            </p>
          </div>

          {/* Separator */}
          <div className="footer-lang-sep" />

          {/* VN block */}
          <div className="footer-disclaimer-lang-block">
            <p className="footer-disclaimer-lang-label">🇻🇳 Tiếng Việt</p>
            <p className="footer-disclaimer-text">
              Trang web này là một{" "}
              <strong>dự án phi thương mại, phi lợi nhuận</strong> được tạo ra
              bởi người hâm mộ, hoàn toàn vì mục đích học tập và tôn vinh tác
              phẩm. Trang web không có bất kỳ sự liên kết, xác nhận hay hợp tác
              nào với các hãng phim, nhãn đĩa hay chủ sở hữu bản quyền chính
              thức.
            </p>
            <p className="footer-disclaimer-text">
              Toàn bộ quyền sở hữu đối với <em>Chou Kaguya Hime!</em>, bao gồm
              nhân vật, cốt truyện, hình ảnh nghệ thuật và tất cả các nội dung
              liên quan, thuộc về các chủ sở hữu bản quyền tương ứng, trong đó
              có <strong>FABTONE Inc.</strong> và <strong>Toy's Factory</strong>
              .
            </p>
            <p className="footer-disclaimer-text">
              Tất cả âm nhạc được giới thiệu trên trang này — bao gồm các tác
              phẩm của <strong>BUMP OF CHICKEN</strong>, <strong>ryo</strong> và{" "}
              <strong>TAKU INOUE</strong> — là tài sản sở hữu trí tuệ của các
              nghệ sĩ, nhạc sĩ và hãng đĩa tương ứng. Không có bất kỳ file âm
              thanh nào được lưu trữ hay phân phối trên trang web này.
            </p>
            <p className="footer-disclaimer-text">
              Âm nhạc được phát <strong>hoàn toàn qua YouTube Embed</strong> để
              đảm bảo rằng tất cả lượt xem đều được tính về đúng cho các kênh
              chính thức của nghệ sĩ. Đây là lựa chọn có chủ đích nhằm ủng hộ
              các nghệ sĩ thay vì bỏ qua họ.
            </p>
            <p className="footer-disclaimer-text">
              Nếu bạn là chủ sở hữu bản quyền và cho rằng nội dung trên trang
              này vi phạm quyền sở hữu trí tuệ của bạn, vui lòng liên hệ với
              chúng tôi qua email{" "}
              <a
                href="mailto:nerfiori68@gmail.com"
                className="footer-inline-link"
              >
                nerfiori68@gmail.com
              </a>{" "}
              và chúng tôi sẽ xử lý ngay lập tức.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="footer-copyright">
          © {year} Chou Kaguya Hime! Fan Wiki — All original fan content on this
          site belongs to nerfIori. All other rights reserved by their
          respective owners. ·{" "}
          <span className="footer-copyright--vn">
            Mọi nội dung gốc thuộc về nerfIori. Các quyền còn lại thuộc về chủ
            sở hữu tương ứng.
          </span>
        </p>
      </div>
    </footer>
  );
}
