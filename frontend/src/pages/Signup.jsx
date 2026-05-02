import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-lg bg-bg-deep/80 border border-border-default px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/35 focus:border-brand-primary transition-shadow";

export default function Signup() {
  const { user, initializing, register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-border-default bg-bg-card/90 backdrop-blur-md shadow-card p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-text-secondary">
            Register to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-medium text-text-muted mb-1.5">
              Display name <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              id="signup-name"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="Taylor Lee"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-text-muted mb-1.5">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-xs font-medium text-text-muted mb-1.5">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="signup-confirm" className="block text-xs font-medium text-text-muted mb-1.5">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || initializing}
            className="w-full rounded-lg bg-linear-to-r from-brand-primary to-brand-secondary text-bg-deep font-semibold text-sm py-2.5 shadow-lg shadow-brand-primary/20 hover:opacity-95 disabled:opacity-50 disabled:pointer-events-none transition-opacity"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-brand-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
