// Generates a downloadable vault card PNG using the native canvas API (no deps).
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadVaultCard(item, spotterId) {
  const W = 640, H = 960;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#070605";
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W * 0.7, H * 0.15, 60, W * 0.7, H * 0.15, 700);
  grad.addColorStop(0, "rgba(230,184,92,0.18)");
  grad.addColorStop(1, "rgba(7,6,5,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // image
  const imgH = 520;
  try {
    const img = await loadImg(item.image_url);
    roundRect(ctx, 40, 40, W - 80, imgH, 28);
    ctx.save(); ctx.clip();
    const ratio = Math.max((W - 80) / img.width, imgH / img.height);
    const dw = img.width * ratio, dh = img.height * ratio;
    ctx.filter = "contrast(1.08) brightness(0.85)";
    ctx.drawImage(img, 40 + ((W - 80) - dw) / 2, 40 + (imgH - dh) / 2, dw, dh);
    ctx.restore();
    ctx.filter = "none";
    const og = ctx.createLinearGradient(0, 40, 0, 40 + imgH);
    og.addColorStop(0, "rgba(0,0,0,0)");
    og.addColorStop(1, "rgba(7,6,5,0.85)");
    roundRect(ctx, 40, 40, W - 80, imgH, 28); ctx.save(); ctx.clip();
    ctx.fillStyle = og; ctx.fillRect(40, 40, W - 80, imgH); ctx.restore();
  } catch (e) { /* image blocked - skip */ }

  // gold border
  ctx.strokeStyle = "rgba(230,184,92,0.5)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 24, 24, W - 48, H - 48, 34); ctx.stroke();

  // text
  ctx.textBaseline = "top";
  ctx.fillStyle = "#e6b85c";
  ctx.font = "600 16px 'JetBrains Mono', monospace";
  ctx.fillText(item.genre.toUpperCase(), 56, 470);

  ctx.fillStyle = "#ffffff";
  ctx.font = "300 56px 'Outfit', sans-serif";
  ctx.fillText(item.name, 54, 500);

  // divider
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath(); ctx.moveTo(56, 610); ctx.lineTo(W - 56, 610); ctx.stroke();

  const label = (t, x, y) => { ctx.fillStyle = "#8a8a8a"; ctx.font = "500 13px 'JetBrains Mono', monospace"; ctx.fillText(t, x, y); };
  const value = (t, x, y, color = "#fff") => { ctx.fillStyle = color; ctx.font = "300 30px 'Outfit', sans-serif"; ctx.fillText(t, x, y); };

  const d = new Date(item.spotted_at);
  const dateStr = d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  label("SPOTTER RANK", 56, 640);
  value(`#${item.position}`, 56, 662, "#e6b85c");

  label("STATUS", 320, 640);
  value(item.is_early ? "EARLY SPOT" : "SPOTTED", 320, 662, item.is_early ? "#7CFFA0" : "#fff");

  label("SPOTTED ON", 56, 740);
  value(dateStr, 56, 762);

  label("VAULT ID", 56, 838);
  ctx.fillStyle = "#cfcfcf"; ctx.font = "500 20px 'JetBrains Mono', monospace";
  ctx.fillText(`AV-${spotterId}`, 56, 862);

  ctx.fillStyle = "#e6b85c";
  ctx.font = "300 22px 'Outfit', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("SPOTLIGHT", W - 56, 862);
  ctx.textAlign = "left";

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `spotlight-${item.name.replace(/\s+/g, "-").toLowerCase()}.png`;
  a.click();
}
