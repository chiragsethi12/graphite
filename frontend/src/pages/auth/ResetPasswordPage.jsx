import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../../lib/axios";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength indicator
  const getStrength = (pw) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
    if (score === 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
    if (score === 3) return { label: "Good", color: "bg-yellow-500", width: "60%" };
    if (score === 4) return { label: "Strong", color: "bg-green-500", width: "80%" };
    return { label: "Very Strong", color: "bg-emerald-600", width: "100%" };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-12 text-white">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Graphite</h1>
          <p className="text-primary-200 text-sm">Professional Networking Platform</p>
        </div>
        <div>
          <blockquote className="border-l-4 border-primary-400 pl-4 mb-8">
            <p className="text-lg font-medium text-white/90 leading-relaxed">
              "A strong password is the first line of defense for your professional identity."
            </p>
          </blockquote>
          <div className="flex flex-col gap-3">
            {[
              "Use at least 6 characters",
              "Mix uppercase and lowercase letters",
              "Include numbers and symbols",
              "Avoid common words or patterns",
            ].map((tip) => (
              <div key={tip} className="flex items-center gap-3 bg-primary-800/50 rounded-xl px-4 py-3">
                <CheckCircle size={16} className="text-primary-300 flex-shrink-0" />
                <p className="text-primary-100 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-300 text-xs">© 2024 Graphite Professional. All rights reserved.</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-muted">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-extrabold text-primary">Graphite</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-card-hover border border-surface-border p-8">
            {success ? (
              /* ─── Success State ─── */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Your password has been updated successfully. Redirecting to sign in…
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                >
                  <ArrowLeft size={14} /> Go to Sign In
                </Link>
              </div>
            ) : (
              /* ─── Form State ─── */
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-5 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Choose a strong password to secure your account.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  {/* New Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">New password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        name="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password && (
                      <div className="mt-1.5">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Strength: <span className="font-medium">{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Confirm password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full pl-9 pr-9 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary ${
                          confirmPassword && confirmPassword !== password
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-red-500 mt-0.5">Passwords do not match</p>
                    )}
                  </div>

                  <Button type="submit" fullWidth loading={loading} className="mt-2">
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
