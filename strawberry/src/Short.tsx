import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";

const FPS = 30;
const C = {
  bg: "#0b1020",
  panel: "#161d34",
  text: "#f3f5fb",
  dim: "#8b93ad",
  red: "#ff4d5e",
  green: "#3ddc97",
  yellow: "#ffd166",
  blue: "#5aa9ff",
};
const SANS = "Inter, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Courier New', monospace";

// Scene starts in seconds (volgt de tijden uit het script)
const STARTS = [0, 5.6, 14, 28, 42, 54];
const END = 60;
export const TOTAL_FRAMES = END * FPS;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

// ---------- Captions (zinsniveau, tijd verdeeld over de echte audioduur) ----------
const AUDIO_OFFSET = 0.3;
const SCENES: { sentences: string[]; audioDur: number }[] = [
  { sentences: ["Een AI die een examen haalt,", "maar niet kan tellen hoeveel R's er in 'strawberry' zitten.", "Hoe kan dat?"], audioDur: 5.02 },
  { sentences: ["Het antwoord is drie.", "Dat zie jij in één seconde.", "Maar het model ziet dit woord helemaal niet zoals jij."], audioDur: 5.36 },
  { sentences: ["Een taalmodel leest geen letters.", "Voordat het je tekst ziet, wordt die in stukjes gehakt, tokens.", "'Strawberry' wordt bijvoorbeeld 'str', 'aw' en 'berry'.", "En elk stukje wordt een getal."], audioDur: 9.42 },
  { sentences: ["Het is alsof ik jou vraag hoeveel R's er in dit plaatje zitten.", "Je ziet geen letters, je ziet één ding.", "Zo ziet het model het hele woord."], audioDur: 7.07 },
  { sentences: ["Hoe krijgt hij het dan soms toch goed?", "Omdat hij het woord kan uitschrijven, letter voor letter,", "en dan wel kan tellen."], audioDur: 6.05 },
  { sentences: ["Dus dit is geen domheid.", "Het model kijkt gewoon door een bril waar letters niet in passen."], audioDur: 4.59 },
];

const Caption: React.FC<{ scene: number }> = ({ scene }) => {
  const f = useCurrentFrame();
  const { sentences, audioDur } = SCENES[scene];
  const total = sentences.reduce((a, s) => a + s.length, 0);
  let t = AUDIO_OFFSET * FPS;
  const dur = audioDur * FPS;
  let shown: string | null = null;
  for (const s of sentences) {
    const d = (s.length / total) * dur;
    if (f >= t && f < t + d) shown = s;
    t += d;
  }
  if (!shown) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1500, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.62)",
          color: C.text,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.25,
          textAlign: "center",
          padding: "18px 30px",
          borderRadius: 24,
        }}
      >
        {shown}
      </div>
    </div>
  );
};

// ---------- Kleine bouwstenen ----------
const Strawberry: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
    <path d="M100 40 C 40 30, 8 80, 22 130 C 36 185, 80 220, 100 222 C 120 220, 164 185, 178 130 C 192 80, 160 30, 100 40 Z" fill={C.red} />
    {[
      [60, 85], [100, 80], [140, 85], [45, 120], [82, 118], [118, 118], [155, 120],
      [62, 155], [100, 152], [138, 155], [80, 187], [120, 187], [100, 205],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="5" ry="8" fill={C.yellow} transform={`rotate(-10 ${x} ${y})`} />
    ))}
    <path d="M100 48 C 80 20, 50 22, 40 36 C 62 38, 76 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 120 20, 150 22, 160 36 C 138 38, 124 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 92 28, 96 12, 100 6 C 104 12, 108 28, 100 48 Z" fill="#2fb87a" />
  </svg>
);

const Title: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.dim }) => (
  <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 44, letterSpacing: 4, color, textTransform: "uppercase" }}>
    {children}
  </div>
);

const Scene: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const start = Math.round(STARTS[index] * FPS);
  const end = Math.round((STARTS[index + 1] ?? END) * FPS);
  return (
    <Sequence from={start} durationInFrames={end - start}>
      <AbsoluteFill>
        {children}
        <Caption scene={index} />
      </AbsoluteFill>
    </Sequence>
  );
};

// ---------- Scene 1: chatvenster ----------
const Scene1 = () => {
  const f = useCurrentFrame();
  const q = 'Hoeveel R\'s zitten er in "strawberry"?';
  const typed = q.slice(0, Math.floor(interpolate(f, [15, 80], [0, q.length], clamp)));
  const replyIn = spring({ frame: f - 108, fps: FPS, config: { damping: 12, stiffness: 140 } });
  const showReply = f >= 108;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 70, right: 70, top: 380, bottom: 520, background: C.panel, borderRadius: 40, border: "2px solid #26305a", overflow: "hidden" }}>
        <div style={{ padding: "26px 40px", borderBottom: "2px solid #26305a", fontFamily: SANS, color: C.dim, fontSize: 38, fontWeight: 700, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: C.green }} /> AI-chat
        </div>
        <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: 780, background: C.blue, color: "#06122a", fontFamily: SANS, fontWeight: 600, fontSize: 52, lineHeight: 1.3, padding: "26px 34px", borderRadius: "34px 34px 8px 34px", minHeight: 80 }}>
            {typed}
            {f < 90 && Math.floor(f / 8) % 2 === 0 ? "▍" : ""}
          </div>
          {showReply && (
            <div style={{ alignSelf: "flex-start", background: "#222b4d", color: C.text, fontFamily: SANS, fontWeight: 800, fontSize: 170, padding: "10px 70px", borderRadius: "34px 34px 34px 8px", transform: `scale(${0.4 + 0.6 * replyIn})`, transformOrigin: "left bottom", opacity: replyIn }}>
              2
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 2: het woord, drie R's ----------
const WORD = "strawberry";
const R_IDX = [2, 7, 8];
const Scene2 = () => {
  const f = useCurrentFrame();
  const hits = [45, 80, 115];
  const count = hits.filter((h) => f >= h).length;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 138 }}>
        {WORD.split("").map((ch, i) => {
          const ri = R_IDX.indexOf(i);
          const on = ri >= 0 && f >= hits[ri];
          const pop = ri >= 0 ? spring({ frame: f - hits[ri], fps: FPS, config: { damping: 10, stiffness: 200 } }) : 0;
          return (
            <span key={i} style={{ width: 92, textAlign: "center", color: on ? C.red : C.text, display: "inline-block", transform: on ? `scale(${1 + 0.35 * Math.sin(pop * Math.PI)})` : undefined, textShadow: on ? `0 0 40px ${C.red}` : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 90, fontFamily: SANS, fontWeight: 800, fontSize: 300, color: count === 3 ? C.green : C.dim, minHeight: 330 }}>{count > 0 ? count : ""}</div>
    </AbsoluteFill>
  );
};

// ---------- Scene 3: tokens ----------
const TOKENS = [
  { t: "str", n: "496", c: C.blue },
  { t: "aw", n: "675", c: C.yellow },
  { t: "berry", n: "15717", c: C.green },
];
const Scene3 = () => {
  const f = useCurrentFrame();
  const split = interpolate(f, [150, 195], [0, 1], { ...clamp, easing: ease });
  const flipAt = [300, 330, 360];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Title>Wat het model ziet</Title>
      <div style={{ display: "flex", gap: 8 + split * 24, alignItems: "center" }}>
        {TOKENS.map((tk, i) => {
          const flipped = f >= flipAt[i];
          const k = spring({ frame: f - flipAt[i], fps: FPS, config: { damping: 14, stiffness: 180 } });
          const showBox = split > 0.02;
          return (
            <div
              key={i}
              style={{
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 100,
                padding: showBox ? "20px 22px" : "20px 0",
                borderRadius: 18,
                color: flipped ? "#06122a" : showBox ? tk.c : C.text,
                background: flipped ? tk.c : showBox ? "transparent" : "transparent",
                border: showBox ? `4px solid ${tk.c}` : "4px solid transparent",
                transform: `translateY(${showBox ? split * 0 : 0}px) scale(${flipped ? 0.9 + 0.1 * k : 1})`,
                minWidth: flipped ? 0 : undefined,
              }}
            >
              {flipped ? tk.n : tk.t}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1180, left: 80, right: 80, textAlign: "center", fontFamily: SANS, fontSize: 38, color: C.dim, lineHeight: 1.35, opacity: interpolate(f, [150, 190], [0, 1], clamp) }}>
        Voorbeeld. De echte opsplitsing en de getallen verschillen per model.
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 4: de aardbei ----------
const Scene4 = () => {
  const f = useCurrentFrame();
  const inS = spring({ frame: f - 10, fps: FPS, config: { damping: 12, stiffness: 90 } });
  const qIn = spring({ frame: f - 150, fps: FPS, config: { damping: 8, stiffness: 120 } });
  const wob = Math.sin(f / 10) * 2;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Title>Hoeveel R's zitten hierin?</Title>
      <div style={{ transform: `scale(${inS}) rotate(${wob}deg)`, position: "relative" }}>
        <Strawberry size={620} />
        {f >= 150 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 520, color: "#fff", opacity: 0.95, transform: `scale(${qIn})`, textShadow: "0 10px 60px rgba(0,0,0,0.6)" }}>
            ?
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 5: letter voor letter ----------
const Scene5 = () => {
  const f = useCurrentFrame();
  const START = 190;
  const ritem = (i: number) => START + i * 9;
  const checks = [310, 325, 340];
  const count = checks.filter((c) => f >= c).length;
  const preOpacity = interpolate(f, [0, 20, 150, 180], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 90, color: C.text, opacity: preOpacity }}>
        Soms gaat het wél goed
      </div>
      <div style={{ display: "flex", gap: 8, fontFamily: MONO, fontWeight: 700, fontSize: 112 }}>
        {WORD.split("").map((ch, i) => {
          const vis = f >= ritem(i);
          const p = spring({ frame: f - ritem(i), fps: FPS, config: { damping: 14, stiffness: 220 } });
          const ri = R_IDX.indexOf(i);
          const checked = ri >= 0 && f >= checks[ri];
          return (
            <div key={i} style={{ width: 92, textAlign: "center", position: "relative", opacity: vis ? 1 : 0, transform: `translateY(${(1 - p) * 40}px)`, color: checked ? C.red : C.text }}>
              {ch}
              {checked && (
                <div style={{ position: "absolute", left: 0, right: 0, top: -90, fontSize: 80, color: C.green, fontFamily: SANS }}>✓</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 120, fontFamily: SANS, fontWeight: 800, fontSize: 220, color: count === 3 ? C.green : C.dim, minHeight: 250, opacity: f >= 310 ? 1 : 0 }}>{count}</div>
    </AbsoluteFill>
  );
};

// ---------- Scene 6: de bril ----------
const Scene6 = () => {
  const f = useCurrentFrame();
  const cutAt = Math.round((59.4 - STARTS[5]) * FPS);
  if (f >= cutAt) {
    return (
      <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 700, color: C.green }}>3</div>
      </AbsoluteFill>
    );
  }
  const inK = spring({ frame: f - 5, fps: FPS, config: { damping: 14, stiffness: 100 } });
  const letters = ["s", "t", "r", "a", "w", "b", "e", "r", "r", "y"];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${inK})`, position: "relative", width: 900, height: 400 }}>
        <svg width="900" height="400" viewBox="0 0 900 400">
          <circle cx="260" cy="200" r="150" fill="rgba(90,169,255,0.12)" stroke={C.blue} strokeWidth="14" />
          <circle cx="640" cy="200" r="150" fill="rgba(90,169,255,0.12)" stroke={C.blue} strokeWidth="14" />
          <path d="M410 190 Q450 150 490 190" stroke={C.blue} strokeWidth="14" fill="none" />
          <line x1="110" y1="190" x2="20" y2="150" stroke={C.blue} strokeWidth="14" />
          <line x1="790" y1="190" x2="880" y2="150" stroke={C.blue} strokeWidth="14" />
        </svg>
        {letters.slice(0, 5).map((l, i) => {
          const t = (f * 0.8 + i * 30) % 120;
          return (
            <div key={i} style={{ position: "absolute", left: 140 + i * 56, top: 150 + Math.sin((f + i * 20) / 12) * 14, fontFamily: MONO, fontWeight: 700, fontSize: 80, color: C.dim, opacity: 0.9 - t / 200 }}>
              {l}
            </div>
          );
        })}
        {letters.slice(5).map((l, i) => (
          <div key={i} style={{ position: "absolute", left: 530 + i * 56, top: 150 + Math.cos((f + i * 20) / 12) * 14, fontFamily: MONO, fontWeight: 700, fontSize: 80, color: C.dim }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 80, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.text, textAlign: "center", padding: "0 80px", lineHeight: 1.25, opacity: interpolate(f, [30, 60], [0, 1], clamp) }}>
        Geen domheid.<br />
        <span style={{ color: C.blue }}>Een bril waar letters niet in passen.</span>
      </div>
    </AbsoluteFill>
  );
};

export const Short: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Audio src={staticFile("audio/voiceover.wav")} />
    <Scene index={0}><Scene1 /></Scene>
    <Scene index={1}><Scene2 /></Scene>
    <Scene index={2}><Scene3 /></Scene>
    <Scene index={3}><Scene4 /></Scene>
    <Scene index={4}><Scene5 /></Scene>
    <Scene index={5}><Scene6 /></Scene>
  </AbsoluteFill>
);
