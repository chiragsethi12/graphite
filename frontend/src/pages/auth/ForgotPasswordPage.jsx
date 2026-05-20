import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../lib/axios";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
              "Security isn't just a feature — it's the foundation of trust in every professional relationship."
            </p>
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[["256-bit", "Encryption"], ["24/7", "Security Team"], ["99.9%", "Uptime"], ["GDPR", "Compliant"]].map(([val, label]) => (
              <div key={label} className="bg-primary-800/50 rounded-xl p-4">
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-primary-200 text-xs mt-0.5">{label}</p>
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
            {sent ? (
              /* ─── Success State ─── */
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  If an account exists for <strong className="text-gray-700">{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
                </p>
                <p className="text-xs text-gray-400 mb-6">The link expires in 1 hour.</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                >
                  <ArrowLeft size={14} /> Back to Sign In
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
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Enter the email associated with your account and we'll send a reset link.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                    required
                  />
                  <Button type="submit" fullWidth loading={loading} className="mt-2">
                    Send Reset Link
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
