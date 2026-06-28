import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight, Bookmark, Sparkles, Lock, ChevronDown, Search, Layers, Trophy } from "lucide-react";
import api from "../lib/api";
import Sparkline from "../components/Sparkline";
import { useAuth } from "../context/AuthContext";

const FloatCard = ({ artist, className, delay, y }) => (
  <motion.div
    style={{ y }}
    initial={{ opacity: 0, y: 60, rotateX: 12 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute glass rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] ${className}`}
  >
    <div className="relative h-full">
      <img src={artist.image_url} alt={artist.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: "contrast(1.1) brightness(0.8)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-md px-2.5 py-1 hairline">
        <ArrowUpRight size={11} className="text-[#7CFFA0]" />
        <span className="font-mono-x text-[10px] text-[#7CFFA0]">{Math.round(artist.momentum)}</span>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-4">
        <h3 className="font-head text-lg font-light leading-tight">{artist.name}</h3>
        <p className="font-mono-x text-[9px] tracking-widest uppercase text-[#e6b85c] mt-0.5">{artist.genre}</p>
        <div className="h-6 mt-2 opacity-80"><Sparkline data={artist.trend} height={26} /></div>
      </div>
    </div>
  </motion.div>
);

export default function Landing() {
  const [artists, setArtists] = useState([]);
  const { user } = useAuth();
  const nav = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  useEffect(() => { api.get("/artists").then((r) => setArtists(r.data)); }, []);

  const top = artists.slice(0, 3);
  const trending = artists.slice(3, 7);
  const cta = () => nav(user ? "/discover" : "/auth");

  return (
    <div>
      {/* HERO */}
      <section ref={ref} className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(800px 600px at 75% 8%, rgba(230,184,92,0.16), transparent 65%)" }} />
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-32 md:pt-40 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* left text */}
            <motion.div style={{ y: textY }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 mb-8">
                <Sparkles size={13} className="text-[#e6b85c]" />
                <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-zinc-300">Discover · Spot · Remember</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                className="font-head text-5xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[0.95]">
                Discover <span className="gold-text">future icons</span><br />before everyone else
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
                className="text-zinc-400 mt-6 max-w-md text-base leading-relaxed">
                Spot rising creators before they blow up. We mint you a vault card stamped with the exact moment you called it — and your spotter rank.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-9 flex items-center gap-4">
                <button data-testid="hero-cta-button" onClick={cta} className="btn-gold rounded-full pl-6 pr-2 py-2 flex items-center gap-3 font-semibold">
                  Become a Spotter
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-black/15"><ArrowRight size={16} /></span>
                </button>
                <button data-testid="hero-discover-button" onClick={() => nav("/discover")} className="text-sm text-zinc-300 hover:text-white transition-colors">Explore roster →</button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {top.map((a) => (
                    <img key={a.id} src={a.image_url} className="w-8 h-8 rounded-full object-cover ring-2 ring-black" style={{ filter: "grayscale(0.3)" }} />
                  ))}
                </div>
                <div>
                  <p className="font-head text-sm">12,847 Spotters</p>
                  <p className="font-mono-x text-[10px] tracking-widest uppercase text-zinc-500">building the future</p>
                </div>
              </motion.div>
            </motion.div>

            {/* right floating cards */}
            <div className="relative h-[420px] lg:h-[560px]" style={{ perspective: 1200 }}>
              {top[0] && <FloatCard artist={top[0]} delay={0.3} y={y1} className="w-[200px] h-[300px] left-2 top-10 z-20 -rotate-3" />}
              {top[1] && <FloatCard artist={top[1]} delay={0.45} y={y2} className="w-[210px] h-[320px] left-1/2 -translate-x-1/2 top-0 z-30 rotate-2" />}
              {top[2] && <FloatCard artist={top[2]} delay={0.6} y={y3} className="w-[200px] h-[300px] right-2 top-16 z-10 rotate-3" />}
            </div>
          </div>

          {/* trending strip */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="mt-12 lg:mt-6">
            <p className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-3">Trending now</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trending.map((a) => (
                <button key={a.id} onClick={() => nav("/discover")} className="shrink-0 flex items-center gap-3 glass rounded-2xl pl-2 pr-4 py-2 hover:bg-white/10 transition-colors">
                  <img src={a.image_url} className="w-10 h-10 rounded-xl object-cover" style={{ filter: "brightness(0.85)" }} />
                  <div className="text-left">
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="font-mono-x text-[9px] tracking-widest uppercase text-zinc-500">{a.genre}</p>
                  </div>
                  <span className="font-mono-x text-xs text-[#7CFFA0] flex items-center gap-0.5"><ArrowUpRight size={11} />{Math.round(a.momentum)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500">
          <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase">Scroll to explore</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}><ChevronDown size={18} /></motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — vertical progression */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-10 py-28">
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
      <section className="max-w-[1400px] mx-auto px-5 md:px-10 pb-28">
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
                  <img src={a.image_url} className="w-full h-full object-cover" style={{ filter: "brightness(0.8)" }} />
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
