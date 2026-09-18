/* DeskGains — data.js
   Muscle catalog, exercise library, weekly plan, ROI defaults.
   Edit this file to change exercises or the weekly layout. */
window.DATA = (function () {

  /* ---------- muscles ----------
     g    = group shown in charts
     site = body measurement the muscle feeds in the ROI model (null = not tracked)
     w    = how strongly that muscle counts toward the site (0-1)            */
  const MUSCLES = {
    pec_upper:   { n: 'Upper chest',            g: 'Chest',                site: 'chest',     w: 1,    does: 'Clavicular pec. Fills the area under the collarbone; works hardest on decline and incline pressing.' },
    pec_lower:   { n: 'Mid / lower chest',      g: 'Chest',                site: 'chest',     w: 1,    does: 'Sternal pec. The bulk of the chest; drives every push-up and press.' },
    serratus:    { n: 'Serratus anterior',      g: 'Chest',                site: 'chest',     w: 0.4,  does: 'Wraps the ribs and holds the shoulder blades flat. Gives the ribcage a fuller, more defined look.' },
    delt_front:  { n: 'Front delts',            g: 'Shoulders',            site: 'shoulders', w: 1,    does: 'Front of the shoulder. Works on every push-up and overhead press.' },
    delt_side:   { n: 'Side delts',             g: 'Shoulders',            site: 'shoulders', w: 1,    does: 'Middle of the shoulder. The muscle that makes shoulders look wide.' },
    delt_rear:   { n: 'Rear delts',             g: 'Shoulders',            site: 'shoulders', w: 0.8,  does: 'Back of the shoulder. Rounds the shoulder from behind and pulls it back into good posture.' },
    rot_cuff:    { n: 'Rotator cuff',           g: 'Shoulders',            site: 'shoulders', w: 0.3,  does: 'Small stabilizers that keep the shoulder joint centered. Protects the joint under load.' },
    traps_upper: { n: 'Upper traps',            g: 'Posture / upper back', site: 'neck',      w: 0.5,  does: 'The slope from neck to shoulder. Thicker traps make the neck and shoulders look fuller.' },
    traps_mid:   { n: 'Mid / lower traps',      g: 'Posture / upper back', site: 'shoulders', w: 0.25, does: 'Pull the shoulder blades back and down. The main muscles that fix rounded shoulders.' },
    triceps:     { n: 'Triceps (assist only)',  g: 'Arms (assist)',        site: null,        w: 0,    does: 'Back of the upper arm. Helps every push. Tracked as assist only, since you train it at the gym.' },
    neck_flex:   { n: 'Neck flexors (front)',   g: 'Neck',                 site: 'neck',      w: 1,    does: 'Front of the neck. Holds the head over the spine and counters forward-head posture.' },
    neck_ext:    { n: 'Neck extensors (back)',  g: 'Neck',                 site: 'neck',      w: 1,    does: 'Back of the neck. Builds a thicker neck from behind.' },
    neck_lat:    { n: 'Neck side flexors',      g: 'Neck',                 site: 'neck',      w: 1,    does: 'Sides of the neck. Adds width to the neck from the front.' },
    fore_flex:   { n: 'Wrist flexors',          g: 'Forearms & wrists',    site: 'forearm',   w: 1,    does: 'Inside of the forearm. Curls the wrist and closes the hand.' },
    fore_ext:    { n: 'Wrist extensors',        g: 'Forearms & wrists',    site: 'forearm',   w: 1,    does: 'Outside of the forearm. Lifts the wrist; balances the forearm and protects the elbow.' },
    brachio:     { n: 'Brachioradialis',        g: 'Forearms & wrists',    site: 'forearm',   w: 1,    does: 'The thick muscle at the top of the forearm. The biggest contributor to forearm size.' },
    grip:        { n: 'Grip / finger flexors',  g: 'Forearms & wrists',    site: 'forearm',   w: 0.8,  does: 'Muscles that close the fingers. Grip strength and forearm density.' },
    wrist_stab:  { n: 'Wrist stabilizers',      g: 'Forearms & wrists',    site: 'wrist',     w: 1,    does: 'Small muscles and tendons around the wrist. Builds resilience, not circumference.' },
    gastroc:     { n: 'Gastrocnemius (calf)',   g: 'Calves & shins',       site: 'calf',      w: 1,    does: 'The big calf muscle. Works with the knee straight.' },
    soleus:      { n: 'Soleus (deep calf)',     g: 'Calves & shins',       site: 'calf',      w: 0.8,  does: 'Deep calf muscle. Works with the knee bent; adds calf thickness from the side.' },
    tib:         { n: 'Tibialis anterior',      g: 'Calves & shins',       site: 'calf',      w: 0.4,  does: 'Front of the shin. Supports the knee and ankle, and fills out the front of the lower leg.' },
    glute_max:   { n: 'Glute max',              g: 'Glutes & hamstrings',  site: 'hips',      w: 1,    does: 'The largest glute muscle. Shape and size of the hips from behind.' },
    glute_med:   { n: 'Glute med',              g: 'Glutes & hamstrings',  site: 'hips',      w: 0.7,  does: 'Upper outer glute. Hip width and knee stability.' },
    hams:        { n: 'Hamstrings',             g: 'Glutes & hamstrings',  site: 'thigh',     w: 1,    does: 'Back of the thigh. Protects the knee and fills out the back of the leg.' },
    abs:         { n: 'Rectus abdominis',       g: 'Core',                 site: 'waist',     w: 1,    does: 'The front "six-pack" muscle. Flexes the spine and braces the trunk.' },
    obliques:    { n: 'Obliques',               g: 'Core',                 site: 'waist',     w: 0.8,  does: 'Sides of the trunk. Resists twisting and bending.' },
    core_deep:   { n: 'Deep core',              g: 'Core',                 site: 'waist',     w: 0.5,  does: 'Transverse abdominis. The internal corset that keeps the trunk stable.' },
    erectors:    { n: 'Spinal erectors (assist)', g: 'Core',               site: null,        w: 0,    does: 'Muscles along the spine. Assist only, since you train your back at the gym.' },
    hip_flex:    { n: 'Hip flexors (assist)',   g: 'Core',                 site: null,        w: 0,    does: 'Lift the thigh. Assist only during holds and leg raises.' }
  };

  const GROUPS = ['Chest', 'Shoulders', 'Posture / upper back', 'Neck', 'Forearms & wrists', 'Calves & shins', 'Glutes & hamstrings', 'Core', 'Arms (assist)'];

  /* ---------- body measurement sites for the ROI model ----------
     P = realistic ceiling (cm) this program can add in 12 weeks at full adherence
         for a lean beginner who is eating in a surplus. Muscle only; fat is excluded.
     Editable in Settings. */
  const SITES = {
    chest:     { n: 'Chest',            P: 3.0, c: '#ff5a5f', note: 'Tape at nipple line, relaxed' },
    shoulders: { n: 'Shoulders',        P: 3.0, c: '#ffb31a', note: 'Around the widest part of the delts' },
    neck:      { n: 'Neck',             P: 1.2, c: '#2ee6d6', note: 'Just above the Adam’s apple' },
    forearm:   { n: 'Forearm',          P: 1.0, c: '#ff8a3d', note: 'Thickest part, hand relaxed' },
    wrist:     { n: 'Wrist',            P: 0.1, c: '#9db4ff', note: 'Mostly bone. Training builds resilience, not size' },
    calf:      { n: 'Calf',             P: 1.2, c: '#c6ff3d', note: 'Widest point, standing' },
    hips:      { n: 'Hips / glutes',    P: 2.0, c: '#ff5fb0', note: 'Around the fullest part of the glutes' },
    thigh:     { n: 'Thigh (hamstrings)', P: 1.0, c: '#c084fc', note: 'Midway between hip and knee' },
    waist:     { n: 'Waist (core muscle only)', P: 0.4, c: '#ffe14d', note: 'Muscle only. Fat gain will add more' }
  };

  const TAGS = {
    chest:    { l: 'Chest',      c: '#ff5a5f' },
    shoulder: { l: 'Shoulders',  c: '#ffb31a' },
    posture:  { l: 'Posture',    c: '#29d3ff' },
    calves:   { l: 'Calves',     c: '#c6ff3d' },
    glutes:   { l: 'Glutes',     c: '#ff5fb0' },
    hams:     { l: 'Hamstrings', c: '#c084fc' },
    abs:      { l: 'Abs',        c: '#ffe14d' },
    neck:     { l: 'Neck',       c: '#2ee6d6' },
    forearm:  { l: 'Forearms',   c: '#ff8a3d' },
    wrist:    { l: 'Wrists',     c: '#9db4ff' }
  };

  const CALL = { chest: 'CHEST TIME', shoulder: 'SHOULDER TIME', posture: 'STAND TALL', calves: 'CALF TIME', glutes: 'GLUTE TIME', hams: 'HAMSTRING TIME', abs: 'CORE TIME', neck: 'NECK TIME', forearm: 'FOREARM TIME', wrist: 'WRIST TIME' };

  /* ---------- exercises ----------
     unit : reps | reps/side | reps/leg | sec   (range is reps, or seconds for sec)
     stim : muscle stimulus per set (0-1). Hard near-failure sets = 1, light/isometric less.
     pri / sec / stretch : muscle ids (primary, assisting, stretched)
     tempo: "down-pause-up" seconds. Drives the guided timer.
     levels: progression ladder. start = index to begin at.               */
  const X = o => Object.assign({ unit: 'reps', stim: 1, rest: 60, sec: [], stretch: [], levels: null, tempo: null, rir: 'Stop 2–3 reps before failure', hard: false, sweat: 'low', start: 0, bump0: 0 }, o);

  const EX = {
    /* ---- chest ---- */
    pu_decline: X({ name: 'Decline push-ups', tag: 'chest', eq: 'Bodyweight + chair', sweat: 'med', hard: true, rest: 75, sets: 3, range: [14, 24],
      pri: ['pec_upper', 'pec_lower'], sec: ['delt_front', 'triceps', 'serratus', 'abs'], rir: 'Stop 1–2 reps before failure',
      cues: ['Feet on a chair, hands just outside shoulders', 'Body in one line: squeeze glutes and abs', 'Chest to two fists off the floor, elbows about 45°'],
      levels: ['Decline push-ups (feet on chair)', 'Feet-high decline push-ups (feet on desk)', 'Decline push-ups, 3-sec lowering', 'Band-resisted decline push-ups (band across back)'] }),
    pu_archer: X({ name: 'Archer push-ups', tag: 'chest', eq: 'Bodyweight', sweat: 'med', hard: true, rest: 75, sets: 3, range: [4, 8], unit: 'reps/side',
      pri: ['pec_lower', 'pec_upper'], sec: ['delt_front', 'triceps', 'serratus', 'abs', 'obliques'], rir: 'Stop 1–2 reps before failure',
      cues: ['Hands wide, shift your weight over one arm', 'The straight arm stays long and light on the fingertips', 'Keep hips level; lower until the chest nearly touches'],
      levels: ['Archer push-ups (bent-arm assist)', 'Archer push-ups', 'Archer push-ups, 3-sec lowering'] }),
    pu_max: X({ name: 'Max-rep push-ups', tag: 'chest', eq: 'Bodyweight', sweat: 'med', hard: true, rest: 90, sets: 3, range: [30, 45],
      pri: ['pec_lower', 'pec_upper'], sec: ['delt_front', 'triceps', 'serratus', 'abs'], rir: 'Set 1 to 0–1 reps from failure; sets 2–3 at about 70% of set 1',
      cues: ['Chest to the floor every rep, no half reps', 'Full lockout with shoulder blades spread at the top', 'Log set 1. It is your scoreboard'] }),
    band_chest_press: X({ name: 'Band chest press (band behind back)', tag: 'chest', eq: 'Band', stim: 0.6, sets: 3, range: [15, 25],
      pri: ['pec_lower', 'pec_upper'], sec: ['delt_front', 'triceps', 'serratus'], rir: 'Stop 3 reps before failure',
      cues: ['Band across your shoulder blades, handles at the chest', 'Press forward and squeeze the pecs together', 'Return slowly for 2 seconds; stay tall'] }),
    pu_incline_slow: X({ name: 'Slow-lowering incline push-ups (hands on desk)', tag: 'chest', eq: 'Sturdy desk', stim: 0.55, sets: 3, range: [10, 15], tempo: '4-1-1',
      pri: ['pec_lower', 'pec_upper'], sec: ['delt_front', 'triceps', 'serratus', 'abs'], rir: 'Stop 3+ reps before failure',
      cues: ['Hands on a sturdy desk edge (test it first)', '4 sec down, 1 sec pause at the chest, 1 sec up', 'Elbows about 45°, body in one line'],
      levels: ['Desk-height incline push-ups (slow lowering)', 'Chair-height incline push-ups (slow lowering)', 'Flat push-ups, 4-sec lowering'] }),

    /* ---- shoulders ---- */
    pike_pushup: X({ name: 'Pike push-ups', tag: 'shoulder', eq: 'Bodyweight + chair', sweat: 'med', hard: true, rest: 75, sets: 3, range: [8, 15], start: 1,
      pri: ['delt_front', 'delt_side'], sec: ['triceps', 'traps_upper', 'serratus'], rir: 'Stop 1–2 reps before failure',
      cues: ['Hips high, head travels between your hands', 'Lower until the crown of your head nearly touches the floor', 'Press to lockout and shrug tall at the top'],
      levels: ['Pike push-ups (feet on floor, hips high)', 'Pike push-ups (feet on chair)', 'Pike push-ups (feet on desk)', 'Pike push-ups, 3-sec lowering (feet on desk)'] }),
    band_ohp: X({ name: 'Band overhead press (stand on band)', tag: 'shoulder', eq: 'Band', stim: 0.8, sets: 3, range: [10, 15],
      pri: ['delt_front', 'delt_side'], sec: ['triceps', 'traps_upper', 'serratus', 'abs'], rir: 'Stop 2 reps before failure',
      cues: ['Stand on the band, handles at shoulders, ribs down (no back arch)', 'Press straight up past your ears', 'Lower slowly for 2 seconds'],
      levels: ['Band overhead press (long band)', 'Band overhead press (shorter grip on band)', 'Band overhead press, 3-sec lowering'] }),
    band_lateral: X({ name: 'Band lateral raises', tag: 'shoulder', eq: 'Band', stim: 0.7, sets: 3, range: [15, 25],
      pri: ['delt_side'], sec: ['traps_upper', 'delt_front'], rir: 'Stop 2 reps before failure',
      cues: ['Stand on the band, soft elbows, lift to shoulder height', 'Lead with the elbows, pinkies slightly up', 'Lower for 2 seconds; no swinging'],
      levels: ['Band lateral raises (long band)', 'Band lateral raises (shorter band)', 'Band lateral raises, 3-sec lowering'] }),
    lateral_burnout: X({ name: 'Band lateral raise burnout (partials)', tag: 'shoulder', eq: 'Band', stim: 0.6, sets: 3, range: [25, 40],
      pri: ['delt_side'], sec: ['traps_upper'], rir: 'Burn, but stop before form breaks',
      cues: ['Work only the top half of the range for constant tension', 'Keep your shoulders down; no shrugging', 'Pump reps: fast up, slow down'] }),

    /* ---- posture ---- */
    band_pull_apart: X({ name: 'Band pull-aparts', tag: 'posture', eq: 'Band', stim: 0.6, sets: 3, range: [15, 25],
      pri: ['delt_rear', 'traps_mid'], sec: ['rot_cuff', 'traps_upper'], rir: 'Stop 3 reps before failure',
      cues: ['Arms straight at chest height, band taut', 'Pull apart until hands reach your sides, squeeze the blades', 'Ribs down; do not shrug'],
      levels: ['Band pull-aparts (wide grip)', 'Band pull-aparts (narrow grip)', 'Band pull-aparts (narrowest grip, 2-sec squeeze)'] }),
    band_pull_apart_squeeze: X({ name: 'Band pull-aparts with 2-sec squeeze', tag: 'posture', eq: 'Band', stim: 0.6, sets: 3, range: [10, 15], tempo: '1-2-1',
      pri: ['delt_rear', 'traps_mid'], sec: ['rot_cuff', 'traps_upper'], rir: 'Stop 3 reps before failure',
      cues: ['Same setup, but hold the squeeze for 2 full seconds', 'Think about pinching a pencil between your shoulder blades', 'Chin level, ribs down'] }),
    wall_slides: X({ name: 'Wall slides (wall angels)', tag: 'posture', eq: 'Wall', stim: 0.4, sets: 2, range: [8, 12], tempo: '3-1-3', rest: 30,
      pri: ['traps_mid', 'serratus'], sec: ['rot_cuff', 'delt_rear'], rir: 'Smooth and controlled',
      cues: ['Back, head and tailbone touching the wall', 'Forearms on the wall, slide up slowly to a Y', 'Ribs stay down; do not arch to reach'] }),
    prone_y: X({ name: 'Prone Y raises (on the floor)', tag: 'posture', eq: 'Floor', stim: 0.6, sets: 3, range: [8, 12], tempo: '1-2-1', rest: 45,
      pri: ['traps_mid', 'delt_rear'], sec: ['rot_cuff', 'erectors'], rir: 'Stop 2–3 reps before failure',
      cues: ['Face down, thumbs up, arms in a Y', 'Lift from the shoulder blades, not the low back', 'Hold 2 sec at the top'] }),
    band_ext_rot: X({ name: 'Band external rotations (elbows pinned)', tag: 'posture', eq: 'Band', stim: 0.5, sets: 3, range: [12, 20], rest: 45,
      pri: ['rot_cuff', 'delt_rear'], sec: ['traps_mid'], rir: 'Stop 3 reps before failure',
      cues: ['Elbows glued to your sides, forearms forward, hands on the handles', 'Rotate both hands outward, keeping wrists straight', 'Return slowly'] }),
    posture_reset: X({ name: 'Posture reset: pec stretch + chair thoracic extension', tag: 'posture', eq: 'Doorway + chair', stim: 0, sets: 2, unit: 'sec', range: [30, 45], rest: 15, holdReps: 3,
      holdLabels: ['Doorway pec stretch, left', 'Doorway pec stretch, right', 'Chair thoracic extension'],
      pri: [], sec: [], stretch: ['pec_upper', 'pec_lower', 'delt_front'], rir: 'Stretch to a strong pull, never pain',
      cues: ['Forearm on the door frame, elbow at shoulder height, step through', 'Sit tall on a chair, hands behind the head, arch over the chair back', 'Breathe slowly; let the ribs open'] }),
    chin_tuck: X({ name: 'Wall chin tucks (5-sec holds)', tag: 'posture', eq: 'Wall', stim: 0.3, sets: 3, range: [8, 12], tempo: '1-5-1', rest: 30,
      pri: ['neck_flex'], sec: [], stretch: ['neck_ext'], rir: 'Gentle, never strain',
      cues: ['Head against the wall, look straight ahead', 'Draw the chin straight back (make a double chin), no nodding', 'Hold 5 sec, release slowly'] }),

    /* ---- neck ---- */
    neck_iso: X({ name: 'Neck isometrics (4-way)', tag: 'neck', eq: 'Hands', stim: 0.35, sets: 2, unit: 'sec', range: [8, 15], rest: 20, holdReps: 4,
      holdLabels: ['Push forward', 'Push back', 'Push left', 'Push right'],
      pri: ['neck_flex', 'neck_ext', 'neck_lat'], sec: ['traps_upper'], rir: 'About 50–60% effort, never jerk',
      cues: ['Hand on forehead, back of head, then each side; push the head into the hand', 'Ramp the effort up gradually and hold still', 'Breathe. Stop if you feel tingling or pain'] }),

    /* ---- forearms & wrists ---- */
    rice_dig: X({ name: 'Rice bucket: dig & open-close', tag: 'forearm', eq: 'Rice bucket', stim: 0.5, sets: 3, unit: 'sec', range: [45, 75], rest: 30, hw: 'WORK',
      pri: ['grip', 'fore_flex', 'fore_ext'], sec: ['wrist_stab', 'brachio'], rir: 'Burn in the forearm, not the joints',
      cues: ['Bury the hand, squeeze the rice hard, then spread the fingers wide', 'Fast open–close reps for the whole set', 'Switch hands between sets'] }),
    rice_wrist: X({ name: 'Rice bucket: wrist rotations & curls', tag: 'wrist', eq: 'Rice bucket', stim: 0.5, sets: 3, unit: 'sec', range: [45, 75], rest: 30, hw: 'WORK',
      pri: ['wrist_stab', 'fore_flex', 'fore_ext'], sec: ['brachio', 'grip'], rir: 'Slow and pain-free',
      cues: ['Forearm on the bucket rim, hand in the rice', 'Cycle: palm-up curls, palm-down extensions, then rotate palm up and down', 'Full range every rep; switch hands between sets'] }),
    band_reverse_curl: X({ name: 'Band reverse curls (palms down)', tag: 'forearm', eq: 'Band', stim: 0.7, sets: 3, range: [12, 20],
      pri: ['brachio', 'fore_ext'], sec: ['fore_flex', 'grip'], rir: 'Stop 2 reps before failure',
      cues: ['Stand on the band, palms down, elbows pinned', 'Curl up with straight wrists', 'Lower for 3 seconds'] }),
    band_wrist_curl: X({ name: 'Band wrist curls & reverse wrist curls', tag: 'wrist', eq: 'Band', stim: 0.6, sets: 3, range: [15, 25],
      pri: ['fore_flex', 'fore_ext', 'wrist_stab'], sec: ['grip'], rir: 'Stop 2 reps before failure',
      cues: ['Forearm on your thigh, band under your foot', 'Curl the wrist up, then flip the hand and curl it the other way', 'Slow reps: forearms grow with time under tension'] }),

    /* ---- calves & shins ---- */
    calf_single: X({ name: 'Single-leg calf raises', tag: 'calves', eq: 'Wall + step', stim: 0.8, sets: 3, range: [15, 25], unit: 'reps/leg', tempo: '3-1-1', rest: 45,
      pri: ['gastroc'], sec: ['soleus'], rir: 'Stop 1–2 reps before failure',
      cues: ['Ball of the foot on a stair edge or flat floor, one hand on a wall', 'Full stretch at the bottom, pause 1 sec', 'Rise as high as you can, 3 sec down'],
      levels: ['Single-leg calf raises (floor)', 'Single-leg calf raises (off a step)', 'Single-leg calf raises off a step, holding the rice bucket'], start: 1 }),
    calf_seated_bucket: X({ name: 'Seated calf raises (rice bucket on knees)', tag: 'calves', eq: 'Chair + rice bucket', stim: 0.7, sets: 3, range: [15, 25], rest: 45,
      pri: ['soleus'], sec: ['gastroc'], rir: 'Stop 2 reps before failure',
      cues: ['Sit with knees at 90° and the bucket resting on your thighs', 'Heels up as high as possible, pause 1 sec', 'Lower slowly for a full stretch (lighter load if the bucket is too heavy)'] }),
    calf_tempo: X({ name: 'Slow single-leg calf raises (3-1-3)', tag: 'calves', eq: 'Wall + step', stim: 0.8, sets: 3, range: [8, 12], unit: 'reps/leg', tempo: '3-1-3', rest: 45,
      pri: ['gastroc', 'soleus'], sec: [], rir: 'Stop 1–2 reps before failure',
      cues: ['Off a step, one hand on a wall for balance', '3 sec up, 1 sec squeeze, 3 sec down into a deep stretch', 'No bouncing at the bottom'] }),
    tib_raise: X({ name: 'Wall tibialis raises', tag: 'calves', eq: 'Wall', stim: 0.5, sets: 3, range: [20, 30], rest: 30,
      pri: ['tib'], sec: [], rir: 'Burn in the shin, not the ankle',
      cues: ['Back on a wall, heels about 30 cm out, legs straight', 'Lift the toes toward your shins and squeeze', 'Great for knee support and shin fullness'] }),

    /* ---- glutes & hamstrings (knee-friendly) ---- */
    glute_bridge_sl: X({ name: 'Single-leg glute bridge', tag: 'glutes', eq: 'Floor', stim: 0.8, sets: 3, range: [10, 15], unit: 'reps/leg', rest: 45, start: 1,
      pri: ['glute_max', 'hams'], sec: ['glute_med', 'core_deep', 'erectors'], rir: 'Stop 2 reps before failure',
      cues: ['Lie on your back, one foot flat, the other knee to chest', 'Drive through the heel and squeeze the glute hard at the top', 'Hips stay level; no twisting'],
      levels: ['Two-leg glute bridge (2-sec pause at top)', 'Single-leg glute bridge', 'Single-leg glute bridge, 3-sec lowering'] }),
    good_morning_band: X({ name: 'Band good mornings', tag: 'hams', eq: 'Band', stim: 0.8, sets: 3, range: [12, 20],
      pri: ['hams', 'glute_max'], sec: ['erectors', 'core_deep'], rir: 'Stop 2 reps before failure',
      cues: ['Stand on the band, handles at your shoulders, soft knees', 'Push the hips back with a flat back until the hamstrings stretch', 'Stand tall and squeeze the glutes'] }),
    ham_walkout: X({ name: 'Hamstring bridge walkouts (socks on smooth floor)', tag: 'hams', eq: 'Floor', stim: 0.8, sets: 3, range: [6, 12], rest: 60,
      pri: ['hams'], sec: ['glute_max', 'core_deep'], rir: 'Stop 2 reps before failure',
      cues: ['On your back in a bridge, heels on a smooth floor (socks or a towel)', 'Walk the heels out slowly, then curl them back in', 'Hips stay high the whole time'] }),
    sl_rdl: X({ name: 'Single-leg Romanian deadlift', tag: 'hams', eq: 'Bodyweight', stim: 0.7, sets: 3, range: [8, 12], unit: 'reps/leg', rest: 45,
      pri: ['hams', 'glute_max'], sec: ['glute_med', 'erectors', 'core_deep'], rir: 'Stop 2–3 reps before failure',
      cues: ['Soft standing knee, hinge from the hips, back leg reaches behind', 'Flat back, hips square to the floor', 'Stand tall and squeeze the glute'],
      levels: ['Single-leg RDL (fingertips on a chair for balance)', 'Single-leg RDL', 'Single-leg RDL holding the rice bucket'] }),
    glute_bridge_hold: X({ name: 'Glute bridge holds', tag: 'glutes', eq: 'Floor', stim: 0.5, sets: 3, unit: 'sec', range: [30, 60], rest: 30, hw: 'HOLD',
      pri: ['glute_max', 'hams'], sec: ['glute_med', 'core_deep'], rir: 'Squeeze hard, breathe steadily',
      cues: ['Bridge up, ribs down, squeeze the glutes as hard as you can', 'Breathe steadily', 'Add seconds as it gets easier'] }),

    /* ---- abs ---- */
    hollow_hold: X({ name: 'Hollow body hold', tag: 'abs', eq: 'Floor', stim: 0.6, sets: 3, unit: 'sec', range: [20, 40], rest: 30, hw: 'HOLD', start: 1,
      pri: ['abs', 'core_deep'], sec: ['obliques', 'hip_flex'], rir: 'Stop when your low back lifts',
      cues: ['Low back pressed into the floor', 'Arms overhead, legs straight, shoulders off the floor', 'Bend the knees if your back lifts'],
      levels: ['Tucked hollow hold', 'Hollow hold', 'Hollow hold, arms overhead'] }),
    plank_rkc: X({ name: 'RKC plank (max tension)', tag: 'abs', eq: 'Floor', stim: 0.6, sets: 3, unit: 'sec', range: [30, 60], rest: 30, hw: 'HOLD',
      pri: ['abs', 'core_deep', 'obliques'], sec: ['delt_front', 'serratus', 'glute_max'], rir: 'Stop when the hips sag',
      cues: ['Forearms down, elbows under shoulders', 'Squeeze glutes, quads and fists at 100% tension', 'Stop when your hips sag'] }),
    plank_taps: X({ name: 'Plank shoulder taps', tag: 'abs', eq: 'Floor', stim: 0.6, sets: 3, range: [20, 40], rest: 45,
      pri: ['abs', 'obliques', 'core_deep'], sec: ['delt_front', 'serratus', 'pec_lower'], rir: 'Stop when your hips start rocking',
      cues: ['Feet wide, hips level, no rocking', 'Tap the opposite shoulder, ribs down', 'Slow and controlled beats fast and sloppy'] }),
    reverse_crunch: X({ name: 'Reverse crunches', tag: 'abs', eq: 'Floor', stim: 0.6, sets: 3, range: [12, 20], rest: 45,
      pri: ['abs'], sec: ['core_deep', 'obliques'], rir: 'Stop 2 reps before failure',
      cues: ['On your back, knees at 90°, hands by your hips', 'Curl the hips off the floor with your abs; no swinging', 'Lower for 3 seconds'] })
  };

  Object.keys(EX).forEach(k => { EX[k].id = k; });

  /* ---------- weekly plan ----------
     8 slots per day: 9, 10, 11, 12 (lunch, light), 1, 2, 3, 4.
     Hard days are Mon / Wed / Fri (48 h apart); Tue / Thu are pump + posture days.
     Every day has at least one chest, one shoulder and one posture slot. */
  const PLAN = {
    1: { theme: 'PUSH POWER', kind: 'HARD',
      twist: 'Heavy push volume: decline push-ups and pike push-ups.',
      recovery: 'Fresh after the weekend, so chest and shoulders take their first hard hit of the week.',
      hype: 'Monday sets the tone. Hit chest and shoulders hard.',
      slots: ['band_pull_apart', 'pu_decline', 'calf_single', 'neck_iso', 'pike_pushup', 'glute_bridge_sl', 'rice_dig', 'hollow_hold'] },
    2: { theme: 'POSTURE + POSTERIOR', kind: 'LIGHT',
      twist: 'Pump and posture. Side delts, glutes and hamstrings lead; chest stays light.',
      recovery: 'Chest and front delts recover from Monday. Band work and pump only, nothing near failure.',
      hype: 'Recovery day is not a day off. Stack the small wins.',
      slots: ['wall_slides', 'band_lateral', 'good_morning_band', 'posture_reset', 'band_chest_press', 'calf_seated_bucket', 'sl_rdl', 'band_reverse_curl'] },
    3: { theme: 'ONE SIDE AT A TIME + TEMPO', kind: 'HARD',
      twist: 'Archer push-ups, band overhead press, slow calf raises and hamstring walkouts.',
      recovery: 'Chest and shoulders are 48 h past Monday, so they are ready for the second hard day.',
      hype: 'Midweek hard day. This is where the shape gets built.',
      slots: ['prone_y', 'pu_archer', 'calf_tempo', 'chin_tuck', 'band_ohp', 'ham_walkout', 'plank_rkc', 'rice_wrist'] },
    4: { theme: 'PUMP + MOBILITY', kind: 'LIGHT',
      twist: 'Slow-lowering push-ups, side-delt burnout, neck isometrics and shin work for the knees.',
      recovery: 'Day after the second hard push. Everything stays 3+ reps from failure.',
      hype: 'Control the tempo. Chase the pump, not the burn-out.',
      slots: ['band_ext_rot', 'pu_incline_slow', 'lateral_burnout', 'neck_iso', 'glute_bridge_hold', 'tib_raise', 'band_wrist_curl', 'reverse_crunch'] },
    5: { theme: 'MAX + FINISH', kind: 'HARD',
      twist: 'Max-rep push-up test, pike push-ups and single-leg hinges.',
      recovery: 'Thursday was light, so chest and shoulders are fresh for your best sets. The weekend is full rest.',
      hype: 'Freshest lifts of the week. Beat last Friday.',
      slots: ['band_pull_apart_squeeze', 'pu_max', 'calf_single', 'neck_iso', 'pike_pushup', 'sl_rdl', 'plank_taps', 'rice_dig'] }
  };

  const HYPE = [
    'Four minutes. Go.',
    'Small sets add up to a different shirt size.',
    'Every set you check off is banked. Bank one now.',
    'Nobody sees the reps. Everybody sees the results.',
    'Shoulders back. Chest up. Start the timer.',
    'Consistency beats intensity. Show up hourly.',
    'Stand up. Set. Done. Back to work stronger.',
    'You are building the version of you people notice.'
  ];

  return { MUSCLES, GROUPS, SITES, TAGS, CALL, EX, PLAN, HYPE };
})();
