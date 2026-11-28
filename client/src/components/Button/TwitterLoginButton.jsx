import { getTwitterLoginUrl } from '../../services/api'

export default function TwitterLoginButton() {
  const handleClick = () => {
    window.location.href = getTwitterLoginUrl()
  }

  return (
    <button
      type="button"
      className="auth-google-button inline-flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-[14px] border border-solid border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] text-white [transition:all_0.25s_cubic-bezier(0.4,0,0.2,1)] hover:border-[#c084fc] hover:bg-[rgba(192,132,252,0.12)] hover:shadow-[0_8px_24px_rgba(192,132,252,0.15)] hover:[transform:translateY(-2px)]"
      onClick={handleClick}
      aria-label="Sign in with X"
    >
      <svg
        className="auth-google-icon block h-6 w-6 flex-none overflow-visible"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="#ffffff"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.338-6.996-6.117 6.996H1.436l7.713-8.835L1.482 2.25h6.116l4.822 6.367L18.244 2.25zM17.009 18.875h1.832L6.75 3.972H4.822l12.187 14.903z"
        />
      </svg>
    </button>
  )
}
