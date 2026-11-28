import useLiveUserCount from '../hooks/useLiveUserCount'

export default function LiveUserCount() {
  const userCount = useLiveUserCount()

  return (
    <div className="live-user-count flex items-center justify-center gap-2">
      <span
        className="inline-block h-[10px] w-[10px] animate-live-user-pulse rounded-full bg-[#4ade80]"
      />
      <span
        className="font-['Inter',sans-serif] text-[11px] font-medium tracking-[0.02em] text-[var(--text-secondary,#8b7da8)]"
      >
        Có {userCount} con dân CPK đang online
      </span>
    </div>
  )
}
