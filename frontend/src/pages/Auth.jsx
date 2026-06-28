import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api, { formatApiErrorDetail } from "../lib/api";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      toast.success("Welcome, Spotter.");
      nav("/discover");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(600px 400px at 50% 20%, rgba(230,184,92,0.18), transparent 70%)" }} />
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md glass rounded-3xl p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-2 mb-7">
          <Sparkles size={18} className="text-[#e6b85c]" />
          <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-zinc-400">Discover · Spot · Remember</span>
        </div>
        <h1 className="font-head text-4xl font-light leading-tight mb-2">
          {mode === "register" ? "Join the " : "Welcome "}<span className="gold-text">Spotters</span>
        </h1>
        <p className="text-sm text-zinc-400 mb-8">Spot rising creators before they blow up. Your taste today, culture tomorrow.</p>

        <div className="flex gap-1 p-1 rounded-full glass mb-7 w-max">
          {["register", "login"].map((m) => (
            <button
              key={m}
              data-testid={`auth-tab-${m}`}
              onClick={() => setMode(m)}
              className={`px-5 py-1.5 rounded-full text-sm transition-all ${mode === m ? "bg-[#e6b85c] text-black font-semibold" : "text-zinc-400"}`}
            >
              {m === "register" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <input data-testid="name-input" required value={form.name} onChange={upd("name")} placeholder="Your name"
              className="w-full rounded-2xl bg-white/5 hairline px-4 py-3 outline-none focus:border-[#e6b85c]/60 transition-colors" />
          )}
          <input data-testid="email-input" type="email" required value={form.email} onChange={upd("email")} placeholder="Email"
            className="w-full rounded-2xl bg-white/5 hairline px-4 py-3 outline-none focus:border-[#e6b85c]/60 transition-colors" />
          <input data-testid="password-input" type="password" required value={form.password} onChange={upd("password")} placeholder="Password"
            className="w-full rounded-2xl bg-white/5 hairline px-4 py-3 outline-none focus:border-[#e6b85c]/60 transition-colors" />
          <button data-testid="auth-submit-button" disabled={loading}
            className="btn-gold w-full rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? "..." : mode === "register" ? "Start Spotting" : "Enter the Vault"} <ArrowRight size={16} />
          </button>
        </form>
        <p className="text-center text-xs text-zinc-500 mt-6">
          <Link to="/" className="hover:text-zinc-300">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}
