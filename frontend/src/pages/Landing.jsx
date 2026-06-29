import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, Sparkles, Lock, ChevronDown, Search, Layers, Trophy } from "lucide-react";
import api from "../lib/api";
import SaxophoneScene from "../components/SaxophoneScene";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const [artists, setArtists] = useState([]);
  const { user } = useAuth();
  const nav = useNavigate();

  const scrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY / window.innerHeight;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { api.get("/artists").then((r) => setArtists(r.data)); }, []);

  const top = artists.slice(0, 3);
  const cta = () => nav(user ? "/discover" : "/auth");

  return (
    <div>
      {/* LARGER-THAN-LIFE 3D HERO — giant saxophone, sparkles, multi-layered UI */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(900px 700px at 50% 40%, rgba(230,184,92,0.14), transparent 70%)" }} />
        <SaxophoneScene scrollRef={scrollRef} />

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-10 h-screen flex flex-col justify-center pointer-events-none">
          <motion.div className="max-w-xl pointer-events-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 mb-7">
              <Sparkles size={13} className="text-[#e6b85c]" />
              <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-zinc-300">Discover · Spot · Remember</span>
            </div>

            <h1 className="font-head text-5xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[0.95] [text-shadow:0_2px_40px_rgba(0,0,0,0.7)]">
              Discover <span className="gold-text">future icons</span><br />before everyone else
            </h1>

            <p className="text-zinc-300 mt-6 max-w-md text-base leading-relaxed [text-shadow:0_2px_20px_rgba(0,0,0,0.8)]">
              Spot rising creators before they blow up. We mint you a vault card stamped with the exact moment you called it — and your spotter rank.
            </p>

            <div className="mt-9 flex items-center gap-4">
              <button data-testid="hero-cta-button" onClick={cta} className="btn-gold rounded-full pl-6 pr-2 py-2 flex items-center gap-3 font-semibold">
                Become a Spotter
                <span className="grid place-items-center w-9 h-9 rounded-full bg-black/15"><ArrowRight size={16} /></span>
              </button>
              <button data-testid="hero-discover-button" onClick={() => nav("/discover")} className="text-sm text-zinc-300 hover:text-white transition-colors">Explore roster →</button>
            </div>

            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {top.map((a) => (
                  <img key={a.id} src={a.image_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-black" style={{ filter: "grayscale(0.3)" }} alt="" />
                ))}
              </div>
              <div>
                <p className="font-head text-sm">12,847 Spotters</p>
                <p className="font-mono-x text-[10px] tracking-widest uppercase text-zinc-500">building the future</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 z-10">
          <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase">Scroll — spin the icon</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}><ChevronDown size={18} /></motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — vertical progression */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-10 py-28 relative z-10 bg-[#050505]">
        <p className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-[#e6b85c] mb-3">The Vertical</p>
        <h2 className="font-head text-4xl md:text-5xl font-light tracking-tight max-w-xl">Every spot climbs you <span className="gold-text">higher</span></h2>
        <div className="mt-14 relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[#e6b85c]/60 via-white/15 to-transparent" />
          {[
            { icon: Search, t: "Spot an artist", d: "Browse the roster and bookmark creators on the rise. Timing is everything." },
            { icon: Lock, t: "Mint a vault card", d: "We lock in the exact timestamp and your spotter position — proof you were early." },
            { icon: Layers, t: "Build your vault", d: "Every spot stacks into a private collection of glass vault cards you can download & share." },
            { icon: Trophy, t: "Climb the ranks", d: "Initiate → Scout → Tracker → Curator → Tastemaker → Oracle. Earlier calls rank higher." },
          ].map((s, i) => (
            <motion.div key={s.t} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }} className="relative flex gap-6 pb-12 last:pb-0">
              <div className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-[#e6b85c] text-black z-10"><s.icon size={17} /></div>
              <div className="pt-1">
                <h3 className="font-head text-xl font-medium">{s.t}</h3>
                <p className="text-zinc-400 mt-1 max-w-md">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VAULT TEASER */}
      <section className="max-w-[1400px] mx-auto px-5 md:px-10 pb-28 relative z-10 bg-[#050505]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 md:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(230,184,92,0.18), transparent 70%)" }} />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4"><Lock size={15} className="text-[#e6b85c]" /><span className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-zinc-400">Your discovery vault</span></div>
              <h2 className="font-head text-4xl md:text-5xl font-light tracking-tight">The moments you spotted <span className="gold-text">before the world did.</span></h2>
              <p className="text-zinc-400 mt-4 max-w-md">"The best time to spot was yesterday. The next best time is now."</p>
              <button data-testid="vault-cta-button" onClick={cta} className="btn-gold rounded-full px-6 py-3 mt-7 font-semibold inline-flex items-center gap-2">
                Open your vault <ArrowRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {artists.slice(0, 6).map((a) => (
                <div key={a.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden hairline">
                  <img src={a.image_url} className="w-full h-full object-cover" style={{ filter: "brightness(0.8)" }} alt="" />
                  <Bookmark size={14} className="absolute top-2 right-2 text-white/80" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
