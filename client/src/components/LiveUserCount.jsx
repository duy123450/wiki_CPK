import useLiveUserCount from '../hooks/useLiveUserCount'

export default function LiveUserCount() {
  const userCount = useLiveUserCount()

  return (
    <div className="live-user-count flex items-center justify-center gap-2">
      <span
        className="inline-block h-[10px] w-[10px] animate-[pulse_1.5s_infinite] rounded-full bg-[#4ade80]"
      />
      <span
        className="font-['Inter',sans-serif] text-[11px] font-medium tracking-[0.02em] text-[var(--text-secondary,#8b7da8)]"
      >
        Có {userCount} con dân CPK đang online
      </span>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
          }
        `}
      </style>
    </div>
  )
}
