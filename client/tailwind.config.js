/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        characters: {
          bg: '#05040f',
          surface: 'rgba(255, 255, 255, 0.03)',
          'surface-hover': 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(180, 140, 255, 0.12)',
          'border-bright': 'rgba(192, 132, 252, 0.3)',
          purple: '#c084fc',
          teal: '#67e8f9',
          gold: '#e8c97a',
          rose: '#f9a8d4',
          muted: 'rgba(240, 232, 255, 0.35)',
          text: '#f0e8ff',
          subtle: 'rgba(240, 232, 255, 0.18)',
        },
      },
      keyframes: {
        charactersParticleDrift: {
          '0%, 100%': {
            opacity: '0.25',
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'translateY(-32px) scale(1.3)',
          },
        },
        charactersReveal: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        charactersDotPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        charactersCardReveal: {
          from: {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        charactersSkeletonSlide: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
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
        movieParticleDrift: {
          '0%, 100%': {
            opacity: '0.25',
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'translateY(-32px) scale(1.4)',
          },
        },
        movieHeroFade: {
          from: {
            opacity: '0',
            transform: 'translateY(32px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        movieDotPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        movieShimmerSlide: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        characterParticleDrift: {
          '0%, 100%': {
            opacity: '0.25',
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'translateY(-32px) scale(1.3)',
          },
        },
        characterReveal: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        characterImageFadeIn: {
          from: {
            opacity: '0',
            transform: 'scale(1.025)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        characterImageFadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        characterSwitchGlowSweep: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        characterDotPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        characterSkeletonSlide: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        soundtrackParticleFloat: {
          '0%, 100%': {
            transform: 'translateY(0) scale(1)',
            opacity: '0.25',
          },
          '50%': {
            transform: 'translateY(-32px) scale(1.3)',
            opacity: '0.7',
          },
        },
        soundtrackGlowPulse: {
          '0%, 100%': {
            boxShadow: 'inset 0 0 60px rgba(192,132,252,0.08)',
          },
          '50%': {
            boxShadow: 'inset 0 0 80px rgba(192,132,252,0.18)',
          },
        },
        soundtrackSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        soundtrackFadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        soundtrackShimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        notFoundFloat: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(0.95)' },
          '50%': { transform: 'translate3d(0,-24px,0) scale(1.05)' },
        },
      },
      animation: {
        'characters-particle-drift': 'charactersParticleDrift 6s ease-in-out infinite',
        'characters-reveal': 'charactersReveal 0.8s cubic-bezier(0.16,1,0.3,1) both',
        'characters-filter-reveal': 'charactersReveal 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both',
        'characters-dot-pulse': 'charactersDotPulse 2.4s ease-in-out infinite',
        'characters-card-reveal': 'charactersCardReveal 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'characters-skeleton-slide': 'charactersSkeletonSlide 1.6s infinite',
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
        'movie-particle-drift': 'movieParticleDrift 6s ease-in-out infinite',
        'movie-hero-fade': 'movieHeroFade 1.2s cubic-bezier(0.16,1,0.3,1) both',
        'movie-dot-pulse': 'movieDotPulse 2.5s ease-in-out infinite',
        'movie-shimmer-slide': 'movieShimmerSlide 1.6s infinite',
        'character-particle-drift': 'characterParticleDrift 6s ease-in-out infinite',
        'character-reveal': 'characterReveal 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'character-image-fade-in': 'characterImageFadeIn 0.28s ease forwards',
        'character-image-fade-out': 'characterImageFadeOut 0.26s ease forwards',
        'character-switch-glow': 'characterSwitchGlowSweep 2.5s linear infinite',
        'character-dot-pulse': 'characterDotPulse 2.4s ease-in-out infinite',
        'character-skeleton-slide': 'characterSkeletonSlide 1.6s infinite',
        'soundtrack-particle': 'soundtrackParticleFloat 6s ease-in-out infinite',
        'soundtrack-glow': 'soundtrackGlowPulse 4s ease-in-out infinite',
        'soundtrack-spin': 'soundtrackSpin 12s linear infinite',
        'soundtrack-fade-in': 'soundtrackFadeIn 0.4s ease both',
        'soundtrack-shimmer': 'soundtrackShimmer 1.6s ease-in-out infinite',
        'not-found-float': 'notFoundFloat linear infinite',
      },
    },
  },
  plugins: [],
}
