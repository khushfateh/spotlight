import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search } from "lucide-react";
import api from "../lib/api";
import ArtistCard from "../components/ArtistCard";
import { useAuth } from "../context/AuthContext";

export default function Discover() {
  const [artists, setArtists] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  const load = () => api.get("/artists").then((r) => setArtists(r.data));
  useEffect(() => { load(); }, [user]);

  const onSpot = async (artist) => {
    if (!user) { toast.error("Become a Spotter to start spotting."); nav("/auth"); return; }
    setBusy(artist.id);
    try {
      const { data } = await api.post(`/spots/${artist.id}`);
      toast.success(`Spotted ${artist.name} · You're Spotter #${data.position}`, {
        description: data.position <= 10 ? "Early spotter bonus secured." : "Added to your vault.",
      });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not spot");
    } finally { setBusy(null); }
  };

  const onUnspot = async (artist) => {
    setBusy(artist.id);
    try { await api.delete(`/spots/${artist.id}`); await load(); toast("Removed from vault"); }
    finally { setBusy(null); }
  };

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase()) || a.genre.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 pb-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-[#e6b85c] mb-3">The Roster</p>
        <h1 className="font-head text-5xl md:text-6xl font-light tracking-tight">Discover <span className="gold-text">future icons</span></h1>
        <p className="text-zinc-400 mt-3 max-w-lg">Browse rising creators by momentum. Spot the ones you believe in — your vault remembers the exact moment.</p>
      </motion.div>

      <div className="mt-8 relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="artist-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists or genres"
          className="w-full rounded-full bg-white/5 hairline pl-11 pr-4 py-3 outline-none focus:border-[#e6b85c]/60 transition-colors" />
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((a, i) => (
          <ArtistCard key={a.id} artist={a} index={i} busy={busy === a.id} onSpot={onSpot} onUnspot={onUnspot} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-zinc-500 mt-16 text-center">No artists match your search.</p>}
    </div>
  );
}
