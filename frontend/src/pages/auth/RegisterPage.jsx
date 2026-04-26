import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, AtSign, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [usernameStatus, setUsernameStatus] = useState("idle"); // "idle" | "checking" | "available" | "taken" | "invalid"
  const [checkedUsername, setCheckedUsername] = useState("");
  const debounceRef = useRef(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const val = form.username;
    if (val.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      
      let isInvalid = false;
      if (clean !== val.toLowerCase()) {
        setUsernameStatus("invalid");
        isInvalid = true;
      } else {
        setUsernameStatus("checking");
      }

      if (!clean) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/check-username?username=${clean}`);
        const data = await res.json();
        
        if (data.available) {
          if (!isInvalid) setUsernameStatus("available");
          setCheckedUsername(clean);
        } else {
          setUsernameStatus("taken");
          setCheckedUsername(clean);
        }
      } catch (err) {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [form.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }

    if (usernameStatus === "checking") {
      setError("Please wait for username check to complete");
      return;
    }

    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }

    if (usernameStatus === "invalid") {
      setError("Please fix your username format");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.username);
      toast.success("Welcome to Graphite!");
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-12 text-white">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Graphite</h1>
          <p className="text-primary-200 text-sm">Professional Networking Platform</p>
        </div>
        <div className="space-y-4">
          {[
            ["🌍", "Elite Global Network", "Connect with top-tier professionals across 180+ countries"],
            ["💼", "Curated Opportunities", "Access C-suite and executive roles invisible elsewhere"],
            ["📊", "Actionable Insights", "Data-driven analytics to supercharge your career"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-4 bg-primary-800/40 rounded-xl p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-primary-200 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-primary-300 text-xs">© 2024 Graphite Professional. All rights reserved.</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-muted">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-extrabold text-primary">Graphite</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-card-hover border border-surface-border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-sm text-gray-500 mb-6">Join the world's most exclusive professional network</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              
              <Input label="Full Name" name="name" type="text" placeholder="Elena Sterling" value={form.name} onChange={handleChange} icon={User} required />
              
              <div className="relative flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="username"
                    type="text"
                    placeholder="your-username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className={`w-full pl-9 pr-24 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      usernameStatus === "available"
                        ? "border-green-400 focus:ring-green-200"
                        : usernameStatus === "taken"
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:ring-primary-300 focus:border-primary"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white">
                    {usernameStatus === "checking" && <Loader2 size={14} className="text-gray-400 animate-spin" />}
                    {usernameStatus === "available" && (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Available</span>
                      </>
                    )}
                    {usernameStatus === "taken" && (
                      <>
                        <XCircle size={14} className="text-red-500" />
                        <span className="text-xs text-red-500 font-medium">Taken</span>
                      </>
                    )}
                  </div>
                </div>
                {usernameStatus === "available" && <p className="text-xs text-green-600 mt-0.5">✓ @{checkedUsername} is available</p>}
                {usernameStatus === "taken" && <p className="text-xs text-red-500 mt-0.5">✗ @{checkedUsername} is already taken</p>}
                {usernameStatus === "invalid" && <p className="text-xs text-gray-400 mt-0.5">Only letters, numbers, - and _ allowed</p>}
              </div>

              <Input label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} icon={Mail} required />
              
              <div className="relative flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
                  />
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Input
                label="Confirm Password"
                name="confirm"
                type="password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                icon={Lock}
                required
              />
              <Button type="submit" fullWidth loading={loading} className="mt-2">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already on Graphite?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
