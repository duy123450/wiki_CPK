/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        profileAvatarPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        profileSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        profileToastIn: {
          from: {
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scrollToTopPulse: {
          '0%, 100%': {
            opacity: '0.18',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.05',
            transform: 'scale(1.08)',
          },
        },
        cookieSlideIn: {
          from: {
            opacity: '0',
            transform: 'translateX(-50%) translateY(24px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(-50%) translateY(0)',
          },
        },
        cookieSlideOut: {
          from: {
            opacity: '1',
            transform: 'translateX(-50%) translateY(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateX(-50%) translateY(16px)',
          },
        },
        footerHintPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        playlistFadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        playlistSlideIn: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        playlistSlideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        heroStarPulse: {
          '0%, 100%': {
            opacity: '0.15',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.9',
            transform: 'scale(1.6)',
          },
        },
        heroReveal: {
          from: {
            opacity: '0',
            transform: 'translateY(28px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        heroDotPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        heroScrollDrop: {
          '0%': {
            transform: 'scaleY(0)',
            transformOrigin: 'top',
            opacity: '1',
          },
          '50%': {
            transform: 'scaleY(1)',
            transformOrigin: 'top',
            opacity: '1',
          },
          '100%': {
            transform: 'scaleY(1)',
            transformOrigin: 'bottom',
            opacity: '0',
          },
        },
        heroShimmerSlide: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        legalParticleDrift: {
          '0%, 100%': {
            opacity: '0.15',
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            opacity: '0.4',
            transform: 'translateY(-40px) scale(1.2)',
          },
        },
      },
      animation: {
        'profile-avatar-pulse': 'profileAvatarPulse 1.2s ease-in-out infinite',
        'profile-spin': 'profileSpin 0.8s linear infinite',
        'profile-toast-in': 'profileToastIn 0.3s ease',
        'scroll-to-top-pulse': 'scrollToTopPulse 2.8s ease-in-out infinite',
        'cookie-slide-in': 'cookieSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        'cookie-slide-out': 'cookieSlideOut 0.38s cubic-bezier(0.4,0,0.2,1) both',
        'footer-hint-pulse': 'footerHintPulse 3s ease-in-out infinite',
        'playlist-fade-in': 'playlistFadeIn 0.25s ease-out',
        'playlist-tooltip-in': 'playlistFadeIn 0.15s ease-out',
        'playlist-karaoke-in': 'playlistFadeIn 0.2s ease-out',
        'playlist-slide-in': 'playlistSlideIn 0.35s ease-out',
        'playlist-slide-up': 'playlistSlideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
        'hero-star-pulse': 'heroStarPulse 4s ease-in-out infinite',
        'hero-reveal': 'heroReveal 1.6s cubic-bezier(0.16,1,0.3,1) both',
        'hero-dot-pulse': 'heroDotPulse 2s ease-in-out infinite',
        'hero-scroll-drop': 'heroScrollDrop 2s ease-in-out infinite',
        'hero-shimmer-slide': 'heroShimmerSlide 1.5s infinite',
        'legal-particle-drift': 'legalParticleDrift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
