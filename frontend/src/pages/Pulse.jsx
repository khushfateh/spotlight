import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Flame } from "lucide-react";
import api from "../lib/api";

export default function Pulse() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/leaderboard").then((r) => setRows(r.data)); }, []);

  return (
    <div className="max-w-[1000px] mx-auto px-5 md:px-10 pt-28 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-[#e6b85c] mb-3">The Pulse</p>
        <h1 className="font-head text-5xl md:text-6xl font-light tracking-tight">Top <span className="gold-text">Spotters</span></h1>
        <p className="text-zinc-400 mt-3">Ranked by total spots and early calls. Climb the ranks by finding icons first.</p>
      </motion.div>

      <div className="mt-10 space-y-3">
        {rows.length === 0 && <p className="text-zinc-500 text-center py-16">No spotters ranked yet. Be the first.</p>}
        {rows.map((r, i) => (
          <motion.div
            key={r.rank}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            data-testid={`leaderboard-row-${r.rank}`}
            className="glass rounded-2xl px-5 py-4 flex items-center gap-4"
          >
            <div className={`w-9 text-center font-head text-2xl font-light ${r.rank <= 3 ? "gold-text" : "text-zinc-500"}`}>
              {r.rank}
            </div>
            <div className="grid place-items-center w-10 h-10 rounded-full bg-[#e6b85c] text-black font-bold">
              {r.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate flex items-center gap-2">
                {r.name} {r.rank === 1 && <Crown size={15} className="text-[#e6b85c]" />}
              </p>
              <p className="font-mono-x text-[10px] tracking-widest uppercase text-zinc-500">Lv.{r.tier.level} · {r.tier.title}</p>
            </div>
            <div className="text-right">
              <p className="font-head text-xl">{r.spots}</p>
              <p className="font-mono-x text-[10px] tracking-widest uppercase text-zinc-500">spots</p>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[#7CFFA0] text-sm">
              <Flame size={14} /> {r.early} early
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
