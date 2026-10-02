import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing } from "remotion";

const FPS = 30;
const C = {
  navy: "#0b1020",
  panel: "#161d34",
  text: "#f3f5fb",
  dim: "#8b93ad",
  red: "#ff4d5e",
  green: "#3ddc97",
  yellow: "#ffd166",
  blue: "#5aa9ff",
  ink: "#10131f",
};
const SANS = "Inter, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Courier New', monospace";
const WORD = "strawberry";
const R_IDX = [2, 7, 8];

// Veilige zone voor de voice-over/ondertitels die jullie er later bij zetten:
// alles blijft boven y ~1500 en de onderste ~20% van het beeld blijft rustig.
const LIFT = -110;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outCubic = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
const pop = (f: number, at: number, damping = 14, stiffness = 120) => spring({ frame: f - at, fps: FPS, config: { damping, stiffness } });
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- Achtergronden met textuur ----------
type BgKind = "navy" | "yellow" | "white" | "red" | "blue" | "black";
const BG: Record<BgKind, { bg: string; dark: boolean }> = {
  navy: { bg: C.navy, dark: true },
  yellow: { bg: C.yellow, dark: false },
  white: { bg: "#f1ede2", dark: false },
  red: { bg: C.red, dark: false },
  blue: { bg: "#143a8f", dark: true },
  black: { bg: "#000", dark: true },
};
type Tex = { file: string; size: number; opacity: number } | null;
const TEX = {
  grain: { file: "textures/grain.png", size: 1024, opacity: 0.1 },
  bark: { file: "textures/bark.png", size: 1024, opacity: 0.09 },
  brickWide: { file: "textures/brick-wide.png", size: 1400, opacity: 0.07 },
  stone: { file: "textures/stone.png", size: 1400, opacity: 0.09 },
  brick: { file: "textures/brick.png", size: 1024, opacity: 0.07 },
};

const Background: React.FC<{ kind: BgKind; tex: Tex }> = ({ kind, tex }) => {
  const f = useCurrentFrame();
  const { bg, dark } = BG[kind];
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {tex && (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${staticFile(tex.file)})`,
            backgroundSize: `${tex.size}px`,
            backgroundPosition: `${f * 0.6}px ${f * 0.35}px`,
            mixBlendMode: dark ? "screen" : "multiply",
            filter: dark ? "invert(1)" : undefined,
            opacity: tex.opacity,
          }}
        />
      )}
      {dark && kind !== "black" && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, rgba(90,169,255,0.18), transparent 62%)" }} />}
    </AbsoluteFill>
  );
};

// ---------- Shot: rustige zoom in, langzame push, zachte zoom uit ----------
type ShotDef = { dur: number; bg: BgKind; tex: Tex; noIn?: boolean; noOut?: boolean; push?: number; comp: React.FC };

const Shot: React.FC<{ def: ShotDef; frames: number }> = ({ def, frames }) => {
  const f = useCurrentFrame();
  const inP = def.noIn ? 1 : interpolate(f, [0, 16], [0, 1], { ...clamp, easing: outCubic });
  const outP = def.noOut ? 0 : interpolate(f, [frames - 12, frames], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const push = interpolate(f, [0, frames], [1, def.push ?? 1.06], clamp);
  const scale = (1.16 - 0.16 * inP) * (1 + 0.1 * outP) * push;
  const Comp = def.comp;
  return (
    <AbsoluteFill>
      <Background kind={def.bg} tex={def.tex} />
      <AbsoluteFill style={{ transform: `translateY(${LIFT}px) scale(${scale})`, opacity: inP * (1 - 0.5 * outP), filter: inP < 1 ? `blur(${(1 - inP) * 10}px)` : undefined }}>
        <Comp />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Bouwstenen ----------
const Strawberry: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
    <path d="M100 40 C 40 30, 8 80, 22 130 C 36 185, 80 220, 100 222 C 120 220, 164 185, 178 130 C 192 80, 160 30, 100 40 Z" fill={C.red} />
    {[[60, 85], [100, 80], [140, 85], [45, 120], [82, 118], [118, 118], [155, 120], [62, 155], [100, 152], [138, 155], [80, 187], [120, 187], [100, 205]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="5" ry="8" fill={C.yellow} transform={`rotate(-10 ${x} ${y})`} />
    ))}
    <path d="M100 48 C 80 20, 50 22, 40 36 C 62 38, 76 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 120 20, 150 22, 160 36 C 138 38, 124 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 92 28, 96 12, 100 6 C 104 12, 108 28, 100 48 Z" fill="#2fb87a" />
  </svg>
);

const Letters: React.FC<{ size: number; w: number; color?: string; highlight?: (i: number) => boolean; style?: (i: number) => React.CSSProperties }> = ({ size, w, color = C.text, highlight, style }) => (
  <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: size }}>
    {WORD.split("").map((ch, i) => {
      const hi = highlight?.(i);
      return (
        <span key={i} style={{ width: w, textAlign: "center", display: "inline-block", color: hi ? C.red : color, textShadow: hi ? `0 0 40px ${C.red}` : undefined, ...(style?.(i) ?? {}) }}>
          {ch}
        </span>
      );
    })}
  </div>
);

const Counter: React.FC<{ n: number; at: number[]; color: string; dimColor: string; size?: number }> = ({ n, at, color, dimColor, size = 190 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 44, fontFamily: SANS, fontWeight: 900, fontSize: size }}>
      {Array.from({ length: n }, (_, i) => i + 1).map((k) => {
        const on = f >= at[k - 1];
        const p = pop(f, at[k - 1], 11, 150);
        return (
          <div key={k} style={{ color: on ? color : dimColor, opacity: on ? 1 : 0.2, transform: `scale(${on ? 0.7 + 0.3 * p : 1})` }}>{k}</div>
        );
      })}
    </div>
  );
};

// ---------- Shots 1+2: chatvenster (loopt naadloos door) ----------
const Chat: React.FC<{ typedUntil: number; replyAt?: number; typing?: string }> = ({ typedUntil, replyAt, typing }) => {
  const f = useCurrentFrame();
  const q = 'Hoeveel R\'s zitten er in "strawberry"?';
  const typed = typedUntil <= 8 ? q : q.slice(0, Math.floor(interpolate(f, [8, typedUntil], [0, q.length], clamp)));
  const rp = replyAt != null ? pop(f, replyAt, 11, 110) : 0;
  const tp = typing != null ? typing : "";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 940, background: C.panel, borderRadius: 40, border: "2px solid #26305a", overflow: "hidden" }}>
        <div style={{ padding: "24px 40px", borderBottom: "2px solid #26305a", fontFamily: SANS, color: C.dim, fontSize: 36, fontWeight: 700 }}>● AI-chat</div>
        <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 36, minHeight: 640 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: 760, background: C.blue, color: "#06122a", fontFamily: SANS, fontWeight: 600, fontSize: 50, lineHeight: 1.3, padding: "24px 32px", borderRadius: "34px 34px 8px 34px", minHeight: 80 }}>
            {typed}
            {typedUntil > 8 && f < typedUntil + 6 && Math.floor(f / 9) % 2 === 0 ? "▍" : ""}
          </div>
          {replyAt != null && f >= replyAt && (
            <div style={{ alignSelf: "flex-start", background: "#222b4d", color: C.red, fontFamily: SANS, fontWeight: 900, fontSize: 260, padding: "0 80px", borderRadius: "34px 34px 34px 8px", transform: `scale(${0.4 + 0.6 * rp})`, transformOrigin: "left bottom", opacity: Math.min(1, rp * 2) }}>2</div>
          )}
          {tp && (
            <div style={{ alignSelf: "flex-start", background: "#222b4d", color: C.text, fontFamily: MONO, fontWeight: 700, fontSize: 64, padding: "22px 34px", borderRadius: "34px 34px 34px 8px", letterSpacing: 4 }}>
              {tp}
              {Math.floor(f / 9) % 2 === 0 ? "▍" : ""}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
const S1: React.FC = () => <Chat typedUntil={62} />;
const S2: React.FC = () => <Chat typedUntil={0} replyAt={22} />;

// ---------- Shot 3: woord, drie R's ----------
const S3: React.FC = () => {
  const f = useCurrentFrame();
  const hits = [30, 62, 94];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ marginTop: -120 }}>
        <Letters
          size={138}
          w={92}
          color={C.ink}
          highlight={(i) => { const ri = R_IDX.indexOf(i); return ri >= 0 && f >= hits[ri]; }}
          style={(i) => {
            const ri = R_IDX.indexOf(i);
            if (ri < 0 || f < hits[ri]) return {};
            return { transform: `scale(${1 + 0.3 * Math.sin(pop(f, hits[ri], 12, 140) * Math.PI)})` };
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 1010 }}>
        <Counter n={3} at={hits} color={C.red} dimColor={C.ink} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Shot 4: oog, doorgestreept ----------
const S4: React.FC = () => {
  const f = useCurrentFrame();
  const s = pop(f, 4, 14, 90);
  const look = Math.sin(f / 22) * 26;
  const slash = interpolate(f, [60, 84], [0, 1], { ...clamp, easing: outCubic });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="800" height="440" viewBox="0 0 760 420" style={{ transform: `scale(${s})` }}>
        <path d="M30 210 Q380 -60 730 210 Q380 480 30 210 Z" fill="#fff" stroke="#fff" strokeWidth="10" />
        <circle cx={380 + look} cy="210" r="110" fill={C.blue} />
        <circle cx={380 + look} cy="210" r="52" fill="#0b1020" />
        <circle cx={350 + look} cy="180" r="18" fill="#fff" />
        <line x1="80" y1="400" x2={80 + 600 * slash} y2={400 - 400 * slash} stroke={C.red} strokeWidth="38" strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Shot 5: het woord wordt in stukjes gesneden ----------
const TOKENS = [
  { t: "str", n: "496", c: C.blue },
  { t: "aw", n: "675", c: C.yellow },
  { t: "berry", n: "15717", c: C.green },
];
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = [38, 66];
  const split = cuts.filter((c) => f >= c).length;
  const gap = (k: number) => (f >= cuts[k] ? 34 * pop(f, cuts[k], 13, 130) : 0);
  const pieces = [WORD.slice(0, 3), WORD.slice(3, 5), WORD.slice(5)];
  const col = [C.blue, C.yellow, C.green];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 130, color: "#fff" }}>
        {pieces.map((p, i) => (
          <div key={i} style={{ marginLeft: i === 0 ? 0 : gap(i - 1), padding: "4px 8px", border: `5px solid ${split > 0 ? col[i] : "transparent"}`, borderRadius: 16, color: split > 0 ? col[i] : "#fff" }}>
            {p}
          </div>
        ))}
      </div>
      {cuts.map((c, k) => (
        <div key={k} style={{ position: "absolute", left: 540 + (k === 0 ? -180 : 30), top: 640, height: 340, width: 8, background: "#fff", opacity: interpolate(f, [c - 4, c, c + 8], [0, 1, 0], clamp) }} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- Shot 6: blokjes worden getallen, uitzoomen naar de stroom ----------
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const settle = [36, 54, 72];
  const roll = (k: number) => {
    if (f >= settle[k]) return TOKENS[k].n;
    const len = TOKENS[k].n.length;
    return Array.from({ length: len }, (_, i) => Math.floor(rnd(Math.floor(f / 2) * 7 + i * 13 + k * 31) * 10)).join("");
  };
  const zo = interpolate(f, [120, 210], [0, 1], { ...clamp, easing: inOut });
  const cells = Array.from({ length: 12 * 7 }, (_, i) => ({ r: Math.floor(i / 7), c: i % 7 }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: zo, transform: `translateY(${-(f * 1.4) % 160}px) scale(${1 + 0.0 * zo})` }}>
        {cells.map((cl, i) => (
          <div key={i} style={{ position: "absolute", left: cl.c * 170 - 60, top: cl.r * 160 - 40, width: 150, padding: "10px 0", textAlign: "center", fontFamily: MONO, fontSize: 52, fontWeight: 700, color: "#fff", opacity: 0.28, border: "3px solid rgba(255,255,255,0.35)", borderRadius: 12 }}>
            {Math.floor(rnd(i + 5) * 30000)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 24, fontFamily: MONO, fontWeight: 700, fontSize: 108, transform: `scale(${1 - 0.1 * zo})` }}>
        {TOKENS.map((tk, k) => (
          <div key={k} style={{ background: tk.c, color: "#06122a", padding: "18px 26px", borderRadius: 20, transform: `scale(${f >= settle[k] ? 1 + 0.1 * Math.sin(pop(f, settle[k], 12, 140) * Math.PI) : 1})`, boxShadow: "0 0 0 8px rgba(0,0,0,0.45)" }}>
            {roll(k)}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(f, [150, 180], [0, 1], clamp) }}>
        <div style={{ background: "rgba(8,14,40,0.85)", color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 36, padding: "16px 30px", borderRadius: 18, maxWidth: 860, textAlign: "center", lineHeight: 1.3 }}>Voorbeeld. De opsplitsing en de getallen verschillen per model.</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Shot 7: de aardbei met vraagteken ----------
const S7: React.FC = () => {
  const f = useCurrentFrame();
  const p = pop(f, 6, 13, 90);
  const qp = pop(f, 70, 10, 120);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${p}) rotate(${Math.sin(f / 22) * 2.5}deg)`, position: "relative" }}>
        <Strawberry size={640} />
        {f >= 70 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 520, color: "#fff", transform: `scale(${qp})`, opacity: Math.min(1, qp * 2), textShadow: "0 10px 60px rgba(0,0,0,0.45)" }}>?</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Shot 8: splitscreen jij vs model ----------
const S8: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 26], [-1200, 0], { ...clamp, easing: outCubic });
  const b = interpolate(f, [22, 50], [1200, 0], { ...clamp, easing: outCubic });
  const tp = pop(f, 80, 13, 100);
  const tag: React.CSSProperties = { fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 8, textTransform: "uppercase" };
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 130, height: 760, background: C.navy, transform: `translateX(${a}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
        <div style={{ ...tag, color: C.dim }}>jij</div>
        <Letters size={104} w={90} color={C.text} highlight={(i) => R_IDX.includes(i) && f > 56} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 890, height: 760, background: C.red, transform: `translateX(${b}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ ...tag, color: "rgba(255,255,255,0.85)" }}>model</div>
        <div style={{ transform: `scale(${f >= 80 ? 0.4 + 0.6 * tp : 0})` }}>
          <Strawberry size={340} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 876, height: 28, background: "#fff", opacity: f > 28 ? 1 : 0 }} />
    </AbsoluteFill>
  );
};

// ---------- Shot 9: het model schrijft het woord uit ----------
const S9: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [30, 130], [0, WORD.length], clamp));
  const out = WORD.slice(0, n).split("").join("-");
  return <Chat typedUntil={0} typing={out || "…"} />;
};

// ---------- Shot 10: letter voor letter, R's krijgen een vinkje ----------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const W = 96;
  const t0 = 12;
  const step = 11;
  const checks = [140, 160, 180];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ marginTop: -120, display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 130 }}>
        {WORD.split("").map((ch, i) => {
          const at = t0 + i * step;
          const ri = R_IDX.indexOf(i);
          const checked = ri >= 0 && f >= checks[ri];
          const sc = checked ? 1 + 0.25 * Math.sin(pop(f, checks[ri], 12, 140) * Math.PI) : 1;
          const p = pop(f, at, 14, 140);
          return (
            <div key={i} style={{ width: W, textAlign: "center", position: "relative", opacity: f >= at ? 1 : 0, transform: `translateY(${(1 - p) * 60}px) scale(${sc})`, color: checked ? C.red : C.ink }}>
              {ch}
              {checked && <div style={{ position: "absolute", left: 0, right: 0, top: -110, fontSize: 90, color: "#12a36b", fontFamily: SANS }}>✓</div>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1010 }}>
        <Counter n={3} at={checks} color="#12a36b" dimColor={C.ink} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Shot 11: de bril ----------
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [4, 50], [1, 0], { ...clamp, easing: outCubic });
  const letters = ["s", "t", "r", "a", "w", "b", "e", "r", "r", "y"];
  const drift = interpolate(f, [60, 130], [0, 1], { ...clamp, easing: inOut });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="900" height="400" viewBox="0 0 900 400">
        {[260, 640].map((cx) => (
          <circle key={cx} cx={cx} cy="200" r="150" fill="rgba(90,169,255,0.15)" stroke={C.blue} strokeWidth="14" strokeDasharray="950" strokeDashoffset={950 * draw} />
        ))}
        <path d="M410 190 Q450 150 490 190" stroke={C.blue} strokeWidth="14" fill="none" strokeDasharray="120" strokeDashoffset={120 * draw} />
        <line x1="110" y1="190" x2="20" y2="150" stroke={C.blue} strokeWidth="14" strokeDasharray="110" strokeDashoffset={110 * draw} />
        <line x1="790" y1="190" x2="880" y2="150" stroke={C.blue} strokeWidth="14" strokeDasharray="110" strokeDashoffset={110 * draw} />
        {letters.map((l, i) => {
          const left = i < 5;
          const baseX = left ? 130 + i * 56 : 530 + (i - 5) * 56;
          const x = baseX + (left ? -1 : 1) * drift * (60 + i * 12);
          const y = 225 + Math.sin((f + i * 9) / 14) * 8 + drift * (rnd(i + 2) - 0.5) * 120;
          return <text key={i} x={x} y={y} fontFamily={MONO} fontWeight="700" fontSize="80" fill={C.dim} opacity={1 - drift * 0.65}>{l}</text>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Shot 12: harde cut op de 3 ----------
const S12: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 800, color: C.green, marginTop: 110 }}>3</div>
  </AbsoluteFill>
);

// ---------- Montage: tijdvakken volgen het script (0-5, 5-14, 14-28, 28-42, 42-54, 54-60) ----------
const SHOTS: ShotDef[] = [
  // 0-5 s  hook
  { dur: 2.5, bg: "navy", tex: TEX.grain, noOut: true, push: 1.02, comp: S1 },
  { dur: 2.5, bg: "navy", tex: TEX.grain, noIn: true, push: 1.04, comp: S2 },
  // 5-14 s  antwoord is drie
  { dur: 4.5, bg: "yellow", tex: TEX.bark, comp: S3 },
  { dur: 4.5, bg: "blue", tex: TEX.stone, comp: S4 },
  // 14-28 s  tokens
  { dur: 4, bg: "navy", tex: TEX.brick, comp: S5 },
  { dur: 10, bg: "blue", tex: TEX.stone, push: 1.0, comp: S6 },
  // 28-42 s  de aardbei
  { dur: 7, bg: "yellow", tex: TEX.brickWide, push: 1.12, comp: S7 },
  { dur: 7, bg: "navy", tex: TEX.grain, comp: S8 },
  // 42-54 s  uitschrijven
  { dur: 5, bg: "navy", tex: TEX.brick, comp: S9 },
  { dur: 7, bg: "white", tex: TEX.brickWide, comp: S10 },
  // 54-60 s  de bril + slot
  { dur: 5.4, bg: "navy", tex: TEX.stone, push: 1.1, noOut: true, comp: S11 },
  { dur: 0.6, bg: "black", tex: null, noIn: true, noOut: true, push: 1, comp: S12 },
];
const frames = SHOTS.map((s) => Math.round(s.dur * FPS));
export const TOTAL_FRAMES = frames.reduce((a, b) => a + b, 0);

export const Short: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("audio/music.wav")} />
      {SHOTS.map((def, i) => {
        const from = at;
        at += frames[i];
        return (
          <Sequence key={i} from={from} durationInFrames={frames[i]}>
            <Shot def={def} frames={frames[i]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
