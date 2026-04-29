import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";
import "../styles/AuthPage.css";

const INITIAL_FORM = {
  username: "",
  email: "",
  password: "",
};

export default function AuthPage({
  sidebarCollapsed,
  currentUser,
  onAuthSuccess,
  onLogout,
}) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(INITIAL_FORM);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response =
        mode === "register"
          ? await registerUser(form)
          : await loginUser({
              email: form.email,
              password: form.password,
            });

      onAuthSuccess(response);
    } catch (requestError) {
      setError(requestError.response?.data?.msg || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser) {
    return (
      <section
        className={`auth-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="auth-shell auth-shell--signed-in">
          <span className="auth-badge">Signed In</span>
          <h1 className="auth-title">Welcome back, {currentUser.username}</h1>
          <p className="auth-copy">
            Session active. Go back to wiki or log out here.
          </p>
          <div className="auth-user-card">
            <span className="auth-user-label">Email</span>
            <strong>{currentUser.email}</strong>
            <span className="auth-user-role">{currentUser.role}</span>
          </div>
          <div className="auth-actions">
            <Link to="/" className="auth-btn auth-btn-primary">
              Back To Wiki
            </Link>
            <button
              type="button"
              className="auth-btn auth-btn-secondary"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`auth-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="auth-shell">
        <div className="auth-hero">
          <span className="auth-badge">Member Access</span>
          <h1 className="auth-title">Login or register for CPK Wiki</h1>
          <p className="auth-copy">
            Frontend form talks to backend auth endpoints, stores token locally,
            and restores session on refresh.
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={updateField("username")}
                minLength={3}
                maxLength={20}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={updateField("password")}
              minLength={6}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? "Processing..."
              : mode === "register"
                ? "Create Account"
                : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
}
