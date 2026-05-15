import { getTwitterLoginUrl } from "../services/api";

export default function TwitterLoginButton() {
  const handleClick = () => {
    window.location.href = getTwitterLoginUrl();
  };

  return (
    <button
      type="button"
      className="auth-google-button"
      onClick={handleClick}
      aria-label="Sign in with X"
    >
      <svg
        className="auth-google-icon"
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
  );
}
