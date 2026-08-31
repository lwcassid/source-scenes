/* ============================================================
   AUDIO IN — a scene can react to a live audio signal (mic/line-in)
   instead of, or alongside, hand input and its own sound (grill-me
   session, Cell Front V4 is the first scene to use it).

   Same split as MIDI-in (ADR-0006): this is a real-time signal, so it is
   captured and analyzed in the SHOW window only — the control window has
   no picture of its own to drive (ADR-0007), only a device picker and a
   status readout, relayed the same way midi:devices already works. Works
   identically in the plain browser (there is only one window there).

   Capture is CONNECT-once, then continuous for the whole show, same as
   MIDI — not gated to whichever scene happens to be open, so switching
   between an audio-reactive scene and a hand-driven one never has a
   reconnect beat.

   Chrome's default getUserMedia audio constraints apply voice-call-style
   processing (echo cancellation, noise suppression, auto-gain) tuned for
   speech, not music — left on, a quiet passage gets gated to silence and a
   loud one gets flattened. All three are explicitly disabled below.

   inp.audio (built in part5_tail.js's frame(), same place inp.L/inp.R are
   built) is a small fixed object, not raw FFT bins — level/bass/mid/treble
   are engine-smoothed (fast attack, slower release) before a scene ever
   sees them; onset stays a sharp, un-smoothed pulse for hit-timing; pan is
   the stereo balance, recomputed fresh every frame, needing no calibration
   of its own. ============================================================ */
const AUDIOIN = {
  ctx: null, stream: null, srcNode: null, splitter: null,
  analyserMono: null, analyserL: null, analyserR: null,
  freqBuf: null, timeBufL: null, timeBufR: null,

  devices: [],            // [{id, label}] — needs one granted stream before labels are visible
  device: null,            // {id, label} — persisted pick, same shape as NAV.dev
  connected: false, denied: false,

  // the public signal — part5_tail.js's frame() reads these straight into inp.audio
  level: 0, bass: 0, mid: 0, treble: 0, onset: 0, pan: 0,
  // NEW BANDS (audio-sensitivity round). Same 0..1 contract, same AGC as the
  // three originals; added because 20-250Hz merged the kick fundamental with
  // the whole bassline and 250-2000Hz caught every stab, pad and snare body.
  // sub/lowmid are ADDITIVE — no existing scene reads them, and the three
  // public names above keep their meaning so all 15 audioIn scenes still run.
  sub: 0, lowmid: 0,
  // live — THE ENGINE'S OWN ANSWER to "is there a real source on this input
  // right now", true/false, and the field a scene should arbitrate audio vs
  // hands on. It is the silence gate AND the dynamic-range confidence (see
  // CONF_* below) together, which is strictly more than any 0..1 band can
  // say: `level` is AGC-normalized, so once the gate is open it necessarily
  // sits near the middle of its range whether the source is a mastered track
  // or a room. Every shipped audioIn scene still tests `level > 0.05`, which
  // is why the confidence factor multiplies the public values too — a scene
  // that has not migrated still goes quiet on room noise. New scenes should
  // read inp.audio.live.
  live: false,
  // db  — RAW band level in dBFS, uncalibrated and un-normalized. This is the
  //       diagnostic channel: SHOW CHECK / the monitor / a harness can say
  //       "the input is -35 dBFS" instead of guessing from a 0..1 number that
  //       the AGC has already re-scaled. Never gated, never smoothed by the
  //       AGC; it is what the analyser actually measured this frame.
  //       ONE UNIT, ALL SIX ROWS (repair round): db.level is broadband RMS in
  //       dBFS, and each band is the TOTAL POWER IN THAT BAND expressed in the
  //       same dBFS, so the six numbers are directly comparable and the bands
  //       sum to roughly the level. They previously carried mean power PER FFT
  //       BIN, which is what the AGC eats internally — structurally 5-23 dB
  //       lower for a wide band, so a perfectly staged feed printed MID -56
  //       and TREBLE -83 in a column whose legend called anything under -60
  //       "nearly nothing". See BIN_DB / FFT_REF_DB below.
  // dev  — how far each band sits from its OWN ~1.5s moving mean, remapped to
  //       0..1 CENTRED ON 0.5. 0.5 = "doing what it has been doing"; >0.5 =
  //       louder than its recent self; <0.5 = quieter. This is the channel a
  //       scene wants when it means "the bass just came in", because the AGC
  //       makes absolute level meaningless across a set.
  // flux — POSITIVE RISE ONLY, 0..1: how fast the band is climbing right now.
  //       A sustained loud band has zero flux; only a fresh transient spikes.
  //       (SRC-43.7/.8 computed |dBand|/dt scene-side off values that were
  //       pinned, so their derivative was ~0 — this gives them a real one.)
  db: { level: -140, bass: -140, mid: -140, treble: -140, sub: -140, lowmid: -140 },
  dev: { bass: 0.5, mid: 0.5, treble: 0.5 },
  flux: { bass: 0, mid: 0, treble: 0 },
  // A rising-edge counter, not just the raw `onset` value above — the Audio
  // in monitor panel's flash dot in the control window only ever sees this
  // through telemetry:tick's 4Hz sampling, and a single onset pulse can
  // decay in ~150ms, well under that period. Sampling the raw value risks
  // aliasing straight past a real hit; a monotonic count survives it — any
  // change between two samples means at least one hit happened in between,
  // regardless of exactly when.
  onsetCount: 0, _pulseWasHigh: false,
  // KICK (Nima, Cell Front V11 round): a second, TIME-DOMAIN detector that
  // runs beside `onset`, never instead of it. onset is the byte-FFT bass-band
  // rise polled once per frame — measured at ~60ms median on a synthetic
  // 128 BPM techno bed (tools/kicktest.mjs), with the 16th-note bassline
  // false-triggering it. This one low-passes the input at 150Hz (hats and
  // snare top gone), scans EVERY sample the analyser ring holds since the
  // last frame (gap-free, so a frame hitch loses nothing), runs a 3ms/100ms
  // power envelope against a 60ms/400ms lagging reference, and fires on the
  // rising edge when the envelope exceeds K× the reference. A sustained bass
  // note lets the reference catch up (no fire); a new bass note is a slower
  // edge than a kick; a layered kick+bass only adds. Harness: ~5ms median,
  // 0 misses. `t` is the SAMPLE-ACCURATE AudioContext time of the hit, so a
  // scene can back-date its response by the hit's true age; `n` is a
  // monotonic counter (compare to detect a new hit, never truthiness).
  kick: { t: -1, strength: 0, n: 0 },
  kickBpm: 0,
  _kLastCt: 0, _kEnv: 0, _kRef: 0, _kPrev: 0, _kGap: 1e9, _kSeeded: false, _kConnectT: 0, _kIoi: [], _kFiredThisTick: false,
  // BUILD/DROP — the STRUCTURAL listener, Layer 6 (Lance, DJ-set round).
  // Everything above answers "what is the music doing this frame"; a DJ set
  // also has 8-30s SHAPE, and scenes stake whole mode changes on it (Event
  // Horizon's stargate, Chladni's unlock). See _structTick() below.
  //   build — 0..1, integrates over seconds: bass sitting well below its own
  //     ~22s baseline while broadband energy holds or the top end stays busy.
  //     A two-bar fill cannot fake it; a real 8-bar build reads ~0.5+.
  //   drop  — an EVENT, same contract as `kick`: {t, strength, n}, a new drop
  //     is `n` CHANGING (never truthiness). Fires when the bass RE-ENTERS
  //     hard over its section norm, confirmed by the time-domain kick, with
  //     structure behind it (a tracked build, or >5s of real suppression).
  //     Refractory 8s. Conservative on purpose — a false drop that opens a
  //     scene's break in a quiet room is far worse than a missed one.
  build: 0,
  drop: { t: -1, strength: 0, n: 0 },
  _st: { levF: 0, levS: 0, bassF: 0, bassS: 0, hiF: 0, trend: 0, supp: 0, suppT: 0, dropGap: 1e9, primed: false },

  /* ============================================================
     THE BAND ENGINE — five layers, all measured against the real material
     (Leila.mp3, 7:45 of 128-ish BPM techno/house: peak 0.00 dBFS, RMS
     -11.0 dBFS). Harness: tools/bandtest.mjs, which plays that file through
     THIS code path at three input stagings and scores the distributions.

     WHY IT WAS REWRITTEN. The old path was getByteFrequencyData() (which maps
     dB into 0..255 across Chrome's UNSET minDecibels/maxDecibels defaults,
     -100..-30 dBFS) -> arithmetic mean of BYTES over the bin range -> a
     self-widening norm() whose `hi` only ever rose and was persisted forever.
     Measured baseline on the real track, 30s after a 15s settle:

       gain   signal   p5     p50    p95    spread  >0.95
       0 dB   bass     0.631  0.880  0.938  0.307   1.1%
       0 dB   mid      0.546  0.676  0.814  0.269   0.0%
      -24 dB  bass     0.417  0.787  0.887  0.469   0.0%
      +12 dB  bass     0.933  0.967  0.997  ~0.06   61.5%   <- the ceiling

     Two separate faults, and the LOUDER one is not the famous one:
      (a) CEILING. Above ~+10dB of staging over this file, every bin in the
          bass band returns a literal 255 and the band pins. Real: a hot
          line-in or an app-audio tap at show volume gets there easily.
      (b) COMPRESSION, which is what actually broke the instrument at normal
          level: spread 0.27-0.41 against a required 0.55, and a max
          percentile drift of 0.21-0.23 between the three stagings — i.e.
          essentially NO gain invariance. norm()'s `lo` pinned at 0.000 on
          the silent frames between _wire() and the first audio, so the range
          was anchored to a floor the music never visits again.

     PASS CRITERIA this rework is built to (tools/bandtest.mjs enforces them
     at GAIN 0 / -12 / -24 dB, 30s measured after a 15s settle):
       * each of level/bass/mid/treble < 5% of frames above 0.95
       * ...and < 5% of frames below 0.02
       * p95 - p5 >= 0.55
       * max percentile drift between the three stagings <= 0.10
     FINAL MEASURED RESULT — same harness, same excerpt (START 90s,
     DURATION 45s, SETTLE 15s => 30s measured), Aug 2026. ALL PASS:

       gain    signal   p5     p50    p95    spread  >0.95  <0.02
        0 dB   level    0.122  0.600  0.893  0.771   0.9%   0.6%
       (-11.4  bass     0.103  0.697  0.897  0.793   0.3%   1.1%
        dBFS   mid      0.108  0.546  0.893  0.785   1.8%   1.7%
         in)   treble   0.109  0.575  0.892  0.783   0.6%   2.9%
      -12 dB   level    0.116  0.592  0.887  0.771   0.8%   0.6%
       (-23.2  bass     0.101  0.684  0.894  0.793   0.3%   1.3%
        dBFS   mid      0.103  0.521  0.885  0.782   1.6%   1.6%
         in)   treble   0.106  0.581  0.892  0.786   1.2%   3.2%
      -24 dB   level    0.117  0.591  0.889  0.771   1.3%   0.8%
       (-35.4  bass     0.104  0.690  0.894  0.790   0.9%   1.2%
        dBFS   mid      0.104  0.523  0.890  0.786   0.7%   1.9%
         in)   treble   0.115  0.580  0.892  0.777   0.2%   2.6%

     Cross-staging drift (bandtest --compare across those three): level 0.023
     · bass 0.014 · mid 0.032 · treble 0.011 · sub 0.020 · lowmid 0.018,
     against a 0.10 tolerance — down from 0.213 / 0.216 / 0.234 on the old
     engine. That number, not the spread, is the one that says the AGC is
     doing its job rather than the range happening to suit one input level.
     Spread went 0.27-0.47 -> 0.77-0.79; sub and lowmid (advisory) pass too.

     Two stagings well outside the graded three, as ceiling/floor proof:
       +12 dB in (0.6 dBFS RMS — the staging where the OLD engine pinned
         bass above 0.95 for 61.5% of frames): bass p50 0.692, >0.95 0.6%,
         spread 0.795. Indistinguishable from unity. The ceiling is gone.
       -36 dB in (-47.2 dBFS RMS, a very quiet feed): still PASS, slightly
         compressed at the top (p95 ~0.82) as the band SNR runs out.

     REPAIR ROUND (adversarial review of the above). Four defects, all on the
     QUIET side the rework opened up, plus one unit bug in the readout:
       * SET REST taken over a live source permanently killed the engine and
         persisted — now REFUSED (REST_MAX_DB) and double-bounded
         (REST_GATE_CEIL_DB), and SHOW CHECK no longer offers it as a fix.
         Measured: pressing SET REST 20s into Leila used to take bass p50
         0.738 -> 0.000; it now leaves cal.rest null and the bands untouched.
       * A DJ pulling the low end re-ranged the bass onto its own residue —
         now the per-band COLLAPSE gate. Measured over an 80s bass pull:
         bass was 0.74 -> 0.50 with 79% of frames over 0.3; it is now 0.000
         for the first ~40s (the hold, then the fast re-range) and back in
         range after, since a pull that long is a new section, not a fill.
       * Room noise scored as well as the music — now the dynamic-range
         CONFIDENCE. Measured on pink noise at -45 dBFS with a +-5 dB wander:
         every band was spread 0.75-0.77 (music: 0.79) and is now 0.000 on
         100% of frames, which also restores the `level > 0.05` liveness test
         the 16 shipped audioIn scenes arbitrate hands-vs-audio on.
       * db.* published mean power PER BIN under a legend written for
         broadband, so a perfect feed printed MID -56 / TREBLE -83 and read
         as a dead input. Now total band power in the same dBFS as db.level
         (bass -22 / mid -32 / treble -45 on this track, against level -16).
     Re-measured after all four, same harness and excerpt: PASS at 0 / -12 /
     -24 dB with spread 0.776-0.797 and cross-staging drift 0.014-0.027, i.e.
     the tuning above is intact — the repairs only bite on material the
     criteria never covered.

     MUST-NOT-REGRESS, tools/kicktest.mjs (128 BPM synthetic bed, 43 kicks):
       AUDIOIN.kick, back-dated ("exact")  before 42/43 matched, 1 miss,
         0 FP, 31.2ms median  ->  after 42/43, 1 miss, 0 FP, 28.3-39.8ms
         across three runs. The time-domain _kickScan() is untouched by this
         rework and the numbers confirm it.
       AUDIOIN.onset  before 30 matched / 13 miss / 40 FP  ->  after 29 / 14
         / 26 at a comparable harness frame rate: same recall, a third fewer
         false positives. NOTE both onset columns are POLL-limited — this
         Mac's headless Chrome runs the harness rAF at 28-51ms, not 16.7ms,
         and onset's matched/miss counts track that number far more strongly
         than they track any constant here (rAF 36.9ms -> 29 matched, rAF
         50.8ms -> 12, same build). Compare onset runs only at similar rAF.
     ============================================================ */

  // Layer 3 state — the rolling-percentile AGC, one tracker per SIGNAL
  // (the five bands plus `level`). floor/ceil are in TILTED dB (see TILT),
  // db is the smoothed tilted dB the public value is derived from.
  // Persisted (srcAudioInCal2) purely as a WARM START so the first seconds of
  // a show are already in range; it re-converges in a few seconds either way,
  // which is the whole point of replacing a peak-hold with a percentile.
  cal: {
    lo: { level: 0, bass: 0, mid: 0, treble: 0, sub: 0, lowmid: 0 },   // dB, ~5th pct
    hi: { level: 0, bass: 0, mid: 0, treble: 0, sub: 0, lowmid: 0 },   // dB, ~95th pct
    rest: null,             // {level, bass, ...} in RAW dBFS from SET REST; null until set
  },
  restSampling: false, restData: [], restTimer: null,

  // ---- band edges (Hz) --------------------------------------------------
  // Recut from the old bass 20-250 / mid 250-2000 / treble 2000-12000.
  // At 48kHz with fftSize 1024 a bin is 46.875Hz wide, so these are coarse by
  // construction; the bin selection below takes bins whose CENTRE falls in
  // [lo,hi), which (i) removes the old bass/mid and mid/treble bin OVERLAP
  // (the old floor()/ceil() pair shared bins 5-6 and 42-43) and (ii) always
  // drops bin 0, which is DC plus sub-24Hz rumble and never music.
  // treble reaching to 14k costs nothing now that band energy is a mean of
  // POWER rather than of bytes: dead bins above the MP3's lowpass divide the
  // mean by a constant the AGC removes, they do not average the hats away
  // the way a byte-mean did.
  BANDS: {
    // TUNED against Leila.mp3 (tools/bandtest.mjs), not left at the starting
    // point the brief proposed (sub 30-80 · mid 400-2500 · treble 4000-14000):
    //  * sub 30-80 resolved to a SINGLE bin at both 44.1k and 48k, and spent
    //    5.0% of frames under 0.02 at -12dB staging (the advisory budget is
    //    5%). 28-110 is two bins at both rates and drops that to ~2%.
    //  * treble 4000-14000 put p5 at 0.068 with 3.4% of frames under 0.02:
    //    above ~12kHz this material (a 120kbps MP3, measured HP12k residual
    //    -52.9dB) is dead air, and those bins only dilute. 3000-12000 also
    //    recovers the 2.5-4kHz octave where a lossy source keeps its hat and
    //    snare top. mid extends to 3000 so the two stay contiguous.
    sub:    [28, 110],      // kick fundamental only. 2 bins at 44.1k and 48k — advisory.
    bass:   [35, 160],      // kick + the bottom of the bassline. bins 1-3 at 48k.
    lowmid: [180, 400],     // bass NOTES and the body of toms/low stabs
    mid:    [400, 3000],    // stabs, chords, vocals, snare body
    treble: [3000, 12000],  // hats, air, the top of the snare
  },
  BANDKEYS: ['sub', 'bass', 'lowmid', 'mid', 'treble'],
  SIGKEYS: ['level', 'sub', 'bass', 'lowmid', 'mid', 'treble'],

  /* ---- Layer 2: PERCEPTUAL MAPPING (the pre-calibration default) --------
     A band's dB is the mean POWER per bin, so a wide band reads structurally
     quieter than a narrow one on any real (roughly pink) spectrum. TILT is
     the exact per-band offset that makes PINK NOISE read identical in every
     band: for power-per-Hz proportional to 1/f, the mean power per bin over
     [lo,hi) is proportional to ln(hi/lo)/(hi-lo), so
         TILT[b] = 10*log10( pinkMean(mid) / pinkMean(b) )
     with the mid band as the 0dB reference. Computed, not typed, so moving a
     band edge cannot silently un-balance the set. It works out to roughly
     sub -13.5 · bass -11.4 · lowmid -6.2 · mid 0 · treble +8.4 dB.

     TILT is NOT the sensitivity control — the AGC below removes any constant
     offset within seconds. What it buys is (i) a fresh laptop with no
     calibration reading sanely on frame 1 through the fixed PRE window, and
     (ii) the trackers starting close enough that convergence is short. */
  TILT: null,               // computed in _wire()
  PRE_LO_DB: -55,           // fixed pre-calibration window, TILTED dB. Seeds
  PRE_HI_DB: -5,            // floor/ceil before any real audio has arrived.

  /* ---- Layer 3 constants: the rolling-percentile AGC --------------------
     Replaces norm()'s one-way self-widening peak hold. Each signal tracks two
     STOCHASTIC QUANTILES of its own smoothed dB with the classic additive
     estimator: step toward x at rate*q when x is above the estimate and at
     rate*(1-q) when below, whose equilibrium IS the q-th percentile. The
     asymmetry is what makes it relax INWARD as well as outward — the failure
     mode norm() had (one drop poisons the rest of the show) is structurally
     impossible here, because the ceiling drifts back DOWN at AGC_RATE*(1-q).

     AGC_RATE 15 dB/s with q = 0.05/0.95 gives:
       floor rises / ceiling falls (re-tighten)  0.75 dB/s  -> ~13s per 10dB
       floor falls / ceiling rises (open up)    14.25 dB/s  -> ~instant
     i.e. a fast grab and a ~10s relax, which is the "12s window, tau~8s
     inward" the brief asked for expressed as a rate rather than a buffer. */
  AGC_RATE: 15,             // dB/s, base step of the quantile trackers
  AGC_Q_LO: 0.05,           // percentile the floor converges on
  AGC_Q_HI: 0.95,           // percentile the ceiling converges on
  // Fast-converge burst on first audio: 8x for ~2s, decaying to 1x by ~6s.
  // Without it the trackers need ~30s to walk in from the PRE window, which
  // is longer than a settle and much longer than an operator's patience.
  AGC_SEED_BOOST: 7, AGC_SEED_TAU: 2.0,
  // Output window. floor(p5) maps to OUT_LO, ceiling(p95) to OUT_HI. The
  // 0.10/0.90 inset is what buys the pass criteria their margin: only frames
  // beyond p95 by (0.05/0.80) of the span can exceed 0.95, and only frames
  // below p5 by (0.08/0.80) of the span can drop under 0.02 — measured ~2-3%
  // each on the real track, against a 5% budget. Widening this toward 0/1
  // trades that margin for contrast; that is the knob for "hotter".
  OUT_LO: 0.10, OUT_HI: 0.90,
  // Guard rails on the tracked span. MIN stops a genuinely steady signal
  // (a sine, a hum, a mastered-to-death loop) from being blown up into fake
  // motion; at 8dB a real 6dB-of-dynamics band still clears the 0.55 spread
  // requirement (6/8 * 0.80 = 0.60). MAX bounds one freak transient.
  MIN_SPAN_DB: 8, MAX_SPAN_DB: 60,

  /* ---- the absolute-silence gate ---------------------------------------
     An AGC with no gate turns a silent room into a full-scale light show.
     The gate rides the BROADBAND RMS in true dBFS (the time-domain path,
     which needs no window-scaling caveat), fades the public bands to 0 below
     it, and FREEZES the quantile trackers so silence never becomes the new
     normal. Leila at -24dB of staging is -35 dBFS in, so it sits wide open;
     a quiet room on a mic is typically -55..-70 dBFS.
     When SET REST has been taken, its measured level overrides these: open
     at rest+8dB, shut at rest+1dB, whichever is HIGHER. That is the real
     meaning of SET REST for a microphone, and it replaces the old
     _finishRest() which wrote post-normalization 0..1 values into a floor
     that norm() then compared against raw energy — two unit systems. */
  GATE_SHUT_DB: -72, GATE_OPEN_DB: -60, GATE_RATE: 3,
  _gate: 0,
  /* SET REST is only ever a SILENCE measurement, so a sample taken with the
     PA up is not a calibration, it is a mistake — and one the pre-flight used
     to hand an operator a button for. Taken during Leila-class program
     (-11 dBFS) it set gShut to -12.5, i.e. ABOVE the music, shut the gate,
     froze the trackers, persisted itself, and left SHOW CHECK printing
     "signal live" over a dead wall. Two independent guards now:
       REST_MAX_DB — a sample whose broadband median is louder than this is
         REFUSED outright (cal.rest is left alone and the button says so).
         -45 dBFS is well above any real room floor and ~34 dB under a staged
         feed, so it cannot reject a legitimate rest sample.
       REST_GATE_CEIL_DB — even an accepted sample can never raise the gate's
         open threshold past this, so no rest can shut the gate on a source
         that is above -48 dBFS. A guard on a guard, because this failure is
         silent, persistent, and reads green. */
  REST_MAX_DB: -45, REST_GATE_CEIL_DB: -48,

  /* ---- the per-band COLLAPSE gate --------------------------------------
     The silence gate above is broadband, and a DJ pulling the low end is not
     silence: measured, a 44 dB collapse in db.bass moved inp.audio.bass only
     0.74 -> 0.50, because the band's own quantile trackers happily re-ranged
     onto 60 dB of filter residue within ~30s. The wall kept pumping through
     the one moment the picture is supposed to say "the bass just left".

     It cannot be tested on the instantaneous band level: with ENV_RELEASE 9
     the bass envelope dives ~44 dB BETWEEN KICKS anyway (that is exactly why
     the tracked span on real techno is 43 dB). So the test rides a PEAK HOLD:
     a.pk follows the band up instantly and falls at PK_FALL dB/s, so a gap
     between kicks (~0.47s at 128 BPM) costs it ~3 dB while a band that is
     actually gone loses COLLAPSE_DB within a few seconds. Below
     (ceil - COLLAPSE_DB) the band fades out over COLLAPSE_FADE dB and its
     trackers freeze, so the ceiling is still there when the bass comes back
     and the band returns instantly rather than re-converging.

     COLLAPSE_HOLD is the escape hatch, and it is what keeps this from being a
     latch: a band that stays collapsed that long is not a breakdown any more,
     it is the new material (an ambient piece after a techno set), so the
     trackers are released and the band re-ranges onto it over the next ~30s
     exactly as it always did. 25s covers a 16-32 bar breakdown at any dance
     tempo — the window where "the bass left" is the picture's whole point. */
  PK_FALL: 6, COLLAPSE_DB: 24, COLLAPSE_FADE: 10, COLLAPSE_HOLD: 25,

  /* ---- DYNAMIC-RANGE CONFIDENCE (is this a source, or a room?) ----------
     An AGC's whole job is to make a quiet thing fill the range, so on its own
     it cannot tell -45 dBFS of camp noise from -45 dBFS of music: measured,
     pink noise with a +-5 dB wander produced band spreads of 0.75-0.77 and
     2.9 onsets/s against the real track's 0.77-0.79 and 2.3/s. Loudness
     cannot separate them either (their broadband p95s are both ~-41 dBFS).
     What DOES separate them is how much dB range the trackers had to learn:

       tracked span (ceil-floor), p50, measured    music (Leila)   pink noise
         level                                        21.0            10.9
         sub / bass                                45.8 / 43.7    14.7 / 14.0
         mid / treble                              18.9 / 30.4     9.9 /  9.3

     so the MAXIMUM span across the six signals is ~43-46 dB on music and
     ~15-16 dB on noise — a 3x gap, where the per-band spans overlap. Music
     earns it in the bass: a kick against the space between kicks is 40+ dB.
     conf ramps 0..1 across CONF_LO_DB..CONF_HI_DB of that maximum and
     multiplies the public values (and drives `live`), so room noise fades
     out for scenes that read `live` AND for the 16 that still test
     `level > 0.05`. The window sits far below any music measurement and far
     above the noise ones deliberately; this is a heuristic, and the honest
     statement of its limit is that a genuinely dynamic-less source (a sine,
     a steady hum, a heavily limited ambient bed at very low level) reads as
     a room. The dBFS column in the Audio in panel is the operator's check
     when it is wrong; RESET AUTO-RANGE re-learns on demand. */
  CONF_LO_DB: 18, CONF_HI_DB: 26, CONF_RATE: 3,
  _conf: 0,

  /* Bands read as mean power PER BIN internally (that is what TILT and the
     AGC are built on). The DIAGNOSTIC db.* is total band power instead, so
     all six rows share one unit: + 10log10(binCount) puts the bins back, and
     FFT_REF_DB converts an AnalyserNode magnitude sum into signal dBFS.
     Chrome (per spec) applies a Blackman window and divides by fftSize, so
     summing |X|^2 over the half-spectrum gives r^2 * mean(w^2) / 2 with
     mean(w^2) = a0^2 + a1^2/2 + a2^2/2 = 0.3046 for a0,a1,a2 = .42,.5,.08.
     Hence +10log10(2/0.3046) = 8.17 dB. MEASURED against white noise through
     this exact path: 8.169 dB. Display-only — nothing in the analysis reads
     it, so it cannot move a single graded number. */
  FFT_REF_DB: 10 * Math.log10(2 / (0.42 * 0.42 + 0.5 * 0.5 / 2 + 0.08 * 0.08 / 2)),
  _bindb: null,

  /* ---- the STALE-RANGE watchdog (Lance, DJ-set round) -------------------
     "Sometimes the levels die down and go flat and I have to reset
     auto-range." Root cause: the ceiling opens outward near-instantly but
     re-tightens at only 0.75 dB/s, so after a loud track a quieter one (or
     a gain change at the booth) reads low and flat for 30-60s. The
     watchdog is an automatic, scoped RESET: when the BROADBAND peak sits
     more than STALE_DB under level's learned ceiling for STALE_T seconds,
     every signal's trackers step STALE_BOOST x faster until the range fits
     the material again (~5s instead of ~45).
     THE BREAKDOWN GUARD is what makes this safe to automate: a DJ pulling
     the bass also drops the broadband level, but that is MUSIC — so the
     watchdog holds off whenever the bass band's own collapse gate says the
     bass has left (a.gate < 0.5). A quieter NEW track has kicks, so its
     bass band is present and the watchdog may fire; a breakdown keeps the
     stale clock paused and the "bass left" picture (and the build/drop
     detector's suppression measurement) intact. Trackers are already
     frozen through true silence by the gate, so a stopped set never
     triggers anything. tools/staletest.mjs drives both cases against the
     real engine. */
  // PK_FALL 6 dB/s, deliberately much faster than the ceiling's 0.75 dB/s
  // inward walk: the peak-hold must land on the NEW material's peaks within
  // ~2s so the gap against the stale ceiling actually opens (at 1 dB/s the
  // two decayed in lockstep and the watchdog could never fire — measured).
  // A 2-bar phrase gap only drops pk ~12 dB and any real peak snaps it back
  // instantly, so STALE_T of sustained gap still filters ordinary phrasing.
  STALE_DB: 8, STALE_T: 5, STALE_BOOST: 6, STALE_PK_FALL: 6,
  _stale: { pk: -140, t: 0, on: false },

  /* ---- dB-domain envelope ----------------------------------------------
     Smoothing moved from the 0..1 domain into the dB domain and got much
     faster on the way down. The old pair (attack 18/s, release 4/s = tau
     250ms) simply cannot fall between kicks at 128 BPM (469ms apart), which
     is why the meter read "pegged" even on frames where the FFT was nowhere
     near its ceiling. tau 111ms falls ~97% between two kicks, so bass
     ARTICULATES. Smoothing in dB (before the AGC map, not after) also means
     the tracked percentiles are the percentiles of exactly what a scene
     receives, so the pass criteria hold on the public value by construction.
     A scene that wants the old lazy feel should ease it itself — several
     already do (SRC-43.9+ ease the bands at ~1.5/s scene-side). */
  ENV_ATTACK: 40, ENV_RELEASE: 9,

  /* ---- Layer 5: deviation + flux ---------------------------------------
     DEV_TAU: the moving mean dev is measured against — 1.5s is about a bar
     of 4/4 at 160 BPM, long enough to be "what this section sounds like",
     short enough to follow an arrangement change.
     DEV_GAIN: how much of the 0..1 output a deviation uses. Measured: the
       bands now run p5 0.09 -> p95 0.89, so a normal excursion off the 1.5s
       mean is ~+-0.2 and the first-cut 2.2 drove dev hard into 0 and 1 (its
       histogram was two spikes at the ends). 1.1 puts that excursion at
       0.28..0.72 and keeps 0/1 for genuine section changes.
     FLUX_FULL: rise (in normalized units) per SECOND that reads 1.0.
       Measured on this track a kick takes the bass band ~0 -> ~0.8 in about
       50ms, i.e. ~16/s, so 14 saturates on a real kick and grades everything
       softer. It is deliberately computed off the SMOOTHED public band, not
       the raw one: at 46.9Hz bins and a 23ms window the un-smoothed band's
       frame-to-frame jitter is large enough that flux off it was just noise
       (p50 0.55, p95 1.0 for all three bands on the first cut).
     FLUX_DECAY: how fast the flux pulse falls once the rise stops, so a
     scene polling at 60fps sees a readable pulse instead of a 1-frame spike. */
  DEV_TAU: 1.5, DEV_GAIN: 1.1, FLUX_FULL: 14, FLUX_DECAY: 8,

  // per-signal AGC + envelope state, built in _wire()
  _ag: null,

  // onset/beat-detection state (Nima: techno/house needs real beat
  // detection, not a broadband-vs-slow-average threshold — see tick()).
  // ONSET_K   — how many times the recent-average rise a frame must beat.
  // ONSET_FLOOR — the absolute rise below which nothing counts, in the
  //   normalized 0..1 band. Re-derived for the de-clipped band: the same
  //   kick that moved the old byte-mean band by ~0.03 moves this one by
  //   ~0.25, so carrying 0.028 over would have made onset fire on the
  //   16th-note bassline. See tools/kicktest.mjs for the measurement.
  ONSET_K: 1.8, ONSET_FLOOR: 0.08,
  _onsetEnv: 0, _fluxSlow: 0, _onsetGap: 0, _fluxPrimed: false, _prevBassRaw: 0,

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('srcAudioInDev') || 'null');
      if (d) this.device = d;
    } catch (e) {}
    // KEY BUMPED srcAudioInCal -> srcAudioInCal2. The old key holds 0..1
    // self-widened ranges from the byte-FFT era — a saturated `hi` of 1.000
    // loaded into this engine would permanently flatten a correct signal, and
    // its `lo` of 0.000 is the exact stale-floor failure this rework removes.
    // Different units, different meaning: it must not be readable from here.
    try {
      const c = JSON.parse(localStorage.getItem('srcAudioInCal2') || 'null');
      if (c) { this.cal.lo = c.lo || this.cal.lo; this.cal.hi = c.hi || this.cal.hi; this.cal.rest = c.rest || null; }
    } catch (e) {}
  },
  save() {
    try { localStorage.setItem('srcAudioInDev', JSON.stringify(this.device)); } catch (e) {}
    try { localStorage.setItem('srcAudioInCal2', JSON.stringify(this.cal)); } catch (e) {}
  },
  _saveT: null,
  saveSoon() { if (!this._saveT) this._saveT = setTimeout(() => { this._saveT = null; this.save(); }, 1200); },

  // control window never opens a real stream (ADR-0006's precedent) — relay
  // the request, same shape as connectMidi().
  connect() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.requestAudioInConnect) window.electronAPI.requestAudioInConnect();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { this.denied = true; this.relayIfElectron(); return; }
    const constraints = {
      audio: {
        deviceId: this.device?.id ? { exact: this.device.id } : undefined,
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      this._wire(stream);
      // labels only appear on enumerateDevices() once a stream has been granted
      navigator.mediaDevices.enumerateDevices().then(list => {
        this.devices = list.filter(d => d.kind === 'audioinput').map(d => ({ id: d.deviceId, label: d.label || 'input' }));
        this.connected = true; this.denied = false;
        this.relayIfElectron();
      });
    }).catch(() => { this.connected = false; this.denied = true; this.relayIfElectron(); });
  },
  // "choose the output of any active app... as the audio input" — a running
  // app/window's own audio, picked through the OS's real picker
  // (ScreenCaptureKit on macOS via useSystemPicker, armed in electron/
  // main.js for exactly this one call), not a microphone. getDisplayMedia
  // requires requesting video by spec; the video track is stopped the
  // instant the stream arrives — nothing renders it, no reason to pay for
  // capturing a picture nobody looks at.
  captureAppAudio() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.requestAppAudioCapture) window.electronAPI.requestAppAudioCapture();
      // the OS picker is modal and can sit open for a while — say so instead
      // of the button looking like the click did nothing
      this._appAudioPending = true;
      if (typeof this.ui === 'function') this.ui();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) { this.denied = true; this.relayIfElectron(); return; }
    if (window.electronAPI?.armAppAudioPicker) window.electronAPI.armAppAudioPicker();
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(stream => {
      if (window.electronAPI?.appAudioPickDone) window.electronAPI.appAudioPickDone();
      stream.getVideoTracks().forEach(t => t.stop());
      const at = stream.getAudioTracks();
      if (!at.length) {
        // picked a source with no audio track (screen-share dialogs on some
        // platforms don't offer per-app audio, or the operator left "Share
        // Audio" unchecked) — say so rather than connecting to silence
        stream.getTracks().forEach(t => t.stop());
        this.connected = false; this.denied = true; this.relayIfElectron();
        return;
      }
      this.device = { id: 'app-audio', label: at[0].label || 'app audio' };
      this._wire(stream);
      this.devices = []; // this source isn't in enumerateDevices() — nothing to list
      this.connected = true; this.denied = false;
      this.relayIfElectron();
    }).catch(() => {
      // includes the operator just cancelling the picker — not worth a
      // scarier message than the plain CONNECT failure path already has
      if (window.electronAPI?.appAudioPickDone) window.electronAPI.appAudioPickDone();
      this.connected = false; this.denied = true; this.relayIfElectron();
    });
  },
  // control window: picking a device — relay it, the show window reconnects
  setDevice(id) {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.setAudioInDevice) window.electronAPI.setAudioInDevice(id);
      const opt = this.devices.find(d => d.id === id);
      this.device = id ? { id, label: opt ? opt.label : '' } : null;
      return;
    }
    const opt = this.devices.find(d => d.id === id);
    this.device = id ? { id, label: opt ? opt.label : '' } : null;
    this.save();
    this._teardown();
    this.connect();
  },
  _wire(stream) {
    this._teardown();
    this._testOverride = false; // a real device takes over from any setAudioIn() test values
    this.stream = stream;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.srcNode = this.ctx.createMediaStreamSource(stream);

    // mono-summed analyser for bass/mid/treble — forcing channelCount to 1
    // downmixes whatever the source carries (mono or stereo) so the band
    // split reflects L+R together, per the grilling decision.
    this.analyserMono = this.ctx.createAnalyser();
    // Nima: beat detection on techno/house was jittery — traced to the
    // AnalyserNode's own DEFAULT smoothingTimeConstant (0.8), an 80%-old/
    // 20%-new exponential blend the browser applies BEFORE we ever see a
    // byte of frequency data. That smears every kick's transient into mush
    // no matter how fast we poll it. Zero it out so getByteFrequencyData()
    // hands back the RAW current-frame spectrum — "as close to the metal
    // as possible" — and let our own attack/release envelopes (below, and
    // the flux detector) do 100% of the deliberate shaping instead of an
    // invisible browser default nobody chose. fftSize down from 2048 to
    // 1024 too: half the analysis window (~23ms vs ~46ms at 44.1kHz) for
    // tighter time resolution: bass/kick content only needs ~43Hz bins to
    // resolve, it never needed 2048's frequency precision. Kept at 1024 in
    // the sensitivity rework AFTER weighing the obvious alternative: 2048
    // would halve the bins to 23.4Hz and actually separate a 50Hz kick from
    // a 100Hz bass note, but it doubles the analysis window and this same
    // comment records that the window was deliberately halved FOR the onset
    // transient. Time resolution won; kick-vs-bassline separation is served
    // instead by the time-domain _kickScan() below, which needs no bins.
    this.analyserMono.fftSize = 1024;
    this.analyserMono.smoothingTimeConstant = 0;
    this.analyserMono.channelCount = 1;
    this.analyserMono.channelCountMode = 'explicit';
    // Layer 1: FLOAT FFT. getByteFrequencyData() quantises dB into 0..255
    // across minDecibels/maxDecibels — Chrome's unset defaults of -100/-30
    // dBFS, a ceiling a hot line-in walks straight through, and once a bin
    // returns a literal 255 the band has no articulation left at all.
    // getFloatFrequencyData() hands back dB per bin with no window and no
    // quantisation, so there is nothing left to clip against.
    this.freqBuf = new Float32Array(this.analyserMono.frequencyBinCount);
    this._fluxPrimed = false; this._fluxSlow = 0; this._onsetGap = 0; this._onsetEnv = 0; this._prevBassRaw = 0;

    // ---- band bin ranges + pink tilt, resolved once per connection -------
    // Bin i has centre frequency i*binHz; a band takes the bins whose CENTRE
    // lands in [lo,hi). Adjacent bands therefore share nothing (the old
    // floor(lo/binHz)..ceil(hi/binHz) pair double-counted the seam bins), and
    // i0 is floored at 1 so DC never enters any band.
    const binHz = this.ctx.sampleRate / this.analyserMono.fftSize;
    const N = this.freqBuf.length;
    this._bins = {}; this.TILT = {}; this._bindb = {};
    const pinkMean = (lo, hi) => Math.log(hi / lo) / (hi - lo);   // see TILT above
    const refPink = pinkMean(this.BANDS.mid[0], this.BANDS.mid[1]);
    for (const k of this.BANDKEYS) {
      const [lo, hi] = this.BANDS[k];
      let i0 = Math.max(1, Math.ceil(lo / binHz));
      let i1 = Math.min(N - 1, Math.ceil(hi / binHz) - 1);
      if (i1 < i0) i1 = i0;                       // a band narrower than one bin still gets one
      this._bins[k] = [i0, i1];
      this.TILT[k] = 10 * Math.log10(refPink / pinkMean(lo, hi));
      // per-bin mean power -> total band power in dBFS, for the db.* readout
      this._bindb[k] = 10 * Math.log10(i1 - i0 + 1) + this.FFT_REF_DB;
    }
    this.TILT.level = 0;                          // `level` is true broadband dBFS already
    this._bindb.level = 0;                        // ...and already a total, not a per-bin mean

    // ---- AGC + envelope state, one per signal ----------------------------
    // Seeded from the fixed PRE window (or a persisted warm start), NOT from
    // whatever silence happens to be on the wire at connect time — that
    // silence is exactly what pinned the old norm()'s floor to 0.000 in every
    // baseline run. `seeded` flips on the first ungated frame of real audio,
    // which is when the fast-converge burst starts counting.
    this._ag = {};
    for (const k of this.SIGKEYS) {
      const lo = isFinite(this.cal.lo[k]) && this.cal.hi[k] > this.cal.lo[k] ? this.cal.lo[k] : this.PRE_LO_DB;
      const hi = isFinite(this.cal.hi[k]) && this.cal.hi[k] > this.cal.lo[k] ? this.cal.hi[k] : this.PRE_HI_DB;
      this._ag[k] = { db: this.PRE_LO_DB, floor: lo, ceil: hi, age: 0, seeded: false, mean: 0.5, prevN: 0, pk: this.PRE_LO_DB, collapsed: 0 };
    }
    this._gate = 0; this._calSaveAcc = 0; this._conf = 0; this.live = false;
    this._rawDb = {};
    this._stale = { pk: -140, t: 0, on: false };

    // kick detector graph (see `kick` above): lowpass 150Hz → time-domain
    // analyser (8192 samples ≈ 170ms ring @48k — a frame stall analyses instead of dropping; smoothing 0 so the ring is
    // raw). An AnalyserNode is a valid sink — nothing connects onward.
    this.kickLP = this.ctx.createBiquadFilter();
    this.kickLP.type = 'lowpass'; this.kickLP.frequency.value = 150; this.kickLP.Q.value = 0.7071;
    this.kickAn = this.ctx.createAnalyser();
    this.kickAn.fftSize = 8192; this.kickAn.smoothingTimeConstant = 0;
    this.kickAn.channelCount = 1; this.kickAn.channelCountMode = 'explicit';
    this.kickBuf = new Float32Array(this.kickAn.fftSize);
    this.srcNode.connect(this.kickLP); this.kickLP.connect(this.kickAn);
    const SR = this.ctx.sampleRate, C = sec => 1 - Math.exp(-1 / (sec * SR));
    this._kCoef = { eA: C(0.003), eR: C(0.100), rA: C(0.060), rR: C(0.400), REFR: Math.round(0.090 * SR), K: 2.2, FLOOR2: 0.015 * 0.015 };
    this._kLastCt = this.ctx.currentTime; this._kEnv = 0; this._kRef = 0; this._kPrev = 0; this._kGap = 1e9;
    this._kSeeded = false; this._kConnectT = this.ctx.currentTime; this._kIoi = [];
    this.kick = { t: -1, strength: 0, n: this.kick ? this.kick.n : 0 };

    // a 2-channel split feeds two small time-domain analysers, used only to
    // compute per-channel RMS for stereo pan — not the band analysis above.
    this.splitter = this.ctx.createChannelSplitter(2);
    this.analyserL = this.ctx.createAnalyser(); this.analyserL.fftSize = 512;
    this.analyserR = this.ctx.createAnalyser(); this.analyserR.fftSize = 512;
    this.timeBufL = new Float32Array(this.analyserL.fftSize);
    this.timeBufR = new Float32Array(this.analyserR.fftSize);

    this.srcNode.connect(this.analyserMono);
    this.srcNode.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);
  },
  _teardown() {
    if (this.stream) { try { this.stream.getTracks().forEach(t => t.stop()); } catch (e) {} }
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} }
    this.stream = null; this.ctx = null; this.srcNode = null; this.splitter = null;
    this.analyserMono = this.analyserL = this.analyserR = null;
    this.kickLP = this.kickAn = null;
  },

  // Show window: run the analysis, called once per frame from part5_tail.js
  // regardless of which scene is open — the library wall's own ambient
  // step() calls read inp.audio too, so this stays live the whole show.
  _kickScan() {
    this._kFiredThisTick = false;
    if (!this.kickAn || !this.ctx) return;
    const c = this._kCoef, SR = this.ctx.sampleRate, ct = this.ctx.currentTime;
    let n = Math.round((ct - this._kLastCt) * SR); this._kLastCt = ct;
    if (n <= 0) return;
    const L = this.kickBuf.length, dropped = n > L;   // >170ms hitch: audio lost — analyse, don't fire
    if (dropped) n = L;
    this.kickAn.getFloatTimeDomainData(this.kickBuf);
    const armed = ct - this._kConnectT > 0.5;
    for (let i = L - n; i < L; i++) {
      const x = this.kickBuf[i], r = x * x;
      this._kEnv += (r - this._kEnv) * (r > this._kEnv ? c.eA : c.eR);
      this._kRef += (r - this._kRef) * (r > this._kRef ? c.rA : c.rR);
      if (!this._kSeeded) { this._kRef = this._kEnv; this._kSeeded = true; }
      this._kGap++;
      const rising = this._kEnv > this._kPrev; this._kPrev = this._kEnv;
      if (!dropped && armed && rising && this._kGap > c.REFR && this._kEnv > this._kRef * c.K + c.FLOOR2) {
        this._kGap = 0;
        const t = ct - (L - 1 - i) / SR;
        const strength = clamp(Math.log10(this._kEnv / (this._kRef + 1e-9)) / 1.2);
        this.kick = { t, strength, n: this.kick.n + 1 };
        this._kFiredThisTick = true;
        this._kIoi.push(t); if (this._kIoi.length > 8) this._kIoi.shift();
        if (this._kIoi.length >= 4) {
          const d = []; for (let j = 1; j < this._kIoi.length; j++) d.push(this._kIoi[j] - this._kIoi[j - 1]);
          d.sort((a, b) => a - b); const m = d[d.length >> 1];
          if (m > 0.25 && m < 1.2) this.kickBpm = Math.round(60 / m);
        }
      }
    }
  },
  /* ---- Layer 6: BUILD/DROP, the structural listener ---------------------
     Rides the AGC'd public bands, so it is gain-invariant by construction
     and costs six one-pole eases per frame. The heuristic is the one the
     drop-detection literature (ISMIR '14) and VJ practice agree on:
       build = bass suppressed against its own section norm x (energy
               holding/climbing OR a busy top end), integrated slowly;
       drop  = bass re-entry over the norm, on a kick, with either a tracked
               build or >5s of genuine suppression behind it.
     The slow baselines learn 4x slower while the bass is judged suppressed —
     the same freeze idea as the AGC's collapse gate — so a long breakdown
     erodes the section norm instead of erasing it, and the re-entry still
     has something to jump over. Latency is deliberately ~a beat: a scene
     paying off a drop one kick late reads as intentional; one paying off a
     fill as a drop reads as broken. */
  _structTick(dt) {
    const st = this._st;
    st.dropGap += dt;
    if (!this.live) {
      // no judged source: the shape decays, the baselines hold (silence must
      // not become the section norm, same rule as the frozen AGC trackers)
      this.build = Math.max(0, this.build - this.build * Math.min(1, dt * 0.6));
      st.supp = 0; st.suppT = 0;
      return;
    }
    const ez = (cur, target, tau) => cur + (target - cur) * Math.min(1, dt / tau);
    const hi = (this.mid + this.treble) * 0.5;
    if (!st.primed) {
      st.levF = st.levS = this.level; st.bassF = st.bassS = this.bass; st.hiF = hi;
      st.trend = 0; st.primed = true;
    }
    const levFPrev = st.levF;
    st.levF = ez(st.levF, this.level, 2.5);
    st.bassF = ez(st.bassF, this.bass, 2.0);
    st.hiF = ez(st.hiF, hi, 2.5);
    const hold = st.supp > 0.5 ? 4 : 1;          // breakdown: baselines 4x slower
    st.levS = ez(st.levS, st.levF, 22 * hold);
    st.bassS = ez(st.bassS, st.bassF, 22 * hold);
    st.trend = ez(st.trend, (st.levF - levFPrev) / Math.max(dt, 1e-3), 1.5);

    // suppression: how far the bass sits under its own section norm. The
    // 0.06 dead-zone is ~the AGC'd band's normal wobble on steady material.
    st.supp = ez(st.supp, clamp((st.bassS - st.bassF - 0.06) / 0.22), 0.8);
    if (st.supp > 0.45) st.suppT += dt; else st.suppT = Math.max(0, st.suppT - dt * 2);

    // BUILD — suppression x (energy holding/climbing OR busy top end).
    const energy = clamp(Math.max((st.levF - st.levS + 0.02) / 0.12, (st.trend / 0.04) * 0.6));
    const busyTop = clamp((st.hiF - st.levS * 0.7) / 0.25);
    const target = st.supp * Math.max(energy, busyTop);
    this.build += (target - this.build) * Math.min(1, dt * (target > this.build ? 0.35 : 0.5));

    // DROP — bass re-enters hard, on this tick's kick, with structure armed.
    const jump = this.bass - Math.max(st.bassF, st.bassS);
    const armed = this.build > 0.35 || st.suppT > 5;
    if (armed && st.dropGap > 8 && this._kFiredThisTick && jump > 0.18 && this.bass > 0.5) {
      const strength = clamp(0.35 + this.build * 0.5 + jump * 0.8);
      this.drop = { t: this.kick.t, strength, n: this.drop.n + 1 };
      st.dropGap = 0; st.suppT = 0;
      this.build = Math.min(this.build, 0.15);   // spent — must be re-earned
    }
  },

  tick(dt) {
    if (window.ELECTRON_ROLE === 'control') return;
    // Test hook active (setAudioIn, no real device wired) — leave whatever
    // it just set completely alone. Without this, this method's own
    // no-device branch below would decay/zero those values on the very next
    // animation frame, before a scene ever got to read them.
    if (this._testOverride) { this._pushHistory(dt); return; }
    if (!this.connected || !this.analyserMono) {
      // decay toward silence rather than freezing at the last reading — a
      // scene reading this after a mid-show disconnect should see the
      // signal actually die, not hang at whatever it last heard.
      const decay = Math.min(1, dt * 3);
      // db is the DIAGNOSTIC channel and the monitor prints it as a number, so
      // it has to die with the signal — left alone it would sit at the last
      // reading forever and the panel would claim "-11 dBFS" on a dead input,
      // which is exactly the kind of lie this readout exists to prevent.
      for (const k of this.SIGKEYS) { this[k] -= this[k] * decay; this.db[k] += (-140 - this.db[k]) * decay; }
      for (const k of ['bass', 'mid', 'treble']) {
        this.flux[k] -= this.flux[k] * decay;
        this.dev[k] += (0.5 - this.dev[k]) * decay;   // "no deviation" is 0.5, not 0
      }
      this.onset = 0;
      this.live = false; this._conf = 0;
      this.build = Math.max(0, this.build - this.build * decay);   // shape dies with the signal
      this._st.supp = 0; this._st.suppT = 0; this._st.dropGap += dt;
      this._pushHistory(dt);
      return;
    }

    this._kickScan();

    /* ---- Layer 1: float FFT -> mean POWER per bin -> dB per band --------
       Averaging POWER (not dB, and not bytes) is what makes a band's number
       mean "how much energy is in here"; a dB average would be a geometric
       mean and one dead bin would drag the whole band toward silence, which
       is precisely how the old byte-mean lost the hats when treble reached
       up to 12kHz on a 120kbps source. */
    this.analyserMono.getFloatFrequencyData(this.freqBuf);
    const bandDb = (k) => {
      const [i0, i1] = this._bins[k];
      let p = 0;
      for (let i = i0; i <= i1; i++) p += Math.pow(10, this.freqBuf[i] / 10);
      p /= (i1 - i0 + 1);
      return p > 0 ? Math.max(-140, 10 * Math.log10(p)) : -140;
    };

    this.analyserL.getFloatTimeDomainData(this.timeBufL);
    this.analyserR.getFloatTimeDomainData(this.timeBufR);
    const rms = buf => { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
    const rmsL = rms(this.timeBufL), rmsR = rms(this.timeBufR);
    this.pan = clamp((rmsR - rmsL) / Math.max(rmsR + rmsL, 1e-4), -1, 1);

    /* ---- Layer 4: `level` is now a dBFS measurement -----------------------
       Was (rmsL + rmsR) * 3, which saturated by its own route entirely
       independently of anything spectral: a mastered track's RMS is ~0.28, so
       levelRaw's measured p90 was 2.57 and its max 4.72 — the divisor norm()
       ended up using was one historical transient, and it swung 16x across
       input stagings (cal.hi.level 4.861 at 0dB vs 0.294 at -24dB). In dBFS
       through the same AGC as the bands, staging is just an offset the
       trackers absorb. */
    const rmsBoth = Math.sqrt((rmsL * rmsL + rmsR * rmsR) / 2);
    const levelDb = rmsBoth > 0 ? Math.max(-140, 20 * Math.log10(rmsBoth)) : -140;

    /* ---- the silence gate (see GATE_* above) ---------------------------- */
    let gShut = this.GATE_SHUT_DB, gOpen = this.GATE_OPEN_DB;
    if (this.cal.rest && isFinite(this.cal.rest.level)) {
      // ...but never past REST_GATE_CEIL_DB: _finishRest() already refuses a
      // sample taken over a live room, and this is the second guard, so that
      // no stored rest — including one persisted by an older build — can shut
      // the gate on a source that is genuinely present.
      gShut = Math.min(Math.max(gShut, this.cal.rest.level + 1), this.REST_GATE_CEIL_DB - 7);
      gOpen = Math.min(Math.max(gOpen, this.cal.rest.level + 8), this.REST_GATE_CEIL_DB);
    }
    const gateTarget = clamp((levelDb - gShut) / Math.max(gOpen - gShut, 1));
    this._gate += (gateTarget - this._gate) * Math.min(1, dt * this.GATE_RATE);
    const gate = this._gate, live = gate > 0.25;

    /* ---- Layers 2+3: tilt -> dB envelope -> percentile AGC -> 0..1 ------- */
    let maxSpan = 0;
    for (const k of this.SIGKEYS) {
      const a = this._ag[k];
      const raw = k === 'level' ? levelDb : bandDb(k);
      // the ANALYSIS unit (per-bin mean power for a band) stays exactly what
      // TILT, the AGC and cal.rest were built and measured on; only the
      // published diagnostic is converted to total band power. See _bindb.
      this._rawDb[k] = raw;
      this.db[k] = raw + this._bindb[k];
      const tilted = raw + this.TILT[k];

      // FIRST REAL AUDIO: jump the envelope and the window straight onto
      // what is actually arriving, then let the burst below tighten it.
      // Seeding from the SIGNAL rather than from connect-time silence is the
      // single thing the baseline pointed at hardest: the old norm() took its
      // floor from the handful of empty frames between _wire() and the first
      // sample, pinned cal.lo at 0.000 in all six baseline runs, and spent
      // the rest of the show anchored to a level the music never revisits.
      if (live && !a.seeded) {
        a.db = tilted;
        a.floor = tilted - this.MIN_SPAN_DB; a.ceil = tilted + this.MIN_SPAN_DB;
        a.pk = tilted;
        a.seeded = true; a.age = 0;
      }

      // dB-domain attack/release (ENV_ATTACK/ENV_RELEASE)
      const rate = tilted > a.db ? this.ENV_ATTACK : this.ENV_RELEASE;
      a.db += (tilted - a.db) * Math.min(1, dt * rate);

      // per-band collapse gate (see PK_FALL / COLLAPSE_DB). `level` is what
      // the broadband gate already watches, so it is exempt.
      a.pk = Math.max(a.db, a.pk - this.PK_FALL * dt);
      const bandGate = k === 'level' ? 1
        : clamp((a.pk - (a.ceil - this.COLLAPSE_DB)) / this.COLLAPSE_FADE);
      if (bandGate > 0.5) a.collapsed = 0; else a.collapsed += dt;
      a.gate = bandGate;   // stashed for the stale-range watchdog's breakdown guard

      // stochastic quantile trackers, frozen while the gate is shut so a
      // silent room can never become the new normal — and frozen per band
      // while that band is collapsed, so a breakdown cannot re-range the
      // bass onto its own filter residue.
      if (live && (bandGate > 0.5 || a.collapsed > this.COLLAPSE_HOLD)) {
        a.age += dt;
        const boost = 1 + this.AGC_SEED_BOOST * Math.exp(-a.age / this.AGC_SEED_TAU);
        // ...and once COLLAPSE_HOLD has expired on a band that is STILL
        // collapsed, re-range it 4x faster: at the normal 0.75 dB/s inward
        // rate a ceiling learned on a techno kick takes over a minute to walk
        // down onto an ambient bed, which is a dead bass band for a whole
        // intro. 3 dB/s makes that ~15s, and it can only apply while the band
        // is judged gone, so nothing playing normally ever sees it.
        const step = this.AGC_RATE * boost * dt * (a.collapsed > this.COLLAPSE_HOLD ? 4 : 1)
          * (this._stale.on ? this.STALE_BOOST : 1);   // the watchdog's automatic re-range
        a.floor += step * (a.db > a.floor ? this.AGC_Q_LO : -(1 - this.AGC_Q_LO));
        a.ceil += step * (a.db > a.ceil ? this.AGC_Q_HI : -(1 - this.AGC_Q_HI));
        // SET REST, used correctly at last: the measured noise floor is a
        // hard lower bound on where the AGC floor may sit, so room hiss never
        // gets stretched to fill the bottom of the range.
        if (this.cal.rest && isFinite(this.cal.rest[k])) {
          a.floor = Math.max(a.floor, this.cal.rest[k] + this.TILT[k] + 2);
        }
        if (a.ceil < a.floor + this.MIN_SPAN_DB) a.ceil = a.floor + this.MIN_SPAN_DB;
        if (a.ceil > a.floor + this.MAX_SPAN_DB) a.floor = a.ceil - this.MAX_SPAN_DB;
        this.cal.lo[k] = a.floor; this.cal.hi[k] = a.ceil;
      }

      const span = Math.max(a.ceil - a.floor, this.MIN_SPAN_DB);
      if (a.seeded && span > maxSpan) maxSpan = span;
      this[k] = clamp(this.OUT_LO + ((a.db - a.floor) / span) * (this.OUT_HI - this.OUT_LO)) * gate * bandGate;
    }

    /* ---- dynamic-range confidence (see CONF_* above) ---------------------
       One decision for the whole engine, off the WIDEST span any signal has
       learned — music earns it in the bass (43 dB), a room cannot (15 dB).
       Smoothed at CONF_RATE so it cannot flicker a scene in and out. */
    const confT = clamp((maxSpan - this.CONF_LO_DB) / Math.max(this.CONF_HI_DB - this.CONF_LO_DB, 1));
    this._conf += (confT - this._conf) * Math.min(1, dt * this.CONF_RATE);
    const conf = this._conf;
    for (const k of this.SIGKEYS) this[k] *= conf;
    this.live = gate > 0.25 && conf > 0.25;

    /* ---- the stale-range watchdog (see STALE_* above) --------------------
       Evaluated AFTER the loop, applied on the NEXT frame's steps — one
       frame of lag on a 5-second detector is nothing, and it keeps the
       loop free of order dependence. */
    {
      const agL = this._ag.level, stw = this._stale;
      stw.pk = Math.max(agL.db, stw.pk - this.STALE_PK_FALL * dt);
      const bassHere = !this._ag.bass || (this._ag.bass.gate === undefined || this._ag.bass.gate > 0.5);
      if (live && agL.seeded && bassHere && agL.ceil - stw.pk > this.STALE_DB) stw.t += dt;
      else stw.t = Math.max(0, stw.t - dt * 2);
      stw.on = stw.t > this.STALE_T;
    }

    /* ---- Layer 5: deviation + flux, on the three public bands ----------- */
    for (const k of ['bass', 'mid', 'treble']) {
      const a = this._ag[k];
      a.mean += (this[k] - a.mean) * Math.min(1, dt / this.DEV_TAU);
      this.dev[k] = clamp(0.5 + (this[k] - a.mean) * this.DEV_GAIN);
      const rise = Math.max(0, this[k] - a.prevN) / Math.max(dt, 1e-3);
      a.prevN = this[k];
      this.flux[k] = Math.max(clamp(rise / this.FLUX_FULL), this.flux[k] - dt * this.FLUX_DECAY);
    }

    this._structTick(dt);

    // SET REST samples RAW dBFS now, matching what the gate and the AGC floor
    // are actually expressed in (the old version median-ed the post-norm,
    // post-smooth 0..1 outputs into cal.lo, which norm() then compared
    // against raw energy — a latent unit bug that only stayed harmless
    // because cal.lo was already pinned at 0).
    if (this.restSampling) {
      // the INTERNAL per-bin dB, not the published db.* total — cal.rest is
      // consumed as an AGC floor bound and a gate threshold, both of which
      // live in the analysis unit.
      const r = {}; for (const k of this.SIGKEYS) r[k] = this._rawDb[k];
      this.restData.push(r);
    }

    // the AGC state is a live rolling thing, not a calibration; it is
    // persisted only as a warm start, so a lazy ~8s write is plenty.
    this._calSaveAcc += dt;
    if (this._calSaveAcc > 8) { this._calSaveAcc = 0; this.saveSoon(); }

    const bassRaw = this.bass;   // onset's input, below — see its own comment

    // onset: the bass band's own frame-to-frame RISE (positive part of its
    // derivative), not a broadband-level threshold. A sustained kick
    // pattern (or a driving bassline note) that keeps the bass band loud
    // and roughly CONSTANT produces near-zero rise, because nothing is
    // actually changing; only a fresh transient (a new kick hit) spikes it.
    // That's exactly what defeated the old broadband-vs-slow-average
    // approach on four-on-the-floor house/techno, where the bass band
    // rarely drops enough for a level threshold to "reset" between hits.
    // (Tried a full per-bin spectral-flux version first — summing each
    // bin's positive delta separately — but a kick's own pitch-sweep
    // artifact double-triggered as it crossed bin boundaries; the band's
    // single aggregate level is steadier and cheaper.)
    //
    // SENSITIVITY ROUND: its input changed from the byte-FFT band (a 0..1
    // byte mean) to this.bass — the AGC-normalized public bass band — which
    // is still 0..1 but now lives on a de-clipped, gain-invariant scale, so
    // the same relative threshold means the same thing at any input staging
    // (it did not before: the old absolute +0.028 floor was worth a
    // completely different number of dB at 0dB vs -24dB of gain).
    // It reads the SMOOTHED band deliberately. The un-smoothed one was tried
    // first and was worse on tools/kicktest.mjs (misses 17->28 across runs):
    // at 46.9Hz bins and a 23ms window its frame-to-frame jitter inflates
    // _fluxSlow, which raises the adaptive bar on real kicks while random
    // jitter spikes still cross it. The dB envelope's 25ms attack costs
    // ~10ms of edge — far under the 16.7ms floor a 60fps poll imposes anyway.
    // The floor below was re-derived against tools/kicktest.mjs, not carried
    // over — see the ONSET_FLOOR constant.
    if (this._fluxPrimed) {
      const rise = Math.max(0, bassRaw - this._prevBassRaw);
      // adaptive threshold: a fast-local mean of RECENT rises (~0.3s), so a
      // hot, driving set doesn't need re-calibrating by hand — the trigger
      // bar rises and falls with how spiky the material actually is.
      this._fluxSlow += (rise - this._fluxSlow) * Math.min(1, dt * 3.2);
      this._onsetGap += dt;
      // ~150ms refractory: comfortably clear of a single kick's own
      // transient (attack + short decay), still well under real dance-
      // music subdivision spacing (an eighth note at 180bpm is ~167ms).
      if (rise > this._fluxSlow * this.ONSET_K + this.ONSET_FLOOR && this._onsetGap > 0.15) {
        this._onsetEnv = 1;
        this._onsetGap = 0;
      }
      // the time-domain kick raises onset too (same envelope, same decay, same
      // refractory) — existing onset readers get the earlier edge for free.
      if (this._kFiredThisTick && this._onsetGap > 0.15) { this._onsetEnv = 1; this._onsetGap = 0; }
    } else {
      // first tick after connecting: seed the baseline, don't fire — every
      // reading looks like a "rise" off a zeroed start otherwise.
      this._fluxPrimed = true;
      this._fluxSlow = 0;
    }
    this._prevBassRaw = bassRaw;
    this._onsetEnv = Math.max(this._onsetEnv - dt * 7.5, 0);
    this.onset = this._onsetEnv;

    this._statusAcc = (this._statusAcc || 0) + dt;
    if (this._statusAcc > 1) { this._statusAcc = 0; this.relayIfElectron(); }
    this._pushHistory(dt);
  },
  // A rolling ~15s trace for the Audio in monitor panel (under the stage,
  // replaces THE RIG for scenes that declare audioIn) — throttled to ~10Hz,
  // plenty for a scrolling meter, cheap enough to keep running every frame
  // regardless of whether that panel is even open right now.
  history: [],
  _histAcc: 0,
  _pushHistory(dt) {
    // Rising-edge check runs every frame (not throttled below) — a pulse
    // that both rises and decays inside one 100ms history-push window would
    // otherwise never register at all.
    const hot = this.onset > 0.5;
    if (hot && !this._pulseWasHigh) this.onsetCount++;
    this._pulseWasHigh = hot;
    this._histAcc += dt;
    if (this._histAcc < 0.1) return;
    this._histAcc = 0;
    this.history.push({ p: performance.now(), level: this.level, bass: this.bass, mid: this.mid, treble: this.treble, onset: this.onset });
    if (this.history.length > 200) this.history.shift();
  },

  // SET REST — same shape and purpose as the hands' startRest(): sample
  // ~1.6s of true silence and use it to pull the self-widening floor down to
  // a deliberate reading instead of waiting for the show to organically
  // pass through a quiet moment.
  startRest() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.sendShowControl) window.electronAPI.sendShowControl('audioinRest');
      return;
    }
    if (this.restSampling || !this.connected) return;
    this.restRejected = null;
    this.restSampling = true;
    this.restData = [];
    clearTimeout(this.restTimer);
    this.restTimer = setTimeout(() => this._finishRest(), 1600);
  },
  _finishRest() {
    clearTimeout(this.restTimer);
    this.restSampling = false;
    if (this.restData.length < 4) return;
    const median = arr => { const s = [...arr].sort((a, b) => a - b); return s[s.length >> 1]; };
    // RAW dBFS per signal — the same unit the gate and the AGC floor speak.
    // tick() consumes this two ways: as the gate's shut/open thresholds
    // (rest+1 / rest+8 dB) and as a hard lower bound on each band's AGC
    // floor (rest + TILT + 2 dB), so a measured room floor is never stretched
    // up into fake motion. It deliberately does NOT move the floor DOWN.
    const rest = {};
    for (const k of this.SIGKEYS) rest[k] = median(this.restData.map(d => d[k]));
    this.restData = [];
    // REFUSE A SAMPLE THAT ISN'T SILENCE. cal.rest only ever makes the engine
    // DEAFER (both consumers are Math.max), it persists, and SHOW CHECK used
    // to offer SET REST as a one-click fix from a pre-flight modal — so the
    // easy mistake (press it during soundcheck, with the PA up) permanently
    // killed the instrument and then reported the row green. Measured before
    // this guard: bass p50 0.738 -> 0.000 with the same track still playing.
    // Nothing at -45 dBFS or louder is a room at rest.
    if (!isFinite(rest.level) || rest.level > this.REST_MAX_DB) {
      this.restRejected = rest.level;      // dBFS we heard; the UI prints it
      this.restRejectT = performance.now();
      if (typeof this.ui === 'function') this.ui();
      // the panel only re-renders on events, so schedule the clear rather
      // than leaving TOO LOUD on the button until something else redraws it
      clearTimeout(this._restRejT);
      this._restRejT = setTimeout(() => {
        this.restRejected = null;
        if (typeof this.ui === 'function') this.ui();
        this.relayIfElectron();
      }, 6000);
      this.relayIfElectron();
      return;
    }
    this.restRejected = null;
    this.cal.rest = rest;
    this.save();
    this.relayIfElectron();
  },
  // true for ~6s after a refused SET REST — long enough to read, short enough
  // that it never becomes the button's permanent state.
  restRejected: null, restRejectT: 0,
  restRejectFresh() { return this.restRejected !== null && performance.now() - this.restRejectT < 6000; },

  /* ---- RESET AUTO-RANGE — the AGC's counterpart to SET REST -------------
     SET REST teaches the engine where SILENCE is. This makes it forget
     everything it has learned about the MUSIC and relearn from what is
     playing right now: both quantile trackers go back to the fixed PRE
     window, unseeded, so the next ungated frame re-seeds them off the real
     signal and the ~2s convergence burst runs again.

     It exists because the AGC is stateful and persisted, so a range learned
     under the wrong conditions outlives the conditions. Real cases: the
     source was changed mid-show (mic -> app audio at a completely different
     staging), soundcheck ran at half volume, someone left SET REST pointed at
     a room that has since filled with people, or a warm start loaded from
     localStorage that no longer matches tonight's rig. The trackers DO relax
     inward on their own (that is the whole point of the percentile design),
     but at AGC_RATE*(1-q) = 0.75 dB/s a 30dB staging change takes ~40s to
     walk off, and an operator watching the wall not respond should not have
     to wait it out or guess whether it is converging.

     It clears the PERSISTED range too (srcAudioInCal2 is removed outright,
     not overwritten), because "reset" that a reload undoes is not a reset.
     The device pick lives under a different key and is deliberately kept —
     nobody pressing this wants to re-choose their interface. cal.rest goes
     with it: it is part of the learned picture, and its stale value is the
     one that hard-bounds the AGC floor. */
  calVersion: 0,
  resetRange() {
    if (window.ELECTRON_ROLE === 'control') {
      // same relay shape as SET REST — the show window owns the analysis, so
      // it owns the state being reset (ADR-0006). Rides the generic
      // show:control channel; no new Electron plumbing.
      if (window.electronAPI?.sendShowControl) window.electronAPI.sendShowControl('audioinResetRange');
      return;
    }
    const zero = () => { const o = {}; for (const k of this.SIGKEYS) o[k] = 0; return o; };
    // 0/0 is the "no warm start" sentinel _wire() and load() already test for
    // (they require hi > lo), NOT a meaningful dB pair — same as the literal
    // this object is declared with.
    this.cal.lo = zero(); this.cal.hi = zero(); this.cal.rest = null;
    if (this._ag) for (const k of this.SIGKEYS) {
      this._ag[k] = { db: this.PRE_LO_DB, floor: this.PRE_LO_DB, ceil: this.PRE_HI_DB, age: 0, seeded: false, mean: 0.5, prevN: 0, pk: this.PRE_LO_DB, collapsed: 0 };
    }
    // the confidence is a read of the range that just went away, so it goes
    // with it: it re-earns itself off the real signal within ~1s of re-seed.
    this._conf = 0; this.live = false; this.restRejected = null;
    // the derived channels are all measured against the range that just went
    // away, so they get cleared with it rather than spiking as it re-converges
    for (const k of ['bass', 'mid', 'treble']) { this.dev[k] = 0.5; this.flux[k] = 0; }
    this._fluxPrimed = false; this._fluxSlow = 0; this._onsetGap = 0; this._onsetEnv = 0; this._prevBassRaw = 0;
    this.onset = 0;
    // the structural listener's baselines were learned on the range that just
    // went away; drop.n stays monotonic (same rule as kick.n across _wire())
    this.build = 0;
    this._stale = { pk: -140, t: 0, on: false };
    this._st = { levF: 0, levS: 0, bassF: 0, bassS: 0, hiF: 0, trend: 0, supp: 0, suppT: 0, dropGap: 1e9, primed: false };
    // an in-flight SET REST would land its medians into the range we just
    // cleared, ~1.6s after the operator asked for the opposite
    this.restSampling = false; this.restData = []; clearTimeout(this.restTimer); this.restTimer = null;
    // kill the debounced write BEFORE removing the key, or the pending timer
    // puts the old cal straight back
    clearTimeout(this._saveT); this._saveT = null; this._calSaveAcc = 0;
    try { localStorage.removeItem('srcAudioInCal2'); } catch (e) {}
    this.calVersion++;
    this._flashReset();
    this.relayIfElectron();
  },
  // A reset is instantaneous and mostly invisible (the meters just start
  // moving differently), so the button says so for a beat. In the control
  // window this is driven by calVersion CHANGING on the relay, not by the
  // click — that way it confirms the show window actually did it.
  _flashReset() {
    this._resetFlash = true;
    if (typeof this.ui === 'function') this.ui();
    clearTimeout(this._resetFlashT);
    this._resetFlashT = setTimeout(() => { this._resetFlash = false; if (typeof this.ui === 'function') this.ui(); }, 1400);
  },

  // Re-read the input list without touching the stream. Labels need a grant
  // ONCE per origin, not once per session, so a machine that has connected
  // before shows every real device the moment the popover opens — the picker
  // used to stay stuck on DEFAULT until a connect happened. Keeps whatever
  // list a live app-audio capture set (that source is not enumerable).
  refreshDevices() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.requestAudioInDevices) window.electronAPI.requestAudioInDevices();
      return;
    }
    if (!navigator.mediaDevices?.enumerateDevices) return;
    if (this.connected && this.device?.id === 'app-audio') return;
    navigator.mediaDevices.enumerateDevices().then(list => {
      const devs = list.filter(d => d.kind === 'audioinput')
        .map(d => ({ id: d.deviceId, label: d.label || 'input' }));
      const sig = devs.map(d => d.id + d.label).join('|');
      if (sig === this._devSig) return;
      this._devSig = sig;
      this.devices = devs;
      this.relayIfElectron();
      if (typeof this.ui === 'function') this.ui();
    }).catch(() => {});
  },

  // Show window only: mirror device list + connection + a light status
  // picture to the control window, same combined shape as midi:devices.
  relayIfElectron() {
    if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendAudioInDevices) return;
    window.electronAPI.sendAudioInDevices({
      connected: this.connected, denied: this.denied,
      devices: this.devices, device: this.device,
      // calVersion is how the control window learns a RESET AUTO-RANGE it
      // requested actually landed — restSet flipping to false is not enough
      // on its own (it may already have been false).
      level: this.level, restSet: !!this.cal.rest, calVersion: this.calVersion,
      // the SIGNAL, not just the settings: SHOW CHECK used to read "connected
      // && cal.rest" as ok and printed "signal live" over a shut gate.
      live: this.live, levelDb: this.db.level, gate: this._gate,
      build: this.build,
      restRejected: this.restRejectFresh() ? this.restRejected : null,
    });
  },
};
AUDIOIN.load();
// hot-plugging an interface mid-show must not mean re-opening the app
if (navigator.mediaDevices?.addEventListener) {
  navigator.mediaDevices.addEventListener('devicechange', () => AUDIOIN.refreshDevices());
}
window.AUDIOIN = AUDIOIN;

// Control window: relayed picture of the show window's real state — never
// local, same split as midiRelay.
const audioInRelay = { connected: false, denied: false, devices: [], device: null, level: 0, restSet: false, calVersion: 0, live: false, levelDb: -140, gate: 0, restRejected: null };
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onAudioInDevices) {
  window.electronAPI.onAudioInDevices(st => {
    const hadVer = audioInRelay.calVersion;
    Object.assign(audioInRelay, st);
    AUDIOIN._appAudioPending = false;
    // the show window bumped calVersion, i.e. the RESET AUTO-RANGE this
    // window relayed really happened over there — confirm it on the button.
    if (st && typeof st.calVersion === 'number' && st.calVersion !== hadVer) AUDIOIN._flashReset();
    if (typeof AUDIOIN.ui === 'function') AUDIOIN.ui();
  });
}
// Show window: run the real connect/device-pick when the console asks.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioInConnectRequested) {
  window.electronAPI.onAudioInConnectRequested(() => AUDIOIN.connect());
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioInDevicesRequested) {
  window.electronAPI.onAudioInDevicesRequested(() => AUDIOIN.refreshDevices());
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioInSetDeviceRequested) {
  window.electronAPI.onAudioInSetDeviceRequested(id => AUDIOIN.setDevice(id));
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAppAudioCaptureRequested) {
  window.electronAPI.onAppAudioCaptureRequested(() => AUDIOIN.captureAppAudio());
}

// Test hook, mirroring setChan(): playtest.js/shotcam.mjs have no real mic
// in a sandbox — this lets them drive an audio-reactive scene deterministically
// for the idle/minimal/full screenshot states every other scene already gets.
function setAudioIn(vals) {
  if (!vals) return;
  Object.assign(AUDIOIN, vals);
  // The sensitivity round added sub/lowmid/db/dev/flux. A caller that only
  // sets the five original fields (tools/shotaudio.mjs, tools/playtest.js —
  // both documented as "mirrors setChan") must not leave a scene reading a
  // stale flux from three states ago, so derive the new fields from the ones
  // that WERE set, only where the caller didn't set them itself.
  const a = AUDIOIN;
  if (vals.sub === undefined && vals.bass !== undefined) a.sub = a.bass;
  if (vals.lowmid === undefined && vals.bass !== undefined && vals.mid !== undefined) a.lowmid = (a.bass + a.mid) / 2;
  for (const k of ['bass', 'mid', 'treble']) {
    if (!vals.dev || vals.dev[k] === undefined) a.dev[k] = 0.5;              // "as it has been"
    if (!vals.flux || vals.flux[k] === undefined) a.flux[k] = clamp(a.onset || 0);  // a hit IS a rise
    if (!vals.db || vals.db[k] === undefined) a.db[k] = -70 + 55 * clamp(a[k] || 0);
  }
  if (!vals.db || vals.db.level === undefined) a.db.level = -60 + 50 * clamp(a.level || 0);
  // `live` is the engine's own gate+confidence judgement, which no test hook
  // can compute — a caller driving values IS the source, so derive it from
  // the values it set (and let an explicit vals.live win).
  if (vals.live === undefined) a.live = clamp(a.level || 0) > 0.02 || clamp(a.onset || 0) > 0.3;
  // `build` is slow state the structural listener owns on the real path; a
  // test caller that doesn't set it must not leave a scene reading the build
  // from three states ago (same rule as flux above). `drop` is left alone —
  // its n must stay monotonic, and setAudioDrop() is the hook that fires it.
  if (vals.build === undefined) a.build = 0;
  AUDIOIN.connected = true;
  AUDIOIN._testOverride = true;
}
window.setAudioIn = setAudioIn;
// Kick test hook: a single hit, `strength` 0..1. Bumps `n` so scenes see a
// NEW hit; `t` is on the perf clock (no ctx), which scenes treat as age 0.
function setAudioKick(strength) {
  setAudioIn({ kick: { t: performance.now() / 1000, strength: clamp(strength === undefined ? 0.8 : strength), n: (AUDIOIN.kick ? AUDIOIN.kick.n : 0) + 1, perfClock: true } });
}
window.setAudioKick = setAudioKick;
// Drop test hook: one structural drop, `strength` 0..1. Fires a hard kick in
// the same call because every real drop arrives on one (the detector requires
// it), so harness states stay shaped like the real thing. Preserve any band
// values the caller staged first — this only touches drop/kick/build.
function setAudioDrop(strength) {
  const s = clamp(strength === undefined ? 0.8 : strength);
  setAudioIn({
    build: 0,   // spent, same as the real detector
    drop: { t: performance.now() / 1000, strength: s, n: (AUDIOIN.drop ? AUDIOIN.drop.n : 0) + 1, perfClock: true },
    kick: { t: performance.now() / 1000, strength: Math.max(0.7, s), n: (AUDIOIN.kick ? AUDIOIN.kick.n : 0) + 1, perfClock: true },
  });
}
window.setAudioDrop = setAudioDrop;
