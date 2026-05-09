import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginUser, registerUser, uploadAvatar } from "../services/api";
import GoogleLoginButton from "../components/GoogleLoginButton";
import TwitterLoginButton from "../components/TwitterLoginButton";
import DiscordLoginButton from "../components/DiscordLoginButton";
import "../styles/AuthPage.css";

const INITIAL_FORM = {
  username: "",
  email: "", // register mode
  identifier: "", // login mode
  password: "",
  confirmPassword: "", // register mode
};

export default function AuthPage({
  sidebarCollapsed,
  currentUser,
  onAuthSuccess, // ({ user, token }) — called on login / register
  onAvatarUpdate, // (avatar) — called when only the avatar changes
  onLogout,
}) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessToken = searchParams.get("accessToken");
  const oauthUser = searchParams.get("user");
  const googleError = searchParams.get("googleError");
  const twitterError = searchParams.get("twitterError");
  const discordError = searchParams.get("discordError");
  const socialError = searchParams.get("error");

  useEffect(() => {
    if (accessToken && oauthUser) {
      try {
        onAuthSuccess({
          user: JSON.parse(oauthUser),
          accessToken,
          token: accessToken,
        });
        navigate("/auth", { replace: true });
      } catch {
        setError("Sign-in failed. Please try again.");
      }
      return;
    }

    if (socialError === "social_conflict") {
      setError("This email is already associated with another login method. Please use your original login.");
      navigate("/auth", { replace: true });
      return;
    }

    if (googleError) {
      setError("Google sign-in was cancelled or failed.");
      navigate("/auth", { replace: true });
    }

    if (twitterError) {
      setError("X sign-in was cancelled or failed.");
      navigate("/auth", { replace: true });
    }

    if (discordError) {
      setError("Discord sign-in was cancelled or failed.");
      navigate("/auth", { replace: true });
    }
  }, [
    accessToken,
    googleError,
    twitterError,
    discordError,
    socialError,
    oauthUser,
    navigate,
    onAuthSuccess,
  ]);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setForm(INITIAL_FORM);
    setError("");
    setAvatarPreview(null);
    setPendingAvatarFile(null);
    setAvatarError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ── File chosen ────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarError("");

    if (!currentUser) {
      // During register: hold the file, upload after account creation
      setPendingAvatarFile(file);
      return;
    }

    // Signed-in: upload immediately, then only patch the avatar field in state
    setAvatarUploading(true);
    try {
      const data = await uploadAvatar(file);
      onAvatarUpdate(data.avatar);
      // Keep the preview until the parent re-renders with the new URL
    } catch (err) {
      setAvatarError(err.response?.data?.msg || "Upload failed");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let response; // { user, token }

      if (mode === "register") {
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match");
          setSubmitting(false);
          return;
        }
        response = await registerUser({
          username: form.username,
          email: form.email, // ← correct key; backend expects "email" not "identifier"
          password: form.password,
        });
      } else {
        response = await loginUser({
          identifier: form.identifier,
          password: form.password,
        });
      }

      // Persist session — must be { user, token }
      onAuthSuccess(response);

      // Upload avatar chosen before submitting the register form
      if (mode === "register" && pendingAvatarFile) {
        setAvatarUploading(true);
        try {
          const data = await uploadAvatar(pendingAvatarFile);
          onAvatarUpdate(data.avatar); // patch only the avatar slice
        } catch {
          setAvatarError(
            "Account created! Avatar upload failed — you can change it later.",
          );
        } finally {
          setAvatarUploading(false);
          setPendingAvatarFile(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Signed-in view ────────────────────────────────────────────────────────
  if (currentUser) {
    // Use local preview while upload is in-flight; fall back to persisted URL
    const avatarSrc = avatarPreview || currentUser.avatar?.url;

    return (
      <section
        className={`auth-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="auth-shell auth-shell--signed-in">
          <span className="auth-badge">Signed In</span>

          <div className="auth-avatar-wrap">
            <div
              className={`auth-avatar-ring ${
                avatarUploading ? "auth-avatar-ring--uploading" : ""
              }`}
            >
              <img
                src={avatarSrc}
                alt={`${currentUser.username}'s avatar`}
                className="auth-avatar-img"
              />
              {avatarUploading && (
                <div className="auth-avatar-spinner" aria-label="Uploading…" />
              )}
            </div>

            <button
              type="button"
              className="auth-avatar-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? "Uploading…" : "Change Avatar"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            {avatarError && <p className="auth-error">{avatarError}</p>}
          </div>

          <h1 className="auth-title">
            Chào mừng trở lại, {currentUser.username}
          </h1>
          <p className="auth-copy">Quay về wiki hoặc đăng xuất tại đây.</p>

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

  // ─── Login / Register view ─────────────────────────────────────────────────
  return (
    <section
      className={`auth-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="auth-shell">
        <div className="auth-hero">
          <span className="auth-badge">Member Access</span>
          <h1 className="auth-title">Đăng nhập hoặc đăng ký vào CPK Wiki</h1>
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
            <>
              {/* Avatar picker shown only during registration */}
              <div className="auth-avatar-register">
                <div
                  className="auth-avatar-register-preview"
                  onClick={() => fileInputRef.current.click()}
                  title="Click to choose an avatar"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <span className="auth-avatar-register-placeholder">＋</span>
                  )}
                  <div className="auth-avatar-register-overlay">
                    <span>Choose avatar</span>
                  </div>
                </div>

                <p className="auth-avatar-register-hint">
                  {pendingAvatarFile
                    ? `Selected: ${pendingAvatarFile.name}`
                    : "Optional — you can change it later"}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

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
            </>
          )}

          <label className="auth-field">
            <span>{mode === "register" ? "Email" : "Email or Username"}</span>
            <input
              type={mode === "register" ? "email" : "text"}
              value={mode === "register" ? form.email : form.identifier}
              onChange={updateField(
                mode === "register" ? "email" : "identifier",
              )}
              autoComplete={mode === "register" ? "email" : "username"}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField("password")}
                minLength={6}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {mode === "register" && (
            <label className="auth-field">
              <span>Confirm Password</span>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={updateField("confirmPassword")}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}
          {avatarError && mode === "register" && (
            <p className="auth-error">{avatarError}</p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || avatarUploading}
          >
            {submitting || avatarUploading
              ? "Processing…"
              : mode === "register"
                ? "Create Account"
                : "Login"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-google-wrap">
            <GoogleLoginButton />
            <TwitterLoginButton />
            <DiscordLoginButton />
          </div>
        </form>
      </div>
    </section>
  );
}
