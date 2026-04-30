import {
  createTimeline,
  stagger,
  utils,
} from 'https://esm.sh/animejs';

const { random, cos, sin, sqrt, PI, abs } = Math;
const maxParticleCount = 4000;
let activeParticleCount = 2500;
const duration = 3000;
const win = { w: window.innerWidth * 0.26, h: window.innerHeight * 0.26 };
const target = { x: 0, y: 0, r: win.w * 0.25 };
const radius = Symbol();
const theta = Symbol();
const homeX = Symbol();
const homeY = Symbol();
const altX = Symbol();
const altY = Symbol();
const prevX = Symbol();
const facingX = Symbol();
const rebelStart = Symbol();
const rebelDuration = Symbol();
const rebelAngle = Symbol();
const rebelDistance = Symbol();
const rebelCheckAt = Symbol();

const bgColorInput = document.querySelector('#bg-color');
const particleColorInput = document.querySelector('#particle-color');
const shapeInput = document.querySelector('#shape');
const particleSizeInput = document.querySelector('#particle-size');
const particleSizeValue = document.querySelector('#particle-size-value');
const particleSpeedInput = document.querySelector('#particle-speed');
const particleSpeedValue = document.querySelector('#particle-speed-value');
const particleCountInput = document.querySelector('#particle-count');
const particleCountValue = document.querySelector('#particle-count-value');
const behaviorInputs = document.querySelectorAll('input[name="animation-behavior"]');
const shapeBirdButton = document.querySelector('#shape-bird');
const shapeFishButton = document.querySelector('#shape-fish');
const shapeRabbitButton = document.querySelector('#shape-rabbit');
const randomizeButton = document.querySelector('#randomize');
const wordInput = document.querySelector('#word-input');
const applyWordButton = document.querySelector('#apply-word');
const bookWordButton = document.querySelector('#book-word');
const minParticleSize = 2;
const maxParticleSize = 20;
const defaultParticleSize = 4;
let spreadScale = 1;
let speedScale = 1;
let behaviorMode = 'swarm';
let wordMode = false;
let animalMode = false;
let currentAnimalType = 'cat';
const wordPoints = [];
const animalPoints = [];
const particles = [];
const particleIndex = Symbol();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const bookLines = [
  'may the force be with you',
  'winter is coming',
  'i am inevitable',
  'you shall not pass',
  'hasta la vista baby',
  'bond james bond',
  'keep your friends close',
  'why so serious',
];
const animalPathData = {
  cat: 'M10 78 L18 62 L30 50 L36 34 L30 18 L40 10 L50 18 L60 10 L70 18 L64 34 L70 50 L82 62 L90 78 L75 82 L60 84 L50 92 L40 84 L25 82 Z',
  dog: 'M8 74 L18 62 L24 42 L32 26 L24 14 L36 10 L50 22 L66 10 L78 14 L70 28 L78 42 L84 56 L92 68 L86 80 L72 82 L60 80 L50 90 L40 80 L26 82 L14 80 Z',
  bird: 'M8 56 L24 74 L45 92 L60 76 L86 22 L74 10 L56 48 L44 64 L26 48 Z',
  fish: 'M10 50 L24 36 L42 28 L62 30 L76 38 L88 26 L92 40 L86 50 L92 60 L88 74 L76 62 L62 70 L42 72 L24 64 Z',
  rabbit: 'M20 78 L22 58 L26 40 L24 16 L32 8 L40 20 L44 40 L48 18 L56 8 L62 18 L60 40 L64 56 L76 62 L84 74 L74 84 L62 86 L50 92 L38 86 L28 84 Z',
};
const getParticleSizeValue = () => (
  particleSizeInput ? Number(particleSizeInput.value) : defaultParticleSize
);
const getWordWobbleAmount = () => clamp(getParticleSizeValue() * 0.5, 1.8, 6);
const isAnimalParticleShape = shape => (
  shape === 'bird' || shape === 'fish' || shape === 'rabbit'
);
const isCurveBehavior = () => (
  behaviorMode === 'infinity'
  || behaviorMode === 'lissajous'
  || behaviorMode === 'lifeline'
  || behaviorMode === 'swarmhug'
  || behaviorMode === 'vortex'
  || behaviorMode === 'galaxy'
  || behaviorMode === 'pulsar'
  || behaviorMode === 'petalbloom'
  || behaviorMode === 'rainumbrella'
  || behaviorMode === 'planetsystem'
  || behaviorMode === 'candyspiral'
);
const getInfinityPosition = ($el, axis = 'x') => {
  // Lemniscate-like continuous flow with per-particle phase offsets.
  const t = tl.currentTime * 0.0012 * speedScale + $el[theta] * 0.55;
  const a = win.w * 0.52 * spreadScale;
  const x = a * sin(t);
  const y = (a * 0.52) * sin(t) * cos(t);
  const driftX = sin(t * 0.37 + $el[theta]) * (win.w * 0.16);
  const driftY = cos(t * 0.29 + $el[theta] * 1.2) * (win.h * 0.12);
  return axis === 'x' ? x + driftX : y + driftY;
};
const getLissajousPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.001 * speedScale + $el[theta] * 0.45;
  const a = 3;
  const b = 2;
  const delta = PI / 2;
  const ampX = win.w * 0.62 * spreadScale;
  const ampY = win.h * 0.48 * spreadScale;
  const x = ampX * sin(a * t + delta);
  const y = ampY * sin(b * t);
  return axis === 'x' ? x : y;
};
const getLifelinePosition = ($el, axis = 'x') => {
  // Monitor-style ECG: fixed horizontal points, moving spike sweep.
  const t = tl.currentTime * 0.00135 * speedScale;
  const iNorm = ($el[particleIndex] % activeParticleCount) / Math.max(1, activeParticleCount - 1);
  const x = (iNorm - 0.5) * win.w * 1.8;
  const sweep = (t * 0.95) % 1;
  const centers = [sweep, (sweep + 0.33) % 1, (sweep + 0.66) % 1];
  let rel = 1;
  for (let c = 0; c < centers.length; c++) {
    let d = iNorm - centers[c];
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    if (abs(d) < abs(rel)) rel = d;
  }

  let y = 0;
  const window = 0.06; // narrower sweep for sharper/taller spike
  if (abs(rel) < window) {
    const p = (rel + window) / (window * 2); // 0..1 across spike window
    if (p < 0.16) {
      y = -24 * (p / 0.16); // initial sharp upward notch
    } else if (p < 0.36) {
      y = -24 + 116 * ((p - 0.16) / 0.2); // strong downward plunge
    } else if (p < 0.56) {
      y = 92 - 172 * ((p - 0.36) / 0.2); // very tall upward spike
    } else if (p < 0.76) {
      y = -80 + 92 * ((p - 0.56) / 0.2); // rebound downward
    } else {
      y = 12 - 12 * ((p - 0.76) / 0.24); // settle to baseline
    }
  } else {
    // mostly flat with tiny monitor noise
    y = sin((iNorm * 48) + t * 6.5) * 0.35;
  }

  return axis === 'x' ? x : y;
};
const getSwarmHugPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];
  const hug = 0.25 + 0.75 * abs(sin(t * 0.85));
  const radial = win.w * (0.08 + 0.32 * hug) * spreadScale;
  const angle = phase + t * 0.9;
  const x = cos(angle) * radial + sin(t * 2.4 + phase) * (win.w * 0.02);
  const y = sin(angle) * radial * 0.8 + cos(t * 2.1 + phase) * (win.h * 0.02);
  return axis === 'x' ? x : y;
};
const getPhyllotaxisPosition = ($el, axis = 'x') => {
  const i = $el[particleIndex] % activeParticleCount;
  const golden = 2.399963229728653; // golden angle in radians
  const t = tl.currentTime * 0.00045 * speedScale;
  const angle = i * golden + t * 22;
  const radiusScale = win.w * 0.0085 * spreadScale;
  const r = sqrt(i) * radiusScale;
  const x = cos(angle) * r;
  const y = sin(angle) * r * 0.82;
  return axis === 'x' ? x : y;
};
const getVortexPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];
  const swirl = t * 1.8 + phase * 1.3;
  const radialWave = 0.25 + 0.75 * abs(sin(t * 0.42 + phase));
  const r = win.w * 0.5 * spreadScale * radialWave;
  const x = cos(swirl) * r + sin(t * 0.37 + phase) * (win.w * 0.08);
  const y = sin(swirl) * r * 0.72 + cos(t * 0.31 + phase * 1.2) * (win.h * 0.08);
  return axis === 'x' ? x : y;
};
const getGalaxyPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.00095 * speedScale;
  const iNorm = ($el[particleIndex] % activeParticleCount) / Math.max(1, activeParticleCount - 1);
  const armCount = 3;
  const arm = ($el[particleIndex] % armCount) / armCount;
  const baseR = (iNorm ** 0.7) * win.w * 0.62 * spreadScale;
  const armAngle = arm * PI * 2 + t * 1.1;
  const spin = baseR * 0.018;
  const thetaVal = armAngle + spin + $el[theta] * 0.08;
  const x = cos(thetaVal) * baseR + sin(t * 3.2 + $el[theta]) * (win.w * 0.018);
  const y = sin(thetaVal) * baseR * 0.78 + cos(t * 2.6 + $el[theta] * 1.1) * (win.h * 0.015);
  return axis === 'x' ? x : y;
};
const getPulsarPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.00135 * speedScale;
  const iNorm = ($el[particleIndex] % activeParticleCount) / Math.max(1, activeParticleCount - 1);
  const angle = $el[theta] + t * 2.6;
  const pulse = (sin(t * 6.2) + 1) * 0.5;
  const wave = sin((iNorm * 18 - t * 7.8) * PI) * 0.18;
  const r = win.w * spreadScale * (0.08 + iNorm * (0.46 + pulse * 0.22 + wave));
  const jet = abs(cos(angle * 2));
  const x = cos(angle) * r * (0.72 + jet * 0.42);
  const y = sin(angle) * r * (0.58 + jet * 0.28);
  return axis === 'x' ? x : y;
};
const getMagnetChasePosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];
  const mx = cos(t * 0.9) * win.w * 0.48;
  const my = sin(t * 1.2) * win.h * 0.38;
  const px = cos(phase * 1.6 + t * 0.65) * win.w * 0.18;
  const py = sin(phase * 1.2 + t * 0.72) * win.h * 0.15;
  const pull = 0.72 + 0.28 * sin(t * 2.4 + phase * 1.3);
  const overshoot = sin(t * 4.1 + phase * 2.1) * (win.w * 0.04);
  const x = (mx * pull + px * (1 - pull)) + overshoot;
  const y = (my * pull + py * (1 - pull)) + cos(t * 3.8 + phase * 1.9) * (win.h * 0.03);
  return axis === 'x' ? x : y;
};
const getPetalBloomPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];
  const petals = 6;
  const bloom = 0.25 + 0.75 * (sin(t * 0.7) + 1) * 0.5;
  const thetaVal = phase + t * 0.6;
  const r = win.w * 0.38 * spreadScale * bloom * abs(cos(petals * thetaVal));
  const x = r * cos(thetaVal);
  const y = r * sin(thetaVal) * 0.86;
  return axis === 'x' ? x : y;
};
const getRainUmbrellaPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.00125 * speedScale;
  const i = $el[particleIndex];
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const laneX = ((i % 131) / 130 - 0.5) * viewportW;
  const fall = (t * 1.15 + (i % 173) / 173) % 1;
  const wind = sin(t * 0.75) * (viewportW * 0.06);
  const x = laneX + wind + sin(t * 2.2 + i * 0.021) * 4;
  const y = -viewportH + fall * viewportH * 2.2;
  return axis === 'x' ? x : y;
};
const getPlanetSystemPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.00095 * speedScale;
  const i = $el[particleIndex] % activeParticleCount;
  const ratio = i / Math.max(1, activeParticleCount - 1);
  const phase = $el[theta];
  const cx = sin(t * 0.35) * (win.w * 0.08);
  const cy = cos(t * 0.27) * (win.h * 0.07);

  // 0-55%: dense planet body
  if (ratio < 0.55) {
    const bodyR = win.w * 0.2 * spreadScale * sqrt(ratio / 0.55);
    const a = phase + t * 0.3;
    const x = cx + cos(a) * bodyR + sin(t * 2 + phase) * 2;
    const y = cy + sin(a) * bodyR * 0.9 + cos(t * 2.2 + phase) * 2;
    return axis === 'x' ? x : y;
  }

  // 55-82%: saturn-like ring band
  if (ratio < 0.82) {
    const local = (ratio - 0.55) / 0.27;
    const ringR = win.w * (0.28 + local * 0.22) * spreadScale;
    const a = phase + t * 0.95;
    const tilt = 0.42;
    const x = cx + cos(a) * ringR;
    const y = cy + sin(a) * ringR * tilt + sin(t * 3 + phase) * 1.5;
    return axis === 'x' ? x : y;
  }

  // 82-100%: orbiting moons
  const local = (ratio - 0.82) / 0.18;
  const orbitR = win.w * (0.58 + local * 0.3) * spreadScale;
  const a = phase * 1.7 + t * (1.35 + local * 1.1);
  const moonX = cx + cos(a) * orbitR + sin(t * 1.2 + phase) * 6;
  const moonY = cy + sin(a) * orbitR * 0.78 + cos(t * 1.1 + phase) * 4;
  return axis === 'x' ? moonX : moonY;
};
const getCandySpiralPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.0012 * speedScale;
  const iNorm = ($el[particleIndex] % activeParticleCount) / Math.max(1, activeParticleCount - 1);
  const turns = 8;
  const a = iNorm * turns * PI * 2 + t * 2.2;
  const r = (iNorm ** 0.75) * win.w * 0.55 * spreadScale;
  const x = cos(a) * r;
  const y = sin(a) * r * 0.78;
  return axis === 'x' ? x : y;
};
const getCometTailsPosition = ($el, axis = 'x') => {
  const t = tl.currentTime * 0.0011 * speedScale;
  const i = $el[particleIndex] % activeParticleCount;
  const cometCount = 4;
  const comet = i % cometCount;
  const rank = Math.floor(i / cometCount);
  const tailN = Math.max(1, Math.floor(activeParticleCount / cometCount));
  const tailRatio = rank / tailN;

  const headX = cos(t * (0.9 + comet * 0.17) + comet * 1.4) * win.w * 0.52;
  const headY = sin(t * (1.15 + comet * 0.13) + comet * 0.9) * win.h * 0.42;
  const lag = tailRatio * (0.65 + comet * 0.06);
  const angle = t * (2.2 + comet * 0.2) + tailRatio * 10 + $el[theta];
  const tx = headX - cos(angle) * (win.w * 0.35 * tailRatio);
  const ty = headY - sin(angle) * (win.h * 0.24 * tailRatio);
  const sparkle = (1 - tailRatio) * sin(t * 7 + $el[theta]) * 3;
  const x = tx + sparkle;
  const y = ty + sparkle * 0.6;
  return axis === 'x' ? x : y;
};
const getCurveBehaviorPosition = ($el, axis = 'x') => {
  if (behaviorMode === 'lissajous') return getLissajousPosition($el, axis);
  if (behaviorMode === 'lifeline') return getLifelinePosition($el, axis);
  if (behaviorMode === 'swarmhug') return getSwarmHugPosition($el, axis);
  if (behaviorMode === 'vortex') return getVortexPosition($el, axis);
  if (behaviorMode === 'galaxy') return getGalaxyPosition($el, axis);
  if (behaviorMode === 'pulsar') return getPulsarPosition($el, axis);
  if (behaviorMode === 'petalbloom') return getPetalBloomPosition($el, axis);
  if (behaviorMode === 'rainumbrella') return getRainUmbrellaPosition($el, axis);
  if (behaviorMode === 'planetsystem') return getPlanetSystemPosition($el, axis);
  if (behaviorMode === 'candyspiral') return getCandySpiralPosition($el, axis);
  return getInfinityPosition($el, axis);
};
const usesAnimalBehavior = shape => (
  behaviorMode === 'swarm' && isAnimalParticleShape(shape)
);
const reseedAnimalAnchors = ($el, shape = document.body.dataset.shape || 'dot') => {
  if (shape === 'rabbit') {
    const spreadX = win.w * 1.2;
    const spreadY = win.h * 0.8;
    if (typeof $el[homeX] !== 'number') {
      $el[homeX] = utils.random(-spreadX, spreadX);
      $el[homeY] = utils.random(-spreadY, spreadY);
    }
    $el[altX] = $el[homeX] + utils.random(-win.w * 0.42, win.w * 0.42);
    $el[altY] = $el[homeY] + utils.random(-win.h * 0.28, win.h * 0.28);
    return;
  }

  const spread = shape === 'fish'
    ? { x: win.w * 1.9, y: win.h * 1.15 }
    : { x: win.w * 1.15, y: win.h * 0.9 };
  $el[homeX] = utils.random(-spread.x, spread.x);
  $el[homeY] = utils.random(-spread.y, spread.y);
};
const getAnimalPosition = ($el, axis = 'x') => {
  const shape = document.body.dataset.shape || 'dot';
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];

  if (shape === 'bird') {
    const flockX = $el[homeX] * 0.35 + cos(t * 0.9 + phase) * (win.w * 0.28);
    const flutterX = sin(t * 6.5 + phase * 2) * 10;
    const flockY = $el[homeY] * 0.2 + sin(t * 1.1 + phase * 1.2) * (win.h * 0.2);
    const wingY = -abs(sin(t * 6.5 + phase * 1.9)) * 10;
    return axis === 'x' ? flockX + flutterX : flockY + wingY;
  }

  if (shape === 'fish') {
    const orbital = t * 0.34 + phase * 0.27;
    const radiusField = (0.28 + 0.12 * sin(t * 0.22 + phase)) * win.w;
    const roundFlowX = cos(orbital) * radiusField;
    const roundFlowY = sin(orbital) * (radiusField * 0.65);
    const migrationY = sin(t * 0.18 + phase * 0.7) * (win.h * 0.42);
    const migrationX = cos(t * 0.15 + phase * 0.5) * (win.w * 0.12);
    let swimX = $el[homeX] * 0.58 + roundFlowX + migrationX + sin(t * 4.2 + phase * 1.6) * 7;
    let swimY = $el[homeY] * 0.62 + roundFlowY + migrationY + cos(t * 3.4 + phase * 1.2) * 4;

    // Rare "rebel fish": break away outside school radius, then return.
    if (!$el[rebelCheckAt]) $el[rebelCheckAt] = t + utils.random(0.4, 1.6);
    const rebelActive = typeof $el[rebelStart] === 'number' && t < ($el[rebelStart] + $el[rebelDuration]);
    if (!rebelActive && t >= $el[rebelCheckAt]) {
      if (random() < 0.1) {
        $el[rebelStart] = t;
        $el[rebelDuration] = utils.random(2.4, 4.8);
        $el[rebelAngle] = random() * PI * 2;
        $el[rebelDistance] = utils.random(win.w * 0.38, win.w * 0.72);
      }
      $el[rebelCheckAt] = t + utils.random(0.8, 2.4);
    }

    if (typeof $el[rebelStart] === 'number' && t < ($el[rebelStart] + $el[rebelDuration])) {
      const progress = (t - $el[rebelStart]) / $el[rebelDuration];
      const envelope = sin(progress * PI); // out then back
      const curve = sin(progress * PI * 2.4 + phase) * (win.w * 0.06);
      const outwardX = cos($el[rebelAngle]) * ($el[rebelDistance] * envelope);
      const outwardY = sin($el[rebelAngle]) * ($el[rebelDistance] * envelope * 0.82);
      const tangentX = cos($el[rebelAngle] + PI / 2) * curve;
      const tangentY = sin($el[rebelAngle] + PI / 2) * curve * 0.65;
      swimX += outwardX + tangentX;
      swimY += outwardY + tangentY;
    }

    const dx = swimX - ($el[prevX] ?? swimX);
    if (abs(dx) > 0.05) {
      // Native fish points left; mirror when heading right.
      $el[facingX] = dx < 0 ? 1 : -1;
    }
    $el[prevX] = swimX;
    return axis === 'x' ? swimX : swimY;
  }

  if (shape === 'rabbit') {
    const cycle = (t * 0.52 + phase * 0.11) % 1;
    const restAtHome = 0.38;
    const hopDuration = 0.2;
    const hopStart = restAtHome;
    const hopEnd = hopStart + hopDuration;

    // rabbit holds still at home spot
    if (cycle < hopStart) {
      return axis === 'x' ? $el[homeX] : $el[homeY];
    }

    // rabbit performs a short jump arc
    if (cycle < hopEnd) {
      const progress = (cycle - hopStart) / hopDuration;
      const x = $el[homeX] + ($el[altX] - $el[homeX]) * progress;
      const yBase = $el[homeY] + ($el[altY] - $el[homeY]) * progress;
      const hopArc = sin(progress * PI) * 36;
      return axis === 'x' ? x : yBase - hopArc;
    }

    // rabbit lands and stays stopped at destination
    return axis === 'x' ? $el[altX] : $el[altY];
  }

  return 0;
};
const getWordWobble = ($el, axis = 'x') => {
  const time = tl.currentTime * 0.0015 * speedScale;
  const phase = $el[theta];
  const drift = axis === 'x'
    ? sin(time + phase * 1.3)
    : cos(time * 1.25 + phase * 1.9);
  return drift * getWordWobbleAmount();
};
const getWordModeAnimalOffset = ($el, axis = 'x') => {
  const shape = document.body.dataset.shape || 'dot';
  const t = tl.currentTime * 0.001 * speedScale;
  const phase = $el[theta];

  // Separate word-mode movement for animal particles.
  if (shape === 'rabbit') {
    const cycle = (t * 0.62 + phase * 0.14) % 1;
    const rest = 0.52;
    const hopWindow = 0.16;
    if (cycle < rest) {
      const idleBob = sin(t * 5.2 + phase * 1.1) > 0 ? -1.4 : 0;
      return axis === 'x' ? 0 : idleBob;
    }
    if (cycle < rest + hopWindow) {
      const progress = (cycle - rest) / hopWindow;
      // Triangular hop profile: sharper takeoff/landing, less float.
      const triangular = progress < 0.5 ? (progress * 2) : (2 - progress * 2);
      const hopX = triangular * 6 * (sin(phase * 2.1) > 0 ? 1 : -1);
      const hopY = -triangular * 24;
      return axis === 'x' ? hopX : hopY;
    }
    return axis === 'x' ? 0 : (sin(t * 4.2 + phase) > 0 ? -0.8 : 0);
  }

  if (shape === 'fish') {
    return axis === 'x'
      ? sin(t * 2.8 + phase * 1.3) * 8
      : cos(t * 2.3 + phase * 1.1) * 3;
  }

  if (shape === 'bird') {
    const flap = sin(t * 6.2 + phase * 2.1);
    return axis === 'x'
      ? flap * 3
      : -abs(flap) * 6;
  }

  return 0;
};
const getWordPoint = $el => {
  const index = $el[particleIndex];
  const point = wordPoints[index];
  if (!point) return { x: 0, y: 0 };

  const time = tl.currentTime * 0.0011 * speedScale;
  const phase = $el[theta];
  const hop = Math.floor(1 + (sin(time * 0.5 + phase) + 1) * 4);
  const altPoint = wordPoints[(index + hop) % wordPoints.length] || point;
  const mix = (sin(time * 1.5 + phase * 1.1) + 1) * 0.5;
  const blend = 0.12 * mix;

  return {
    x: point.x * (1 - blend) + altPoint.x * blend,
    y: point.y * (1 - blend) + altPoint.y * blend,
  };
};
const sampleWordPoints = text => {
  const normalized = text.trim().slice(0, 36);
  if (!normalized) return false;

  const canvas = document.createElement('canvas');
  const canvasWidth = Math.max(320, Math.floor(window.innerWidth * 0.8));
  const canvasHeight = Math.max(120, Math.floor(window.innerHeight * 0.35));
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const length = normalized.length;
  const estimatedFont = (canvasWidth * 0.9) / Math.max(2, length * 0.62);
  const wordScale = clamp(getParticleSizeValue() / defaultParticleSize, 1, 2.2);
  const fontSize = clamp(estimatedFont * wordScale, 56, canvasHeight * 0.95);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px "Google Sans", "Google Sans Text", Inter, sans-serif`;
  ctx.fillText(normalized, canvasWidth / 2, canvasHeight / 2);

  const step = clamp(Math.round(getParticleSizeValue() * 0.8), 3, 8);
  const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const points = [];

  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      const idx = (y * canvasWidth + x) * 4 + 3;
      if (image.data[idx] > 120) {
        points.push({
          x: x - canvasWidth / 2,
          y: y - canvasHeight / 2,
        });
      }
    }
  }

  if (points.length === 0) return false;

  wordPoints.length = 0;
  if (points.length >= activeParticleCount) {
    for (let i = 0; i < activeParticleCount; i++) {
      const index = Math.floor((i / activeParticleCount) * points.length);
      wordPoints.push(points[index]);
    }
  } else {
    for (let i = 0; i < activeParticleCount; i++) {
      wordPoints.push(points[i % points.length]);
    }
  }

  return true;
};
const samplePathPoints = pathData => {
  if (!pathData) return false;
  const path = new Path2D(pathData);
  const canvas = document.createElement('canvas');
  const canvasWidth = Math.max(320, Math.floor(window.innerWidth * 0.8));
  const canvasHeight = Math.max(120, Math.floor(window.innerHeight * 0.45));
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const scaleWithParticle = clamp(getParticleSizeValue() / defaultParticleSize, 1, 2.2);
  const modelSize = Math.min(canvasWidth, canvasHeight) * 0.62 * scaleWithParticle;
  const scale = modelSize / 100;

  ctx.save();
  ctx.fillStyle = '#000';
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.scale(scale, scale);
  ctx.translate(-50, -50);
  ctx.fill(path);
  ctx.restore();

  const step = clamp(Math.round(getParticleSizeValue() * 0.85), 3, 9);
  const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const points = [];

  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      const idx = (y * canvasWidth + x) * 4 + 3;
      if (image.data[idx] > 120) {
        points.push({ x: x - canvasWidth / 2, y: y - canvasHeight / 2 });
      }
    }
  }

  if (points.length === 0) return false;

  animalPoints.length = 0;
  if (points.length >= activeParticleCount) {
    for (let i = 0; i < activeParticleCount; i++) {
      const index = Math.floor((i / activeParticleCount) * points.length);
      animalPoints.push(points[index]);
    }
  } else {
    for (let i = 0; i < activeParticleCount; i++) {
      animalPoints.push(points[i % points.length]);
    }
  }
  return true;
};
const setSwarmMode = () => {
  wordMode = false;
  animalMode = false;
};

const setActiveParticleCount = value => {
  activeParticleCount = clamp(Math.round(value), 500, maxParticleCount);
  for (let i = 0; i < particles.length; i++) {
    particles[i].style.display = i < activeParticleCount ? 'block' : 'none';
  }
  if (particleCountValue) particleCountValue.textContent = String(activeParticleCount);
  if (wordMode && wordInput && wordInput.value.trim()) sampleWordPoints(wordInput.value);
  if (animalMode) samplePathPoints(animalPathData[currentAnimalType]);
};

for (let i = 0; i < maxParticleCount; i++) {
  const $el = document.createElement('div');
  $el.className = 'particle';
  $el[particleIndex] = i;
  $el[theta] = random() * PI * 2;
  $el[radius] = target.r * sqrt(random());
  $el[prevX] = 0;
  $el[facingX] = 1;
  reseedAnimalAnchors($el, 'bird');
  particles.push($el);
  document.body.appendChild($el);
}
setActiveParticleCount(activeParticleCount);

const tl = createTimeline({
  defaults: {
    loop: true,
    ease: 'inOut(1.3)',
    onLoop: self => self.refresh(),
  },
});

tl.add('.particle', {
  x: $el => {
    if (animalMode) {
      if ($el[particleIndex] >= activeParticleCount) return 100000;
      const p = animalPoints[$el[particleIndex]];
      return p ? p.x + getWordWobble($el, 'x') : 0;
    }
    if (wordMode) {
      if ($el[particleIndex] >= activeParticleCount) return 100000;
      const p = getWordPoint($el);
      return p
        ? p.x + getWordWobble($el, 'x') + getWordModeAnimalOffset($el, 'x')
        : 0;
    }
    const shape = document.body.dataset.shape || 'dot';
    if (isCurveBehavior()) return getCurveBehaviorPosition($el, 'x');
    if (usesAnimalBehavior(shape)) return getAnimalPosition($el, 'x');
    return target.x
      + (spreadScale * $el[radius] * cos($el[theta]));
  },
  y: $el => {
    if (animalMode) {
      if ($el[particleIndex] >= activeParticleCount) return 100000;
      const p = animalPoints[$el[particleIndex]];
      return p ? p.y + getWordWobble($el, 'y') : 0;
    }
    if (wordMode) {
      if ($el[particleIndex] >= activeParticleCount) return 100000;
      const p = getWordPoint($el);
      return p
        ? p.y + getWordWobble($el, 'y') + getWordModeAnimalOffset($el, 'y')
        : 0;
    }
    const shape = document.body.dataset.shape || 'dot';
    if (isCurveBehavior()) return getCurveBehaviorPosition($el, 'y');
    if (usesAnimalBehavior(shape)) return getAnimalPosition($el, 'y');
    return target.y
      + (spreadScale * $el[radius] * sin($el[theta]));
  },
  scaleX: $el => {
    const shape = document.body.dataset.shape || 'dot';
    return shape === 'fish' ? ($el[facingX] || 1) : 1;
  },
  duration: () => (duration + utils.random(-100, 100)) / speedScale,
  ease: 'inOut(1.5)',
  onLoop: self => {
    if (isCurveBehavior()) {
      self.refresh();
      return;
    }
    const shape = document.body.dataset.shape || 'dot';
    if (usesAnimalBehavior(shape)) {
      const t = self.targets[0];
      if (shape === 'rabbit') {
        t[homeX] = t[altX];
        t[homeY] = t[altY];
      }
      reseedAnimalAnchors(t, shape);
      self.refresh();
      return;
    }
    if (wordMode || animalMode) {
      self.refresh();
      return;
    }
    const t = self.targets[0];
    t[theta] = random() * PI * 2;
    t[radius] = target.r * sqrt(random());
    self.refresh();
  },
}, stagger((duration / 2500) * 1.125))
  .add(target, {
    r: () => win.w * utils.random(0.05, 0.5, 2),
    duration: () => 1250 / speedScale,
  }, 0)
  .add(target, {
    x: () => utils.random(-win.w, win.w),
    modifier: x => x + sin(tl.currentTime * 0.0007 * speedScale) * (win.w * 0.65),
    duration: () => 2800 / speedScale,
  }, 0)
  .add(target, {
    y: () => utils.random(-win.h, win.h),
    modifier: y => y + cos(tl.currentTime * 0.00012 * speedScale) * (win.h * 0.65),
    duration: () => 1800 / speedScale,
  }, 0);

tl.seek(20000);

if (bgColorInput) {
  bgColorInput.addEventListener('input', event => {
    document.documentElement.style.setProperty('--bg-color', event.target.value);
  });
}

if (particleColorInput) {
  particleColorInput.addEventListener('input', event => {
    document.documentElement.style.setProperty('--particle-color', event.target.value);
  });
}

if (shapeInput) {
  shapeInput.addEventListener('change', event => {
    document.body.dataset.shape = event.target.value;
  });
}

if (behaviorInputs.length > 0) {
  behaviorInputs.forEach(input => {
    input.addEventListener('change', event => {
      setBehaviorMode(event.target.value);
      tl.refresh();
    });
  });
}

const setParticleShape = shape => {
  document.body.dataset.shape = shape;
  if (shapeInput && ['dot', 'square', 'heart', 'star'].includes(shape)) {
    shapeInput.value = shape;
  }
};
const setBehaviorMode = mode => {
  behaviorMode = mode;
  if (behaviorInputs.length > 0) {
    behaviorInputs.forEach(input => {
      input.checked = input.value === mode;
    });
  }
};

if (shapeBirdButton) {
  shapeBirdButton.addEventListener('click', () => setParticleShape('bird'));
}

if (shapeFishButton) {
  shapeFishButton.addEventListener('click', () => setParticleShape('fish'));
}

if (shapeRabbitButton) {
  shapeRabbitButton.addEventListener('click', () => setParticleShape('rabbit'));
}

if (particleSizeInput && particleSizeValue) {
  particleSizeInput.addEventListener('input', event => {
    const sizeValue = Number(event.target.value);
    const size = `${sizeValue}px`;
    spreadScale = Math.max(1, sizeValue / defaultParticleSize);

    document.documentElement.style.setProperty('--particle-size', size);
    particleSizeValue.textContent = size;
    if (wordMode && wordInput && wordInput.value.trim()) {
      sampleWordPoints(wordInput.value);
    }
    if (animalMode) {
      samplePathPoints(animalPathData[currentAnimalType]);
    }
    tl.refresh();
  });
}

if (particleSpeedInput && particleSpeedValue) {
  particleSpeedInput.addEventListener('input', event => {
    speedScale = Number(event.target.value);
    particleSpeedValue.textContent = `${speedScale.toFixed(1)}x`;
    tl.refresh();
  });
}

if (particleCountInput && particleCountValue) {
  particleCountInput.addEventListener('input', event => {
    setActiveParticleCount(Number(event.target.value));
    tl.refresh();
  });
}

if (randomizeButton) {
  randomizeButton.addEventListener('click', () => {
    const randomHex = `#${Math.floor(random() * 16777215).toString(16).padStart(6, '0')}`;
    const randomHex2 = `#${Math.floor(random() * 16777215).toString(16).padStart(6, '0')}`;
    const shapes = ['dot', 'square', 'heart', 'star', 'bird', 'fish', 'rabbit'];
    const behaviors = [
      'swarm',
      'planetsystem',
      'infinity',
      'lissajous',
      'rainumbrella',
      'lifeline',
      'swarmhug',
      'vortex',
      'galaxy',
      'pulsar',
      'petalbloom',
      'candyspiral',
    ];
    const nextShape = shapes[Math.floor(random() * shapes.length)];
    const nextBehavior = behaviors[Math.floor(random() * behaviors.length)];
    const nextSize = String(
      Math.floor(random() * (maxParticleSize - minParticleSize + 1)) + minParticleSize
    );
    const nextSizeValue = Number(nextSize);
    const nextSpeed = (0.4 + random() * (2.5 - 0.4)).toFixed(1);
    const nextSpeedValue = Number(nextSpeed);
    spreadScale = Math.max(1, nextSizeValue / defaultParticleSize);
    speedScale = nextSpeedValue;

    document.documentElement.style.setProperty('--bg-color', randomHex);
    document.documentElement.style.setProperty('--particle-color', randomHex2);
    document.documentElement.style.setProperty('--particle-size', `${nextSize}px`);
    setParticleShape(nextShape);
    setBehaviorMode(nextBehavior);
    setSwarmMode();
    tl.refresh();

    if (bgColorInput) bgColorInput.value = randomHex;
    if (particleColorInput) particleColorInput.value = randomHex2;
    if (shapeInput && ['dot', 'square', 'heart', 'star'].includes(nextShape)) {
      shapeInput.value = nextShape;
    }
    if (particleSizeInput) particleSizeInput.value = nextSize;
    if (particleSizeValue) particleSizeValue.textContent = `${nextSize}px`;
    if (particleSpeedInput) particleSpeedInput.value = nextSpeed;
    if (particleSpeedValue) particleSpeedValue.textContent = `${nextSpeed}x`;
  });
}

const applyWord = () => {
  if (!wordInput) return;
  if (sampleWordPoints(wordInput.value)) {
    wordMode = true;
    animalMode = false;
    tl.refresh();
  }
};

if (applyWordButton) {
  applyWordButton.addEventListener('click', applyWord);
}

if (bookWordButton) {
  bookWordButton.addEventListener('click', () => {
    const line = bookLines[Math.floor(random() * bookLines.length)];
    if (wordInput) wordInput.value = line;
    applyWord();
  });
}

if (wordInput) {
  wordInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') applyWord();
  });
}