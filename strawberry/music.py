"""Rustige ambient tune (60s): zacht pad + sparse piano-achtige noten + lichte reverb. Zelf gesynthetiseerd."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve, butter, lfilter

SR = 44100
DUR = 60.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

# Am9 - Fmaj7 - Cmaj7 - G6, elk akkoord 7.5 s (8 akkoorden = 60 s)
chords = [
    [45, 57, 60, 64, 71],  # Am9
    [41, 57, 60, 64, 69],  # Fmaj7
    [48, 55, 59, 64, 67],  # Cmaj7
    [43, 55, 59, 62, 64],  # G6
] * 2
CH = DUR / len(chords)

pad = np.zeros(N)
for i, ch in enumerate(chords):
    s0, s1 = i * CH - 1.5, (i + 1) * CH + 1.5          # overlappen voor zachte overgang
    env = np.clip(np.minimum((t - s0) / 2.2, (s1 - t) / 2.2), 0, 1) ** 1.5
    for m in ch:
        for det in (-0.07, 0.0, 0.07):                   # lichte detune = warm koor
            f = hz(m) * 2 ** (det / 12)
            w = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
            pad += env * w * (0.5 if m < 50 else 0.3)
lfo = 0.85 + 0.15 * np.sin(2 * np.pi * t / 9.0)
pad *= lfo
b, a = butter(2, 1800 / (SR / 2))                       # donker houden
pad = lfilter(b, a, pad)

# Zachte pianopuntjes: pentatonisch (A mineur), niet strak op de maat
scale = [69, 72, 74, 76, 79, 81, 84]
notes = np.zeros(N)
step = 0.75
for k in range(int(DUR / step)):
    if rng.random() < 0.45:
        continue
    st = k * step + rng.uniform(-0.03, 0.03)
    m = scale[int(rng.integers(0, len(scale)))] - (12 if rng.random() < 0.3 else 0)
    i0 = int(st * SR)
    L = int(2.8 * SR)
    if i0 + L >= N: continue
    tt = np.arange(L) / SR
    f = hz(m)
    tone = np.sin(2 * np.pi * f * tt) * np.exp(-2.2 * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-4 * tt)
    tone *= np.minimum(tt / 0.006, 1)
    notes[i0:i0 + L] += tone * rng.uniform(0.5, 1.0)

mix = pad / np.max(np.abs(pad)) * 0.8 + notes / max(np.max(np.abs(notes)), 1e-9) * 0.28

# Reverb: ruis met exponentiele uitsterving
rl = int(2.6 * SR)
ir = rng.standard_normal(rl) * np.exp(-3.2 * np.arange(rl) / SR)
ir = lfilter(*butter(2, 4500 / (SR / 2)), ir)
wet = fftconvolve(mix, ir)[:N]
wet /= np.max(np.abs(wet))
out = mix * 0.65 + wet * 0.55

# Fade-in; eindigt voor de harde cut op 59.4 s
out *= np.clip(t / 2.5, 0, 1)
out *= np.clip((59.2 - t) / 1.2, 0, 1)
out /= np.max(np.abs(out))
out *= 0.5
wavfile.write("public/audio/music_raw.wav", SR, (out * 32767).astype(np.int16))
