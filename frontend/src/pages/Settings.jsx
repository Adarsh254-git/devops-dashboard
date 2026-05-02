import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdLogout } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-lg bg-bg-deep/80 border border-border-default px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/35 focus:border-brand-primary transition-shadow";

const sectionClass =
  "rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft";

export default function Settings() {
  const { user, logout, updateMe } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMe({ displayName });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await updateMe({ currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    toast.info("Signed out");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Profile, password, and session for your account.
        </p>
      </div>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Profile
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label
              htmlFor="settings-email"
              className="block text-xs font-medium text-text-muted mb-1.5"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className={`${inputClass} opacity-70 cursor-not-allowed`}
            />
            <p className="text-xs text-text-muted mt-1.5">
              Email cannot be changed here.
            </p>
          </div>
          <div>
            <label
              htmlFor="settings-display"
              className="block text-xs font-medium text-text-muted mb-1.5"
            >
              Display name
            </label>
            <input
              id="settings-display"
              type="text"
              maxLength={120}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="How you appear in the app"
              autoComplete="nickname"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-brand-primary/15 text-brand-primary border border-brand-primary/40 px-4 py-2 text-sm font-semibold hover:bg-brand-primary/20 disabled:opacity-50 transition-colors"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label
              htmlFor="settings-current-pw"
              className="block text-xs font-medium text-text-muted mb-1.5"
            >
              Current password
            </label>
            <input
              id="settings-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label
              htmlFor="settings-new-pw"
              className="block text-xs font-medium text-text-muted mb-1.5"
            >
              New password
            </label>
            <input
              id="settings-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="settings-confirm-pw"
              className="block text-xs font-medium text-text-muted mb-1.5"
            >
              Confirm new password
            </label>
            <input
              id="settings-confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-brand-primary/15 text-brand-primary border border-brand-primary/40 px-4 py-2 text-sm font-semibold hover:bg-brand-primary/20 disabled:opacity-50 transition-colors"
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Session
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Sign out on this device. You will need to sign in again to use the
          dashboard.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-accent-danger/50 bg-accent-danger/10 text-accent-danger px-4 py-2.5 text-sm font-semibold hover:bg-accent-danger/15 transition-colors"
        >
          <MdLogout size={18} />
          Log out
        </button>
      </section>
    </div>
  );
}
