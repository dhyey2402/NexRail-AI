import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as apiLogin } from "../services/api";
import { Train, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin({ email, password });
      login(data.access_token, data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--nr-bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--nr-accent)] mb-4">
            <Train className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-[var(--nr-text)]">
            NexRail AI
          </h1>
          <p className="text-[13px] text-[var(--nr-text-muted)] mt-1">
            Operations Console — Sign In
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="nr-card p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md text-[13px] bg-[var(--nr-danger-muted)] text-[var(--nr-danger)] border border-[var(--nr-danger)]/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-[var(--nr-text-secondary)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--nr-border)] bg-[var(--nr-bg)] px-3 py-2 text-[13px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors"
              placeholder="admin@nexrail.in"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-[var(--nr-text-secondary)]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--nr-border)] bg-[var(--nr-bg)] px-3 py-2 text-[13px] text-[var(--nr-text)] placeholder:text-[var(--nr-text-faint)] outline-none focus:border-[var(--nr-accent)] transition-colors"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[var(--nr-accent)] hover:bg-[var(--nr-accent-hover)] disabled:opacity-50 text-white text-[13px] font-medium py-2.5 transition-colors cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Testing Credentials for Evaluation */}
          <div className="mt-4 pt-3.5 border-t border-[var(--nr-border)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--nr-accent)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--nr-accent)]" />
                Testing Credentials
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@nexrail.in");
                  setPassword("admin@123");
                }}
                className="text-[11px] font-medium text-[var(--nr-accent)] hover:text-[var(--nr-accent-hover)] hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            <p className="text-[11px] text-[var(--nr-text-muted)] mb-2 leading-relaxed">
              Use the credentials below to test and access the Admin Operations Dashboard:
            </p>

            <div className="space-y-1.5 rounded-md bg-[var(--nr-bg)] border border-[var(--nr-border)] px-3 py-2 font-mono text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--nr-text-muted)] font-sans text-[11px]">Email</span>
                <span className="text-[var(--nr-text)] select-all font-medium">admin@nexrail.in</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--nr-border-subtle)]">
                <span className="text-[var(--nr-text-muted)] font-sans text-[11px]">Password</span>
                <span className="text-[var(--nr-text)] select-all font-medium">admin@123</span>
              </div>
            </div>
          </div>
        </form>

        <p className="text-center text-[11px] text-[var(--nr-text-faint)] mt-6">
          NexRail AI — Indian Railways ETA Intelligence
        </p>
      </div>
    </div>
  );
}
