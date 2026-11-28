import { Link } from 'react-router-dom'
import StatusPageLayout from './StatusPageLayout'

export default function NotFoundPage({ sidebarCollapsed }) {
  return (
    <StatusPageLayout
      sidebarCollapsed={sidebarCollapsed}
      eyebrow="CPK Wiki · Lạc trong Tsukuyomi"
      code="404"
      title="Không tìm thấy trang."
      description="Đường dẫn bạn vừa truy cập nằm ngoài khu vực đã được ghi lại. Hãy trở về trang chủ fan wiki hoặc tiếp tục khám phá hồ sơ nhân vật."
    >
      <Link
        to="/"
        className="min-w-[180px] rounded-[999px] px-[20px] py-[14px] font-bold tracking-[0.04em] text-[#15121f] no-underline transition-[transform,box-shadow,border-color,background-color] duration-[180ms] bg-[linear-gradient(135deg,#e9c87b,#f6e3b1)] shadow-[0_12px_36px_rgba(233,200,123,0.26)] hover:-translate-y-[2px] max-[900px]:w-full"
      >
        Về Trang Chủ
      </Link>
      <Link
        to="/wiki/characters"
        className="min-w-[180px] rounded-[999px] border border-solid border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.05)] px-[20px] py-[14px] font-bold tracking-[0.04em] text-[#f6f0ff] no-underline transition-[transform,box-shadow,border-color,background-color] duration-[180ms] hover:-translate-y-[2px] max-[900px]:w-full"
      >
        Xem Nhân Vật
      </Link>
    </StatusPageLayout>
  )
}
