import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Lock, Clock, Trophy, ChevronRight } from "lucide-react";
import api from "../lib/api";
import Sparkline from "../components/Sparkline";
import { downloadVaultCard } from "../lib/shareCard";
import { useAuth } from "../context/AuthContext";

const TIERS = ["Initiate", "Scout", "Tracker", "Curator", "Tastemaker", "Oracle"];

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Vault() {
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) { nav("/auth"); return; }
    if (user) api.get("/vault").then((r) => setData(r.data));
  }, [user, loading]);

  if (!data) return <div className="pt-40 text-center text-zinc-500">Opening your vault…</div>;

  const tier = data.tier;
  const items = data.items;
  const progressPct = tier.next_at ? Math.min(100, (tier.spots / tier.next_at) * 100) : 100;

  const onDownload = async (item) => {
    try { await downloadVaultCard(item, data.spotter_id); toast.success("Vault card downloaded"); }
    catch { toast.error("Could not generate card"); }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 pb-24">
      <div className="grid lg:grid-cols-[340px_1fr] gap-10">
        {/* Progression rail (vertical) */}
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="lg:sticky lg:top-28 self-start">
          <p className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-[#e6b85c] mb-3">Your Vault</p>
          <h1 className="font-head text-5xl font-light tracking-tight mb-2">{user?.name?.split(" ")[0]}'s <span className="gold-text">Vault</span></h1>
          <p className="text-zinc-400 text-sm mb-6">The moments you spotted before the world did.</p>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-[#e6b85c] text-black"><Trophy size={20} /></div>
              <div>
                <p className="font-mono-x text-[10px] tracking-widest uppercase text-zinc-400">Spotter Level {tier.level}</p>
                <p className="font-head text-2xl font-light gold-text">{tier.title}</p>
              </div>
            </div>

            <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-mono-x">
              <span>{tier.spots} spots</span>
              <span>{tier.next_title ? `${tier.to_next} to ${tier.next_title}` : "MAX"}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-[#d9a93f] to-[#f4d488]" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.9 }} />
            </div>

            {/* vertical tier ladder */}
            <div className="mt-7 space-y-0">
              {TIERS.map((t, i) => {
                const reached = i + 1 <= tier.level;
                const isCurrent = i + 1 === tier.level;
                return (
                  <div key={t} className="flex items-center gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full z-10 ${reached ? "bg-[#e6b85c]" : "bg-white/15"} ${isCurrent ? "ring-4 ring-[#e6b85c]/25" : ""}`} />
                      {i < TIERS.length - 1 && <div className={`w-px h-8 ${i + 1 < tier.level ? "bg-[#e6b85c]/60" : "bg-white/10"}`} />}
                    </div>
                    <span className={`text-sm pb-8 ${i === TIERS.length - 1 ? "pb-0" : ""} ${reached ? "text-white" : "text-zinc-500"} ${isCurrent ? "font-semibold" : ""}`}>
                      {t}{isCurrent && <span className="text-[#e6b85c] ml-2 text-xs">← you</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* Vault cards */}
        <div>
          {items.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center">
              <Lock size={32} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">Your vault is empty. Head to Discover and spot your first artist.</p>
              <button data-testid="goto-discover-button" onClick={() => nav("/discover")} className="btn-gold rounded-full px-6 py-3 mt-6 font-semibold">Start Spotting</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.artist_id}
                  data-testid={`vault-card-${item.artist_id}`}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: (i % 2) * 0.08 }}
                  className="group relative glass rounded-3xl overflow-hidden"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img src={item.image_url} alt={item.name} crossOrigin="anonymous"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: "contrast(1.08) brightness(0.82)" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className={`absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs font-mono-x ${item.is_early ? "bg-[#7CFFA0]/15 text-[#7CFFA0]" : "bg-black/45 text-zinc-200"} hairline`}>
                      {item.is_early ? "EARLY SPOT" : "SPOTTED"} · #{item.position}
                    </div>
                    <div className="absolute bottom-4 left-5 right-5">
                      <p className="font-mono-x text-[10px] tracking-[0.25em] uppercase text-[#e6b85c]">{item.genre}</p>
                      <h3 className="font-head text-2xl font-light">{item.name}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono-x mb-3">
                      <Clock size={13} /> {timeAgo(item.spotted_at)}
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-mono-x text-[9px] tracking-widest uppercase text-zinc-500 mb-1">Momentum {Math.round(item.momentum)}</p>
                        <div className="h-7"><Sparkline data={item.trend} /></div>
                      </div>
                      <button data-testid={`download-card-${item.artist_id}`} onClick={() => onDownload(item)}
                        className="shrink-0 flex items-center gap-1.5 rounded-full glass hairline px-3 py-2 text-xs hover:bg-white/10 transition-colors">
                        <Download size={14} /> Card
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
