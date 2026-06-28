import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Bookmark, BookmarkCheck, ArrowUpRight } from "lucide-react";
import Sparkline from "./Sparkline";

export default function ArtistCard({ artist, onSpot, onUnspot, index = 0, busy }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 15 });
  const [hover, setHover] = useState(false);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { mx.set(0); my.set(0); setHover(false); };

  const spotted = !!artist.spotted;

  return (
    <motion.div
      ref={ref}
      data-testid={`artist-card-${artist.id}`}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.07 }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className="group relative rounded-3xl overflow-hidden glass shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="relative h-[320px] overflow-hidden rounded-3xl" style={{ transform: "translateZ(24px)" }}>
        <img
          src={artist.image_url}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ filter: "contrast(1.08) saturate(0.95) brightness(0.82)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
        {hover && (
          <div className="absolute inset-0 card-sheen mix-blend-overlay pointer-events-none" />
        )}

        {/* momentum badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 hairline">
          <ArrowUpRight size={13} className="text-[#7CFFA0]" />
          <span className="font-mono-x text-xs text-[#7CFFA0]">{Math.round(artist.momentum)}</span>
        </div>

        {/* bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5" style={{ transform: "translateZ(38px)" }}>
          <p className="font-mono-x text-[10px] tracking-[0.25em] uppercase text-[#e6b85c] mb-1">{artist.genre}</p>
          <h3 className="font-head text-2xl font-light leading-tight">{artist.name}</h3>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="flex-1">
              <p className="font-mono-x text-[9px] tracking-widest uppercase text-zinc-400 mb-0.5">Momentum</p>
              <div className="h-8 w-full opacity-90"><Sparkline data={artist.trend} /></div>
            </div>
            {spotted ? (
              <button
                data-testid={`unspot-button-${artist.id}`}
                onClick={() => onUnspot?.(artist)}
                className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#e6b85c]/15 hairline px-3 py-2 text-[#e6b85c] text-xs font-medium hover:bg-[#e6b85c]/25 transition-colors"
              >
                <BookmarkCheck size={14} /> #{artist.spotted.position}
              </button>
            ) : (
              <button
                data-testid={`spot-button-${artist.id}`}
                disabled={busy}
                onClick={() => onSpot?.(artist)}
                className="btn-gold shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                <Bookmark size={14} /> Spot
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
