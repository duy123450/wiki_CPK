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
      },
      animation: {
        'profile-avatar-pulse': 'profileAvatarPulse 1.2s ease-in-out infinite',
        'profile-spin': 'profileSpin 0.8s linear infinite',
        'profile-toast-in': 'profileToastIn 0.3s ease',
        'scroll-to-top-pulse': 'scrollToTopPulse 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
