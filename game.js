/* 
================================================================================
   GRAPH QUEST: BFS vs DFS — GAME ENGINE v2.0
   AAA-Quality Fantasy Adventure Educational Web Game
================================================================================
*/

'use strict';

// ============================================================================
// 1. REGION & LEVEL DATA
// ============================================================================
const REGIONS = {
  FOREST: {
    name: "Ancient Forest Kingdom",
    sky: ["#020d05","#091d11","#15331e"],
    mid: ["rgba(5,30,10,0.6)","rgba(10,50,20,0.4)"],
    fog: "rgba(20,80,30,0.08)",
    particleColor: "#39ff14", particleGlow: "rgba(57,255,20,0.6)",
    ambientNote: 220, starCount: 60, starColor: "rgba(180,255,160,{a})"
  },
  VALLEY: {
    name: "Magical Waterfall Valleys",
    sky: ["#020b12","#05151e","#0e2c3d"],
    mid: ["rgba(5,25,40,0.5)","rgba(10,40,60,0.3)"],
    fog: "rgba(0,180,220,0.05)",
    particleColor: "#00e5ff", particleGlow: "rgba(0,229,255,0.5)",
    ambientNote: 261.63, starCount: 80, starColor: "rgba(160,220,255,{a})"
  },
  SKYLANDS: {
    name: "Floating Sky Islands",
    sky: ["#050a14","#0d1320","#1a253a"],
    mid: ["rgba(20,30,60,0.5)","rgba(30,50,90,0.3)"],
    fog: "rgba(100,150,255,0.04)",
    particleColor: "#c8d8ff", particleGlow: "rgba(200,216,255,0.5)",
    ambientNote: 293.66, starCount: 120, starColor: "rgba(220,230,255,{a})"
  },
  CAVERNS: {
    name: "Lava Caverns",
    sky: ["#0a0101","#170505","#300c0c"],
    mid: ["rgba(60,10,5,0.5)","rgba(100,20,5,0.3)"],
    fog: "rgba(255,60,0,0.05)",
    particleColor: "#ff5500", particleGlow: "rgba(255,85,0,0.6)",
    ambientNote: 196.00, starCount: 20, starColor: "rgba(255,100,50,{a})"
  },
  RUINS: {
    name: "Forgotten Ruins",
    sky: ["#050505","#0e0f12","#1e222b"],
    mid: ["rgba(30,25,10,0.5)","rgba(50,45,15,0.3)"],
    fog: "rgba(200,180,50,0.04)",
    particleColor: "#c8a000", particleGlow: "rgba(200,160,0,0.5)",
    ambientNote: 220.00, starCount: 90, starColor: "rgba(220,200,100,{a})"
  },
  CELESTIAL: {
    name: "Celestial Temple",
    sky: ["#03010a","#0f0b1a","#1c1535"],
    mid: ["rgba(40,10,80,0.5)","rgba(60,20,120,0.3)"],
    fog: "rgba(180,100,255,0.06)",
    particleColor: "#da70d6", particleGlow: "rgba(218,112,214,0.6)",
    ambientNote: 329.63, starCount: 150, starColor: "rgba(220,180,255,{a})"
  }
};

const LEVELS = [
  {
    id:1, name:"Elderwood Grove", region:"FOREST", mode:"DFS",
    startNode:"A", goalNode:"E",
    description:"The forest remembers every path ever taken. DFS dives deep, trusting the stack — push forward until you must retreat.",
    nodes:{
      "A":{ label:"A", name:"Elder Shrine",   x:160, y:280, type:"shrine" },
      "B":{ label:"B", name:"Shadow Grove",   x:380, y:140, type:"shrine" },
      "C":{ label:"C", name:"Hollow Trunk",   x:380, y:420, type:"shrine" },
      "D":{ label:"D", name:"Druid Cairn",    x:590, y:140, type:"shrine" },
      "E":{ label:"E", name:"The Great Oak",  x:750, y:280, type:"shrine" }
    },
    edges:[["A","B"],["A","C"],["B","D"],["D","E"],["C","E"]]
  },
  {
    id:2, name:"Whispering Falls", region:"VALLEY", mode:"BFS",
    startNode:"A", goalNode:"F",
    description:"The river scouts every bank before diving deeper. BFS expands in rings — nearest shores first, then the horizon.",
    nodes:{
      "A":{ label:"A", name:"Waterfall Gate",  x:130, y:280, type:"village" },
      "B":{ label:"B", name:"Creek Camp",      x:330, y:130, type:"village" },
      "C":{ label:"C", name:"River Hub",       x:330, y:280, type:"village" },
      "D":{ label:"D", name:"Wetland Sentry",  x:330, y:430, type:"village" },
      "E":{ label:"E", name:"Fern Valley",     x:560, y:185, type:"village" },
      "F":{ label:"F", name:"Cascade Temple",  x:770, y:280, type:"village" }
    },
    edges:[["A","B"],["A","C"],["A","D"],["B","E"],["C","E"],["D","F"],["E","F"]]
  },
  {
    id:3, name:"Skyland Archipelagos", region:"SKYLANDS", mode:"BFS",
    startNode:"A", goalNode:"G",
    description:"Islands drift in stellar winds. Map every adjacent island before leaping to the next tier — the sky demands order.",
    nodes:{
      "A":{ label:"A", name:"Nimbus Arch",        x:120, y:280, type:"portal" },
      "B":{ label:"B", name:"Zephyr Spire",        x:320, y:140, type:"portal" },
      "C":{ label:"C", name:"Aether Pod",          x:320, y:420, type:"portal" },
      "D":{ label:"D", name:"Sky Forge",           x:520, y:120, type:"portal" },
      "E":{ label:"E", name:"Cloud Haven",         x:520, y:440, type:"portal" },
      "F":{ label:"F", name:"Starlight Obelisk",   x:640, y:280, type:"portal" },
      "G":{ label:"G", name:"Celestial Void",      x:820, y:280, type:"portal" }
    },
    edges:[["A","B"],["A","C"],["B","D"],["B","F"],["C","E"],["C","F"],["D","G"],["E","G"],["F","G"]]
  },
  {
    id:4, name:"Obsidian Depths", region:"CAVERNS", mode:"DFS",
    startNode:"A", goalNode:"G",
    description:"In the lava tunnels, the fearless descend without looking back. DFS follows one path to its molten core before retreating.",
    nodes:{
      "A":{ label:"A", name:"Basalt Entry",     x:130, y:280, type:"crystal" },
      "B":{ label:"B", name:"Ash Vent",         x:290, y:140, type:"crystal" },
      "C":{ label:"C", name:"Magma Fissure",    x:460, y:140, type:"crystal" },
      "D":{ label:"D", name:"Geothermal Core",  x:630, y:140, type:"crystal" },
      "E":{ label:"E", name:"Amber Chamber",    x:330, y:430, type:"crystal" },
      "F":{ label:"F", name:"Obsidian Gorge",   x:530, y:430, type:"crystal" },
      "G":{ label:"G", name:"Core Caldera",     x:800, y:280, type:"crystal" }
    },
    edges:[["A","B"],["B","C"],["C","D"],["D","G"],["A","E"],["E","F"],["F","G"]]
  },
  {
    id:5, name:"Lost City of Runes", region:"RUINS", mode:"BFS",
    startNode:"A", goalNode:"H",
    description:"The ancient city is a maze of echoes. Only BFS' systematic sweep will reveal the true shortest path through its corridors.",
    nodes:{
      "A":{ label:"A", name:"Decayed Bridge",   x:120, y:280, type:"rune" },
      "B":{ label:"B", name:"Echo Archway",     x:300, y:140, type:"rune" },
      "C":{ label:"C", name:"Sanctum Core",     x:300, y:420, type:"rune" },
      "D":{ label:"D", name:"Pillar of Light",  x:490, y:110, type:"rune" },
      "E":{ label:"E", name:"Sunken Archives",  x:490, y:280, type:"rune" },
      "F":{ label:"F", name:"Iron Vault",       x:490, y:450, type:"rune" },
      "G":{ label:"G", name:"Altar of Sands",   x:670, y:185, type:"rune" },
      "H":{ label:"H", name:"Rune Portal",      x:820, y:280, type:"rune" }
    },
    edges:[["A","B"],["A","C"],["B","D"],["B","E"],["C","E"],["C","F"],["D","G"],["E","G"],["F","H"],["G","H"]]
  },
  {
    id:6, name:"Celestial Nexus", region:"CELESTIAL", mode:"BFS",
    startNode:"A", goalNode:"I",
    description:"The Nexus Guardian weaves both algorithms into its shields. Master BFS and DFS — swap them mid-battle to find the way through.",
    nodes:{
      "A":{ label:"A", name:"Temple Portal",     x:100, y:280, type:"orb" },
      "B":{ label:"B", name:"Lower Ward",        x:270, y:140, type:"orb" },
      "C":{ label:"C", name:"Upper Ward",        x:270, y:420, type:"orb" },
      "D":{ label:"D", name:"Inner West Ring",   x:450, y:100, type:"orb" },
      "E":{ label:"E", name:"Heart of Nexus",    x:450, y:280, type:"orb" },
      "F":{ label:"F", name:"Inner East Ring",   x:450, y:460, type:"orb" },
      "G":{ label:"G", name:"Sanctuary Arch",    x:630, y:140, type:"orb" },
      "H":{ label:"H", name:"Solstice Chamber",  x:630, y:420, type:"orb" },
      "I":{ label:"I", name:"Celestial Throne",  x:820, y:280, type:"orb" }
    },
    edges:[["A","B"],["A","C"],["B","D"],["B","E"],["C","E"],["C","F"],["D","G"],["E","G"],["E","H"],["F","H"],["G","I"],["H","I"]]
  }
];

// Rich AI dialogue banks
const ARIA_DIALOGUE = {
  greeting: [
    "The paths shimmer before us! Hover over nodes to preview connections, then click the correct one.",
    "Welcome, Pathfinder! Remember — the algorithm dictates which node you may visit next.",
    "The forest watches our every step. Choose wisely — the algorithm never forgives impatience."
  ],
  correctBFS: [
    (n,q)=>`Brilliant! "${n}" sits at the BFS frontier — adjacent to our queue's front node. Enqueuing it now!`,
    (n,q)=>`Well navigated! BFS expands layer by layer. "${n}" is exactly at distance-depth ${q} from start.`,
    (n,q)=>`The scroll queue grows! "${n}" was the right choice — nearest unvisited node on our frontier.`
  ],
  correctDFS: [
    (n,s)=>`Onward! DFS pushes "${n}" onto the crystal stack. We go deeper into this branch first.`,
    (n,s)=>`Excellent! The stack now holds ${s} crystals. DFS commits to depth before exploring siblings.`,
    (n,s)=>`Deep courage! We descend to "${n}". If this branch dead-ends, we'll backtrack up the stack.`
  ],
  wrongBFS: [
    (front)=>`Not yet! BFS must finish the current layer. Our queue front is "${front}" — explore its neighbors first.`,
    (front)=>`Patience! BFS is systematic. We haven't finished all nodes at this depth. Check the scroll queue.`,
    (front)=>`Wrong frontier! BFS visits level by level. "${front}" is the active queue head — find its unvisited neighbors.`
  ],
  wrongDFS: [
    (top)=>`Hold! DFS stays on the current branch. Only neighbors of the stack's top crystal "${top}" are valid next moves.`,
    (top)=>`Not that path! DFS is committed to depth. Our stack top is "${top}" — go deeper from there.`,
    (top)=>`The stack doesn't lie! We must explore from "${top}" before considering other branches.`
  ],
  backtrack: [
    "Dead end! The stack crystal shatters — DFS backtracks to find an unexplored branch.",
    "No unvisited neighbors here. We pop the stack and retreat to the previous encampment.",
    "DFS backtracks gracefully. The crystal stack guides our retreat until we find new territory."
  ],
  victory: [
    "The realm is restored! You traversed every node with algorithmic perfection!",
    "The pathways glow gold — a complete and correct traversal! Well done, Pathfinder!",
    "The Guardian bows! You've mastered this realm's graph. Onward to the next horizon!"
  ],
  hint: [
    (n)=>`Hint Vision reveals: "${n}" is the next correct node by the active algorithm's rules.`,
    (n)=>`My owlish eyes see clearly — visit "${n}" next!`,
    (n)=>`The correct path leads to "${n}". Trust the frontier!`
  ]
};

function randomDialogue(bank, ...args) {
  const fn = bank[Math.floor(Math.random() * bank.length)];
  return typeof fn === 'function' ? fn(...args) : fn;
}

// ============================================================================
// 2. FANTASY WEB AUDIO SYNTHESIZER
// ============================================================================
class FantasySynth {
  constructor() {
    this.ctx = null;
    this.masterVol = null;
    this.isMuted = false;
    this.ambientInterval = null;
    this.activeOscillators = [];
  }

  lazyInit() {
    if (this.ctx) {
      // Resume if suspended (browser autoplay policy)
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterVol = this.ctx.createGain();
      this.masterVol.gain.value = 0.22;
      this.masterVol.connect(this.ctx.destination);
    } catch(e) { console.warn('Web Audio unavailable'); }
  }

  setMute(muted) {
    this.isMuted = muted;
    if (this.masterVol) this.masterVol.gain.value = muted ? 0 : 0.22;
  }

  _play(freq, type, duration, gainPeak, delay=0, freqEnd=null) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.8);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env); env.connect(this.masterVol);
    osc.start(now); osc.stop(now + duration + 0.05);
  }

  startAmbient(baseFreq = 220) {
    this.lazyInit();
    this.stopAmbient();
    // Pentatonic minor pad layers
    const ratios = [1, 1.19, 1.5, 1.78, 2.0];
    const play = () => {
      if (this.isMuted || !this.ctx) return;
      ratios.forEach((r, i) => {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass'; filt.frequency.value = 600;
        osc.type = 'triangle';
        osc.frequency.value = baseFreq * r + (Math.random() * 1.5 - 0.75);
        const now = this.ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.05 - i * 0.005, now + 2.5);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 9.5);
        osc.connect(filt); filt.connect(env); env.connect(this.masterVol);
        osc.start(now); osc.stop(now + 10);
      });
    };
    play();
    this.ambientInterval = setInterval(play, 9500);
  }

  stopAmbient() {
    if (this.ambientInterval) { clearInterval(this.ambientInterval); this.ambientInterval = null; }
  }

  playCorrect() {
    this.lazyInit();
    // Golden bell arpeggio C5-E5-G5-C6
    [523.25, 659.25, 783.99, 1046.5].forEach((f,i) => this._play(f,'sine',0.55,0.22,i*0.09));
  }

  playWrong() {
    this.lazyInit();
    this._play(140,'sawtooth',0.5,0.35,0,45);
    this._play(180,'square',0.3,0.1,0.05,60);
  }

  playBacktrack() {
    this.lazyInit();
    this._play(900,'sine',0.4,0.18,0,300);
    this._play(600,'triangle',0.3,0.08,0.05,250);
  }

  playHover() {
    this.lazyInit();
    this._play(1200,'sine',0.12,0.03,0,900);
  }

  playVictory() {
    this.lazyInit();
    // Ascending fanfare
    [392,523,659,784,1047].forEach((f,i) => this._play(f,'sine',0.7,0.25,i*0.12));
    this._play(1568,'triangle',1.2,0.15,0.7);
  }
}

const synth = new FantasySynth();

// ============================================================================
// 3. CANVAS RENDERER (2.5D Layered Environment + Nodes)
// ============================================================================
class GameRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.regionKey = 'FOREST';
    this.particles = [];
    this.stars = [];
    this.energyOrbs = [];        // Animated orbs traveling along edges
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.time = 0;               // global animation tick
    this.dashOffset = 0;
    this.cam = { x: 0, y: 0 };  // world-space camera offset
    this.targetCam = { x: 0, y: 0 };

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  setRegion(key) {
    this.regionKey = key;
    const r = REGIONS[key];
    this.particles = [];
    this.stars = [];
    for (let i = 0; i < 50; i++) this._spawnParticle(true);
    // Generate starfield once per region
    for (let i = 0; i < r.starCount; i++) {
      this.stars.push({
        x: Math.random() * 2000 - 500, y: Math.random() * this.canvas.height * 0.65,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.7 + 0.15,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  shake(intensity = 6, duration = 18) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  _spawnParticle(randomY = false) {
    const r = REGIONS[this.regionKey];
    const W = this.canvas.width, H = this.canvas.height;
    this.particles.push({
      x: Math.random() * W * 1.2 - W * 0.1,
      y: randomY ? Math.random() * H : -8,
      vx: (Math.random() - 0.5) * 0.8 + (this.regionKey==='CAVERNS' ? 0.3 : -0.2),
      vy: Math.random() * 1.2 + 0.4,
      r: Math.random() * 2.5 + 0.8,
      a: Math.random() * 0.6 + 0.2,
      life: Math.random() * 160 + 100,
      maxLife: 260,
      color: r.particleColor
    });
  }

  _updateParticles() {
    const W = this.canvas.width, H = this.canvas.height;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      if (p.y > H + 10 || p.life <= 0 || p.x < -20 || p.x > W + 20) {
        this.particles.splice(i, 1);
        this._spawnParticle(false);
      }
    }
  }

  // Spawn animated energy orb traveling along an edge
  spawnEnergyOrb(fromNode, toNode, mode) {
    this.energyOrbs.push({ from: fromNode, to: toNode, t: 0, speed: 0.02, mode });
  }

  _updateEnergyOrbs() {
    for (let i = this.energyOrbs.length - 1; i >= 0; i--) {
      this.energyOrbs[i].t += this.energyOrbs[i].speed;
      if (this.energyOrbs[i].t >= 1) this.energyOrbs.splice(i, 1);
    }
  }

  // Lerp camera toward the current node (world-space centering)
  focusOn(node, W, H) {
    if (node) {
      this.targetCam.x = W / 2 - node.x;
      this.targetCam.y = H / 2 - node.y;
    } else {
      this.targetCam.x = 0;
      this.targetCam.y = 0;
    }
  }

  draw(gameState, hoveredNode) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const r = REGIONS[this.regionKey];
    this.time++;
    this.dashOffset -= 0.4;

    // Camera smooth lerp
    this.cam.x += (this.targetCam.x - this.cam.x) * 0.04;
    this.cam.y += (this.targetCam.y - this.cam.y) * 0.04;

    // Screen shake
    let sx = 0, sy = 0;
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      sx = (Math.random() - 0.5) * this.shakeIntensity;
      sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
    }

    ctx.save();
    ctx.translate(sx, sy);

    // ── LAYER 1: Deep sky gradient ──
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, r.sky[0]);
    sky.addColorStop(0.55, r.sky[1]);
    sky.addColorStop(1, r.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── LAYER 2: Starfield (with parallax & twinkle) ──
    this.stars.forEach(s => {
      s.twinkle += 0.025;
      const alpha = s.a * (0.7 + 0.3 * Math.sin(s.twinkle));
      const starX = ((s.x + this.cam.x * 0.08) % (W + 300) + W + 300) % (W + 300) - 150;
      ctx.beginPath();
      ctx.arc(starX, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = r.starColor.replace('{a}', alpha.toFixed(2));
      ctx.fill();
    });

    // ── LAYER 3: Background silhouette mountains (parallax depth) ──
    this._drawMountains(ctx, W, H, r);

    // ── LAYER 4: Floating mist / fog layer ──
    const fogGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(1, r.fog);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, W, H);

    // ── LAYER 5: Particles ──
    this._updateParticles();
    this.particles.forEach(p => {
      const rg = REGIONS[this.regionKey];
      ctx.save();
      ctx.globalAlpha = p.a * (p.life / p.maxLife);
      if (this.regionKey === 'FOREST') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = rg.particleGlow;
        ctx.shadowBlur = 6;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(this.time * 0.02 + p.x);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * 2, p.r * 0.8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = rg.particleGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    });

    // ── CAMERA TRANSFORM for graph world ──
    ctx.save();
    ctx.translate(this.cam.x, this.cam.y);

    // ── LAYER 6: Edges ──
    if (gameState) this._drawEdges(ctx, gameState, hoveredNode);

    // ── LAYER 7: Energy orbs on edges ──
    this._updateEnergyOrbs();
    this._drawEnergyOrbs(ctx, gameState);

    // ── LAYER 8: Nodes ──
    if (gameState) this._drawNodes(ctx, gameState, hoveredNode);

    ctx.restore(); // end camera transform

    ctx.restore(); // end shake transform
  }

  _drawMountains(ctx, W, H, r) {
    // Far mountains (heavy parallax)
    const pxFar = this.cam.x * 0.15;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(-50, H);
    for (let x = -50; x <= W + 50; x += 60) {
      const y = H * 0.38 + Math.sin((x + pxFar) * 0.008) * H * 0.1 + Math.sin((x + pxFar) * 0.003) * H * 0.08;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 50, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Near mountains (medium parallax)
    const pxNear = this.cam.x * 0.28;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.moveTo(-50, H);
    for (let x = -50; x <= W + 50; x += 40) {
      const y = H * 0.52 + Math.sin((x + pxNear) * 0.012) * H * 0.09 + Math.sin((x + pxNear + 200) * 0.005) * H * 0.06;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 50, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Foreground treeline silhouette
    const pxFg = this.cam.x * 0.5;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-50, H);
    for (let x = -50; x <= W + 50; x += 22) {
      const h = H * 0.14 + Math.abs(Math.sin((x + pxFg) * 0.04 + 0.5)) * H * 0.08 + Math.random() * H * 0.01;
      const y = H - h;
      ctx.lineTo(x, y);
      // Pointy tree spikes
      if (Math.random() < 0.3) {
        ctx.lineTo(x + 10, y - H * 0.04);
        ctx.lineTo(x + 20, y);
      }
    }
    ctx.lineTo(W + 50, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawEdges(ctx, gs, hoveredNode) {
    gs.level.edges.forEach(([u, v]) => {
      const nU = gs.level.nodes[u], nV = gs.level.nodes[v];
      if (!nU || !nV) return;
      const bothVisited = gs.visited.has(u) && gs.visited.has(v);
      const isFrontierEdge = (gs.visited.has(u) && gs.frontier.includes(v)) ||
                             (gs.visited.has(v) && gs.frontier.includes(u));
      const isHoverEdge = (u===hoveredNode && gs.visited.has(v)) ||
                          (v===hoveredNode && gs.visited.has(u));

      ctx.save();
      ctx.lineCap = 'round';
      ctx.setLineDash([]);

      if (bothVisited) {
        // Glowing gold — explored connection
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
      } else if (isHoverEdge || (isFrontierEdge && gs.glowMode)) {
        ctx.strokeStyle = gs.mode==='BFS' ? '#00d2ff' : '#ff9d00';
        ctx.lineWidth = 3;
        ctx.shadowColor = gs.mode==='BFS' ? '#00d2ff' : '#ff9d00';
        ctx.shadowBlur = 18;
        ctx.setLineDash([8, 7]);
        ctx.lineDashOffset = this.dashOffset;
      } else if (isFrontierEdge) {
        ctx.strokeStyle = gs.mode==='BFS' ? 'rgba(0,210,255,0.45)' : 'rgba(255,157,0,0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = this.dashOffset;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1.8;
      }

      ctx.beginPath();
      ctx.moveTo(nU.x, nU.y);
      ctx.lineTo(nV.x, nV.y);
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawEnergyOrbs(ctx, gs) {
    if (!gs) return;
    this.energyOrbs.forEach(orb => {
      const nFrom = gs.level.nodes[orb.from];
      const nTo = gs.level.nodes[orb.to];
      if (!nFrom || !nTo) return;
      const x = nFrom.x + (nTo.x - nFrom.x) * orb.t;
      const y = nFrom.y + (nTo.y - nFrom.y) * orb.t;
      const color = orb.mode === 'BFS' ? '#00d2ff' : '#ff9d00';
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
    });
  }

  _drawNodes(ctx, gs, hoveredNode) {
    const t = this.time;
    Object.keys(gs.level.nodes).forEach(key => {
      const node = gs.level.nodes[key];
      const isVisited  = gs.visited.has(key);
      const isActive   = key === gs.activeNode;
      const isHovered  = key === hoveredNode;
      const isFrontier = gs.frontier.includes(key);
      const isGoal     = key === gs.level.goalNode;

      ctx.save();
      ctx.translate(node.x, node.y);

      const baseR = 26;
      let r = baseR;
      if (isActive) r = 32;
      else if (isHovered) r = 30;

      // Pulsing outer ring for current node
      if (isActive) {
        const pulse = 1 + 0.12 * Math.sin(t * 0.08);
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([5,5]);
        ctx.lineDashOffset = -this.dashOffset;
        ctx.beginPath();
        ctx.arc(0, 0, r * pulse + 10, 0, Math.PI*2);
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, r * pulse + 18, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // Goal star indicator
      if (isGoal && !isVisited) {
        const gPulse = 0.7 + 0.3 * Math.sin(t * 0.06);
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = gPulse;
        ctx.setLineDash([3,6]);
        ctx.beginPath();
        ctx.arc(0, 0, r + 14, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
        // "GOAL" label above
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 9px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = gPulse;
        ctx.fillText('⭐ GOAL', 0, -(r + 24));
        ctx.globalAlpha = 1;
      }

      // Frontier pulsing glow
      if (isFrontier && !isVisited) {
        const fPulse = 0.5 + 0.5 * Math.sin(t * 0.07 + node.x);
        const col = gs.mode==='BFS' ? '#00d2ff' : '#ff9d00';
        ctx.shadowColor = col;
        ctx.shadowBlur = 20 * fPulse;
      } else if (isActive) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
      } else if (isHovered) {
        ctx.shadowColor = gs.mode==='BFS' ? '#00d2ff' : '#ff9d00';
        ctx.shadowBlur = 22;
      }

      // Draw node shape
      this._drawNodeShape(ctx, r, node.type, isVisited, isActive, isHovered, isFrontier, gs.mode);

      // Node label (center)
      ctx.shadowBlur = 0;
      ctx.fillStyle = isActive ? '#000' : '#fff';
      ctx.font = `bold ${isActive ? 15 : 13}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, 0, 0);

      // Node name below
      ctx.fillStyle = isActive ? '#ffd700' : (isVisited ? '#a0aec0' : '#718096');
      ctx.font = `500 9px 'Outfit', sans-serif`;
      ctx.fillText(node.name.length > 14 ? node.name.slice(0,13)+'…' : node.name, 0, r + 13);

      ctx.restore();
    });
  }

  _drawNodeShape(ctx, r, type, isVisited, isActive, isHovered, isFrontier, mode) {
    // Outer animated dashed ring for hovered/frontier
    if (isHovered || (isFrontier && !isVisited)) {
      ctx.save();
      const c = isHovered ? (mode==='BFS'?'#00d2ff':'#ff9d00') : (mode==='BFS'?'rgba(0,210,255,0.5)':'rgba(255,157,0,0.5)');
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4,5]);
      ctx.beginPath();
      ctx.arc(0, 0, r+7, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Core fill color
    let fill = '#1a2332';
    let stroke = '#475569';
    if (isActive)       { fill = '#ffd700'; stroke = '#ffffff'; }
    else if (isVisited) { fill = 'rgba(44,26,14,0.92)'; stroke = '#ffd700'; }
    else if (isFrontier){ fill = mode==='BFS'?'rgba(0,40,65,0.92)':'rgba(50,25,0,0.92)'; stroke = mode==='BFS'?'#00d2ff':'#ff9d00'; }

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = isActive ? 3 : 2;

    ctx.beginPath();
    switch(type) {
      case 'shrine': // Diamond
        ctx.moveTo(0,-r); ctx.lineTo(r*0.85,0); ctx.lineTo(0,r); ctx.lineTo(-r*0.85,0);
        ctx.closePath();
        break;
      case 'village': // Circle with inner ring
        ctx.arc(0,0,r,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,0,r-6,0,Math.PI*2);
        ctx.strokeStyle = isVisited ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      case 'portal': // Pentagon
        for(let i=0;i<5;i++){const a=(i*2*Math.PI/5)-Math.PI/2;if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
        ctx.closePath();
        break;
      case 'crystal': // Hexagon
        for(let i=0;i<6;i++){const a=(i*Math.PI/3)-Math.PI/6;if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
        ctx.closePath();
        break;
      case 'rune': // Octagon
        for(let i=0;i<8;i++){const a=(i*Math.PI/4);if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
        ctx.closePath();
        break;
      case 'orb': // Circle with double ring
        ctx.arc(0,0,r,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,0,r-7,0,Math.PI*2);
        ctx.strokeStyle = isVisited?'rgba(255,215,0,0.4)':'rgba(180,150,255,0.15)';
        ctx.lineWidth=1; ctx.setLineDash([]); ctx.stroke();
        return;
      default:
        ctx.arc(0,0,r,0,Math.PI*2);
    }
    ctx.fill();
    ctx.stroke();
  }
}

// ============================================================================
// 4. TRAVERSAL ORDER PANEL (DOM-based)
// ============================================================================
class TraversalOrderPanel {
  constructor() {
    this.el = this._create();
    document.querySelector('.game-container').appendChild(this.el);
    this.visitedOrder = [];
  }

  _create() {
    const el = document.createElement('div');
    el.id = 'traversal-order-panel';
    el.innerHTML = `
      <div class="trav-title"><i class="fa-solid fa-list-ol"></i> Traversal Order</div>
      <div id="trav-list" class="trav-list"></div>
    `;
    return el;
  }

  reset() {
    this.visitedOrder = [];
    document.getElementById('trav-list').innerHTML = '';
  }

  addNode(label, name, mode) {
    this.visitedOrder.push(label);
    const list = document.getElementById('trav-list');
    const item = document.createElement('div');
    item.className = `trav-item trav-${mode.toLowerCase()}`;
    item.innerHTML = `<span class="trav-num">${this.visitedOrder.length}</span><span class="trav-label">${label}</span><span class="trav-name">${name}</span>`;
    item.style.animation = 'trav-pop 0.35s cubic-bezier(0.175,0.885,0.32,1.275)';
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }
}

// ============================================================================
// 5. MAIN GAME CONTROLLER
// ============================================================================
class GameController {
  constructor() {
    this.levelIndex = 0;
    this.score = 0;
    this.xp = 0;
    this.timer = 0;
    this._timerInterval = null;
    this.mistakes = 0;
    this.slowTimeActive = false;

    this.powerups = { hint:3, glow:2, undo:3, slow:1 };

    // Algorithm state
    this.visited  = new Set();
    this.queue    = [];
    this.stack    = [];
    this.frontier = [];
    this.history  = [];  // for Undo
    this.mode     = 'BFS';
    this.activeNode  = null;
    this.glowMode    = false;

    // Render + DOM
    this.renderer = new GameRenderer('game-canvas');
    this.travPanel = new TraversalOrderPanel();
    this.hoveredNode = null;
    this._lastHover  = null;

    this._bindDOM();
    this._buildLevelCards();
    this._setupCompanionEyes();

    // Start the render loop immediately (shows background)
    this._renderLoop();
  }

  // ─── Compute the current "game state" object passed to the renderer ───
  get gameState() {
    if (!LEVELS[this.levelIndex]) return null;
    return {
      level: LEVELS[this.levelIndex],
      visited: this.visited,
      frontier: this.frontier,
      activeNode: this.activeNode,
      mode: this.mode,
      glowMode: this.glowMode
    };
  }

  // ─── DOM Cache ───
  _bindDOM() {
    const $ = id => document.getElementById(id);
    this.dom = {
      startMenu:       $('start-menu'),
      instructModal:   $('instructions-modal'),
      feedbackOverlay: $('feedback-overlay'),
      feedbackCard:    $('feedback-card-element'),
      feedbackIcon:    $('feedback-icon-val'),
      feedbackTitle:   $('feedback-title-val'),
      feedbackExplan:  $('feedback-explanation-val'),
      victoryOverlay:  $('victory-overlay'),
      levelNum:        $('hud-level-num'),
      levelName:       $('hud-level-name'),
      modePanel:       $('hud-mode-panel'),
      modeText:        $('hud-mode-text'),
      xpText:          $('hud-xp'),
      xpFill:          $('hud-xp-fill'),
      scoreText:       $('hud-score'),
      timerText:       $('hud-timer'),
      guideDialogue:   $('guide-dialogue'),
      guideMood:       $('guide-mood'),
      stackPanel:      $('stack-panel'),
      stackList:       $('stack-nodes-list'),
      queuePanel:      $('queue-panel'),
      queueList:       $('queue-nodes-list'),
      levelSelector:   $('level-selector-container'),
      soundToggle:     $('btn-sound-toggle'),
      nodeTooltip:     $('node-tooltip'),
      victoryTime:     $('victory-time'),
      victoryMistakes: $('victory-mistakes'),
      victoryScore:    $('victory-score-label'),
      victoryNext:     $('btn-victory-next'),
      victoryMenu:     $('btn-victory-menu'),
    };

    // Button events
    $('btn-start-game').addEventListener('click', () => { synth.lazyInit(); this._hideAllOverlays(); this._loadLevel(this.levelIndex); });
    $('btn-open-instructions').addEventListener('click', () => this.dom.instructModal.classList.remove('hidden'));
    $('btn-close-instructions').addEventListener('click', () => this.dom.instructModal.classList.add('hidden'));
    $('btn-open-compare').addEventListener('click', () => { synth.lazyInit(); compareCtrl.open(); });
    $('btn-hud-menu').addEventListener('click', () => { this._stopTimer(); this.dom.startMenu.classList.remove('hidden'); });
    $('btn-hud-restart').addEventListener('click', () => this._loadLevel(this.levelIndex));
    $('btn-hud-toggle-mode').addEventListener('click', () => this._toggleMode());

    $('btn-close-feedback').addEventListener('click', () => this.dom.feedbackOverlay.classList.add('hidden'));
    this.dom.victoryNext.addEventListener('click', () => { this.dom.victoryOverlay.classList.add('hidden'); if (this.levelIndex < LEVELS.length-1) this._loadLevel(++this.levelIndex); else this.dom.startMenu.classList.remove('hidden'); });
    this.dom.victoryMenu.addEventListener('click', () => { this.dom.victoryOverlay.classList.add('hidden'); this.dom.startMenu.classList.remove('hidden'); });

    // Powerups
    $('powerup-hint').addEventListener('click', () => this._useHint());
    $('powerup-glow').addEventListener('click', () => this._useGlow());
    $('powerup-undo').addEventListener('click', () => this._useUndo());
    $('powerup-slow').addEventListener('click', () => this._useSlow());

    // Sound toggle
    this.dom.soundToggle.addEventListener('click', () => {
      synth.lazyInit();
      synth.setMute(!synth.isMuted);
      this.dom.soundToggle.innerHTML = synth.isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    });

    // Canvas
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    canvas.addEventListener('mouseleave', () => { this.hoveredNode = null; this.dom.nodeTooltip.style.display='none'; });
    canvas.addEventListener('click', e => this._onCanvasClick(e));
  }

  _hideAllOverlays() {
    ['start-menu','instructions-modal','feedback-overlay','victory-overlay']
      .forEach(id => document.getElementById(id).classList.add('hidden'));
  }

  _buildLevelCards() {
    this.dom.levelSelector.innerHTML = '';
    LEVELS.forEach((lvl, idx) => {
      const done = localStorage.getItem(`gq_done_${idx}`);
      const locked = idx > 0 && !localStorage.getItem(`gq_done_${idx-1}`);
      const card = document.createElement('div');
      card.className = `level-card ${locked?'locked':''}`;
      card.innerHTML = `
        <div class="level-card-header">
          <span class="level-card-name">Realm ${lvl.id}: ${lvl.name}</span>
          <span class="level-card-type">${lvl.mode}</span>
        </div>
        <div class="level-card-region">${REGIONS[lvl.region].name}</div>
        <div style="font-size:0.7rem;color:#885533;margin-top:4px;">${lvl.description.slice(0,70)}…</div>
        ${done ? '<div style="font-size:0.7rem;color:#4a7;margin-top:4px;">✓ Completed</div>' : ''}
        ${locked ? '<div style="font-size:0.7rem;color:#c66;margin-top:4px;">🔒 Complete previous realm first</div>' : ''}
      `;
      if (!locked) card.addEventListener('click', () => { this._hideAllOverlays(); this._loadLevel(idx); });
      this.dom.levelSelector.appendChild(card);
    });
  }

  _setupCompanionEyes() {
    const lp = document.getElementById('owl-left-pupil');
    const rp = document.getElementById('owl-right-pupil');
    if (!lp || !rp) return;
    document.addEventListener('mousemove', e => {
      const avatar = document.querySelector('.companion-avatar');
      if (!avatar) return;
      const rect = avatar.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      const angle = Math.atan2(e.clientY-cy, e.clientX-cx);
      const dist = Math.min(2.8, Math.hypot(e.clientX-cx, e.clientY-cy)/80);
      const dx = Math.cos(angle)*dist, dy = Math.sin(angle)*dist;
      if (typeof gsap !== 'undefined') {
        gsap.to([lp,rp], { x:dx, y:dy, duration:0.12, overwrite:'auto' });
      }
    });
  }

  // ─── LEVEL LOADING ───
  _loadLevel(idx) {
    this.levelIndex = idx;
    const lvl = LEVELS[idx];
    this._stopTimer();

    // Reset algorithm state
    this.visited = new Set();
    this.queue   = [];
    this.stack   = [];
    this.frontier= [];
    this.history = [];
    this.mode    = lvl.mode;
    this.activeNode = lvl.startNode;
    this.glowMode   = false;
    this.mistakes   = 0;
    this.powerups   = { hint:3, glow:2, undo:3, slow:1 };

    // Seed the algorithm
    this.visited.add(lvl.startNode);
    if (this.mode === 'BFS') this.queue.push(lvl.startNode);
    else                      this.stack.push(lvl.startNode);

    this._computeFrontier();

    // Update renderer
    this.renderer.setRegion(lvl.region);
    this.renderer.focusOn(lvl.nodes[lvl.startNode], this.renderer.canvas.width, this.renderer.canvas.height);

    // Update HUD
    this.dom.levelNum.textContent  = `Realm ${lvl.id}`;
    this.dom.levelName.textContent = lvl.name;
    this._refreshModeUI();
    this._refreshHUDStats();
    this._refreshPowerupUI();
    this._refreshMemoryUI();
    this.travPanel.reset();
    this.travPanel.addNode(lvl.startNode, lvl.nodes[lvl.startNode].name, this.mode);

    // Audio
    synth.startAmbient(REGIONS[lvl.region].ambientNote);

    // Aria greeting
    this._ariaSpeak('Happy', randomDialogue(ARIA_DIALOGUE.greeting));

    // Start timer
    this.timer = 0;
    this.slowTimeActive = false;
    this._startTimer();
  }

  _startTimer() {
    this._stopTimer();
    this._timerInterval = setInterval(() => {
      if (!this.slowTimeActive) {
        this.timer++;
        const m = String(Math.floor(this.timer/60)).padStart(2,'0');
        const s = String(this.timer%60).padStart(2,'0');
        this.dom.timerText.textContent = `${m}:${s}`;
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  // ─── ALGORITHM CORE ───
  _computeFrontier() {
    this.frontier = [];
    if (this.mode === 'BFS') {
      if (this.queue.length === 0) return;
      const head = this.queue[0];
      this.frontier = this._unvisitedNeighbors(head);
      // If queue front is exhausted, dequeue and try next
      if (this.frontier.length === 0 && this.queue.length > 1) {
        this.queue.shift();
        this._computeFrontier();
      }
    } else {
      if (this.stack.length === 0) return;
      const top = this.stack[this.stack.length - 1];
      this.frontier = this._unvisitedNeighbors(top);
      // Backtrack if dead end
      if (this.frontier.length === 0 && this.stack.length > 1) {
        this._backtrack();
      }
    }
  }

  _unvisitedNeighbors(node) {
    const lvl = LEVELS[this.levelIndex];
    const result = [];
    lvl.edges.forEach(([u,v]) => {
      if (u === node && !this.visited.has(v)) result.push(v);
      if (v === node && !this.visited.has(u)) result.push(u);
    });
    return result;
  }

  _backtrack() {
    if (this.stack.length <= 1) return;
    const popped = this.stack.pop();
    this.activeNode = this.stack[this.stack.length - 1];
    this._ariaSpeak('Thoughtful', randomDialogue(ARIA_DIALOGUE.backtrack));
    synth.playBacktrack();
    this.renderer.shake(4, 12);
    this._refreshMemoryUI();

    // Recurse until we find a node with unvisited neighbors, or stack exhausted
    if (this._unvisitedNeighbors(this.activeNode).length === 0 && this.stack.length > 1) {
      setTimeout(() => this._backtrack(), 280);
    } else {
      this.frontier = this._unvisitedNeighbors(this.activeNode);
    }
  }

  // ─── PLAYER MOVE ───
  _visitNode(label) {
    const lvl = LEVELS[this.levelIndex];
    if (this.visited.has(label)) {
      this._ariaSpeak('Thoughtful', `"${label}" is already fully explored! Seek uncharted territory.`);
      return;
    }
    const isCorrect = this.frontier.includes(label);

    if (isCorrect) {
      this._saveHistory();

      this.visited.add(label);
      this.activeNode = label;

      if (this.mode === 'BFS') this.queue.push(label);
      else                      this.stack.push(label);

      this.score += 200;
      this.xp    += 150;
      synth.playCorrect();

      // Spawn energy orb on the traversed edge
      const prevNode = this.mode === 'BFS' ? this.queue[0] : this.stack[this.stack.length-2];
      if (prevNode) this.renderer.spawnEnergyOrb(prevNode, label, this.mode);

      this.travPanel.addNode(label, lvl.nodes[label].name, this.mode);

      const stackDepth = this.mode==='BFS' ? this.queue.length : this.stack.length;
      const dialogue = this.mode === 'BFS'
        ? randomDialogue(ARIA_DIALOGUE.correctBFS, lvl.nodes[label].name, stackDepth)
        : randomDialogue(ARIA_DIALOGUE.correctDFS, lvl.nodes[label].name, stackDepth);
      this._ariaSpeak('Happy', dialogue);

      this._showFeedback(true, label);
      this._computeFrontier();
      this._refreshMemoryUI();
      this._refreshHUDStats();

      // Focus camera on new node
      this.renderer.focusOn(lvl.nodes[label], this.renderer.canvas.width, this.renderer.canvas.height);

      // Check victory
      if (label === lvl.goalNode) {
        setTimeout(() => this._triggerVictory(), 1200);
      }
    } else {
      this.score = Math.max(0, this.score - 100);
      this.mistakes++;
      synth.playWrong();
      this.renderer.shake(8, 20);

      const activeHead = this.mode==='BFS' ? this.queue[0] : this.stack[this.stack.length-1];
      const dialogue = this.mode === 'BFS'
        ? randomDialogue(ARIA_DIALOGUE.wrongBFS, activeHead)
        : randomDialogue(ARIA_DIALOGUE.wrongDFS, activeHead);
      this._ariaSpeak('Surprised', dialogue);

      this._showFeedback(false, label);
      this._refreshHUDStats();
    }
  }

  // ─── FEEDBACK MODAL ───
  _showFeedback(isCorrect, nodeLabel) {
    const lvl = LEVELS[this.levelIndex];
    const node = lvl.nodes[nodeLabel];
    this.dom.feedbackCard.className = `feedback-card ${isCorrect?'correct':'wrong'}`;
    this.dom.feedbackIcon.innerHTML = isCorrect
      ? '<i class="fa-solid fa-circle-check"></i>'
      : '<i class="fa-solid fa-circle-xmark"></i>';
    this.dom.feedbackTitle.textContent = isCorrect ? '✨ Correct Path!' : '⚠ Algorithm Deviation!';

    if (isCorrect) {
      const head = this.mode==='BFS' ? this.queue[0] : this.stack[this.stack.length-1];
      this.dom.feedbackExplan.innerHTML = this.mode === 'BFS'
        ? `<strong>BFS (Breadth-First):</strong> "${node.name} (${nodeLabel})" is an unvisited neighbor of <strong>${head}</strong>, which is the front of our FIFO scroll queue. BFS always explores the nearest undiscovered nodes first — expanding the frontier ring by ring.`
        : `<strong>DFS (Depth-First):</strong> "${node.name} (${nodeLabel})" is adjacent to <strong>${this.stack[this.stack.length-2]||lvl.startNode}</strong>, the previous top of our LIFO crystal stack. DFS commits fully to one branch, pushing deeper until it must backtrack.`;
    } else {
      const head = this.mode==='BFS' ? this.queue[0] : this.stack[this.stack.length-1];
      this.dom.feedbackExplan.innerHTML = this.mode === 'BFS'
        ? `<strong>BFS violation!</strong> You tried to visit "${node.name} (${nodeLabel})", but it is not adjacent to the queue front <strong>(${head})</strong>. BFS demands you fully explore the current frontier layer before advancing. Check the Scroll Queue — only neighbors of the front-most scroll are valid.`
        : `<strong>DFS violation!</strong> "${node.name} (${nodeLabel})" is not connected to the stack's top crystal <strong>(${head})</strong>. DFS is committed to its current branch. Only neighbors of the top crystal are valid — or wait for automatic backtracking.`;
    }

    this.dom.feedbackOverlay.classList.remove('hidden');
    // Auto-dismiss correct moves after delay, errors need manual dismiss
    if (isCorrect) setTimeout(() => this.dom.feedbackOverlay.classList.add('hidden'), 2200);
  }

  // ─── MODE TOGGLE (for Level 6 boss) ───
  _toggleMode() {
    this.mode = this.mode === 'BFS' ? 'DFS' : 'BFS';

    // Rebuild memory structure from visited set
    const visitedArr = Array.from(this.visited);
    if (this.mode === 'BFS') {
      this.queue = [...visitedArr];
      this.stack = [];
    } else {
      this.stack = [...visitedArr];
      this.queue = [];
    }
    this.frontier = [];

    this._computeFrontier();
    this._refreshModeUI();
    this._refreshMemoryUI();
    synth.playHover();
    this._ariaSpeak('Thoughtful', `Algorithm switched to ${this.mode}! The ${this.mode==='BFS'?'scroll queue':'crystal stack'} has been rebuilt from our journey so far.`);
  }

  // ─── POWERUPS ───
  _useHint() {
    if (this.powerups.hint <= 0) return;
    this.powerups.hint--;
    if (this.frontier.length > 0) {
      const n = this.frontier[0];
      const lvl = LEVELS[this.levelIndex];
      this._ariaSpeak('Thoughtful', randomDialogue(ARIA_DIALOGUE.hint, lvl.nodes[n]?.name || n));
      synth.playHover();
      // Temporarily set glowMode to highlight the path
      this.glowMode = true;
      setTimeout(() => { this.glowMode = false; }, 3500);
    } else {
      this._ariaSpeak('Thoughtful', 'No immediate frontier found — the algorithm may be backtracking. Hold steady!');
    }
    this._refreshPowerupUI();
  }

  _useGlow() {
    if (this.powerups.glow <= 0) return;
    this.powerups.glow--;
    this.glowMode = true;
    this._ariaSpeak('Happy', 'Path Glow activated! The algorithmic energy illuminates every valid route for 8 seconds.');
    synth.playCorrect();
    setTimeout(() => { this.glowMode = false; }, 8000);
    this._refreshPowerupUI();
  }

  _useUndo() {
    if (this.powerups.undo <= 0 || this.history.length === 0) return;
    this.powerups.undo--;
    const prev = this.history.pop();
    this.visited   = new Set(prev.visited);
    this.queue     = [...prev.queue];
    this.stack     = [...prev.stack];
    this.activeNode= prev.activeNode;
    this.score     = prev.score;
    this.xp        = prev.xp;
    this._computeFrontier();
    this._refreshMemoryUI();
    this._refreshHUDStats();
    this._refreshPowerupUI();
    this.travPanel.reset();
    Array.from(this.visited).forEach(v => {
      const lvl = LEVELS[this.levelIndex];
      this.travPanel.addNode(v, lvl.nodes[v]?.name || v, this.mode);
    });
    synth.playBacktrack();
    this._ariaSpeak('Thoughtful', 'The time crystal shatters — your last move has been undone. The frontier resets.');
  }

  _useSlow() {
    if (this.powerups.slow <= 0 || this.slowTimeActive) return;
    this.powerups.slow--;
    this.slowTimeActive = true;
    this._ariaSpeak('Happy', '⏳ Temporal Freeze! The timer is suspended for 20 seconds. Plan your path.');
    synth.playCorrect();
    setTimeout(() => { this.slowTimeActive = false; }, 20000);
    this._refreshPowerupUI();
  }

  _saveHistory() {
    this.history.push({
      visited:    new Set(this.visited),
      queue:      [...this.queue],
      stack:      [...this.stack],
      activeNode: this.activeNode,
      score:      this.score,
      xp:         this.xp
    });
    // Cap history to 10 states
    if (this.history.length > 10) this.history.shift();
  }

  // ─── VICTORY ───
  _triggerVictory() {
    this._stopTimer();
    localStorage.setItem(`gq_done_${this.levelIndex}`, '1');
    this._buildLevelCards();

    synth.playVictory();
    this._ariaSpeak('Happy', randomDialogue(ARIA_DIALOGUE.victory));

    const m = String(Math.floor(this.timer/60)).padStart(2,'0');
    const s = String(this.timer%60).padStart(2,'0');
    this.dom.victoryScore.textContent   = `Final Score: ${this.score.toLocaleString()}`;
    this.dom.victoryTime.textContent    = `${m}:${s}`;
    this.dom.victoryMistakes.textContent = this.mistakes;

    this.dom.victoryOverlay.classList.remove('hidden');

    // Achievements
    if (this.mistakes === 0) this._achievement('⭐ Zero Mistakes', 'Perfect traversal without a single error!');
    if (this.score >= 1800) this._achievement('💎 High Scorer', `Achieved ${this.score.toLocaleString()} points!`);
    if (this.levelIndex === 5) this._achievement('🏆 Graph Champion', 'Conquered all six realms!');
  }

  _achievement(name, desc) {
    const container = document.getElementById('achievement-toast-container');
    const el = document.createElement('div');
    el.className = 'achievement-banner';
    el.style.cssText = 'top:80px;right:20px;';
    el.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <span class="achievement-unlocked">Achievement Unlocked!</span>
        <span class="achievement-name">${name}</span>
        <span style="font-size:0.65rem;color:#a0aec0;margin-top:1px;">${desc}</span>
      </div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  // ─── HUD REFRESH ───
  _refreshModeUI() {
    const isBFS = this.mode === 'BFS';
    this.dom.modeText.textContent = `${this.mode} Mode`;
    this.dom.modePanel.className = `fantasy-panel mode-indicator ${isBFS?'bfs-mode':'dfs-mode'}`;
    this.dom.queuePanel.style.display = isBFS ? 'flex' : 'none';
    this.dom.stackPanel.style.display = isBFS ? 'none' : 'flex';
  }

  _refreshHUDStats() {
    this.dom.scoreText.textContent = String(this.score).padStart(6,'0');
    this.dom.xpText.textContent    = `${this.xp} XP`;
    const pct = Math.min(100, (this.xp % 1000) / 10);
    this.dom.xpFill.style.width = pct + '%';
  }

  _refreshPowerupUI() {
    document.getElementById('count-hint').textContent = this.powerups.hint;
    document.getElementById('count-glow').textContent = this.powerups.glow;
    document.getElementById('count-undo').textContent = this.powerups.undo;
    document.getElementById('count-slow').textContent = this.powerups.slow;
    ['hint','glow','undo','slow'].forEach(k => {
      const btn = document.getElementById(`powerup-${k}`);
      btn.classList.toggle('disabled', this.powerups[k] <= 0);
    });
  }

  _refreshMemoryUI() {
    const isBFS = this.mode === 'BFS';
    const list = isBFS ? this.queue : this.stack;

    if (isBFS) {
      this.dom.queueList.innerHTML = '';
      if (list.length === 0) {
        this.dom.queueList.innerHTML = '<div class="mem-empty">Queue Empty</div>';
        return;
      }
      list.forEach((n,i) => {
        const el = document.createElement('div');
        el.className = `queue-scroll ${i===0?'front-active':''}`;
        el.innerHTML = `<i class="fa-solid fa-scroll"></i> ${n}`;
        this.dom.queueList.appendChild(el);
      });
    } else {
      this.dom.stackList.innerHTML = '';
      if (list.length === 0) {
        this.dom.stackList.innerHTML = '<div class="mem-empty">Stack Empty</div>';
        return;
      }
      list.forEach(n => {
        const el = document.createElement('div');
        el.className = 'stack-crystal';
        el.innerHTML = `<i class="fa-solid fa-gem"></i> ${n}`;
        this.dom.stackList.prepend(el);
      });
    }
  }

  // ─── ARIA GUIDE ───
  _ariaSpeak(mood, text) {
    this.dom.guideMood.textContent    = mood;
    this.dom.guideDialogue.textContent = text;
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('#ai-guide-box', {y:0}, {y:-8, duration:0.15, yoyo:true, repeat:1, ease:'power1.out'});
    }
  }

  // ─── MOUSE HANDLING ───
  _worldPos(e) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Invert camera offset to get world coordinates
    return { x: mx - this.renderer.cam.x, y: my - this.renderer.cam.y };
  }

  _onMouseMove(e) {
    if (!LEVELS[this.levelIndex]) return;
    const { x, y } = this._worldPos(e);
    const lvl = LEVELS[this.levelIndex];
    let hit = null;
    Object.keys(lvl.nodes).forEach(k => {
      const n = lvl.nodes[k];
      if (Math.hypot(n.x - x, n.y - y) < 34) hit = k;
    });

    if (hit !== this._lastHover) {
      this._lastHover = hit;
      this.hoveredNode = hit;
      if (hit) {
        synth.playHover();
        this._showTooltip(e, hit);
      } else {
        this.dom.nodeTooltip.style.display = 'none';
      }
    } else if (hit) {
      // Update tooltip position
      this.dom.nodeTooltip.style.left = (e.clientX + 16) + 'px';
      this.dom.nodeTooltip.style.top  = (e.clientY + 16) + 'px';
    }
  }

  _showTooltip(e, key) {
    const lvl = LEVELS[this.levelIndex];
    const node = lvl.nodes[key];
    const isVisited  = this.visited.has(key);
    const isFrontier = this.frontier.includes(key);
    const isGoal     = key === lvl.goalNode;
    let status, statusColor;
    if (isVisited)        { status='Explored'; statusColor='#ffd700'; }
    else if (isFrontier)  { status=`Valid Frontier (${this.mode} next)`; statusColor=this.mode==='BFS'?'#00d2ff':'#ff9d00'; }
    else                  { status='Unvisited — not in frontier yet'; statusColor='#718096'; }

    this.dom.nodeTooltip.innerHTML = `
      <div style="font-family:'Cinzel',serif;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:5px;color:#ffd700;">
        ${isGoal?'⭐ ':''} Node ${key}
      </div>
      <div style="font-size:0.78rem;font-weight:600;color:#e2e8f0;margin-bottom:3px;">${node.name}</div>
      <div style="font-size:0.7rem;color:${statusColor};">${status}</div>
    `;
    this.dom.nodeTooltip.style.left    = (e.clientX + 16) + 'px';
    this.dom.nodeTooltip.style.top     = (e.clientY + 16) + 'px';
    this.dom.nodeTooltip.style.display = 'block';
  }

  _onCanvasClick(e) {
    if (!this.hoveredNode) return;
    if (!LEVELS[this.levelIndex]) return;
    // Close feedback first if visible
    this.dom.feedbackOverlay.classList.add('hidden');
    this._visitNode(this.hoveredNode);
  }

  // ─── RENDER LOOP ───
  _renderLoop() {
    const step = () => {
      this.renderer.draw(this.gameState, this.hoveredNode);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

// ============================================================================
// 6. COMPARE REALMS CONTROLLER (Split-Screen Side-by-Side Simulation)
// ============================================================================
class CompareRealmsController {
  constructor() {
    this.modal     = document.getElementById('compare-realms-modal');
    this.bfsCanvas = document.getElementById('compare-bfs-canvas');
    this.dfsCanvas = document.getElementById('compare-dfs-canvas');
    this.bfsCtx    = this.bfsCanvas.getContext('2d');
    this.dfsCtx    = this.dfsCanvas.getContext('2d');
    this.isRunning = false;
    this.simInterval = null;
    this.speed = 900;
    this.bfsState = null;
    this.dfsState = null;
    this.graph = null;
    this._looping = false;
    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('btn-compare-run').addEventListener('click', () => {
      if (this.isRunning) this._pause(); else this._play();
    });
    document.getElementById('btn-compare-reset').addEventListener('click', () => this._reset());
    document.getElementById('btn-compare-close').addEventListener('click', () => this.close());
    const slider = document.getElementById('compare-speed-slider');
    slider.addEventListener('input', e => {
      this.speed = parseInt(e.target.value);
      document.getElementById('compare-speed-text').textContent = (this.speed/1000).toFixed(1)+'s';
      if (this.isRunning) { this._pause(); this._play(); }
    });
  }

  open() {
    this.modal.classList.remove('hidden');
    this._resizeCanvases();
    this._reset();
    if (!this._looping) { this._looping = true; this._drawLoop(); }
  }

  close() {
    this._pause();
    this.modal.classList.add('hidden');
  }

  _resizeCanvases() {
    [this.bfsCanvas, this.dfsCanvas].forEach(c => {
      const p = c.parentElement;
      c.width  = p.clientWidth  || 400;
      c.height = p.clientHeight || 300;
    });
  }

  _reset() {
    this._pause();
    this.graph = {
      start:'A', goal:'H',
      nodes:{
        A:{x:70, y:140}, B:{x:180,y:70},  C:{x:180,y:210},
        D:{x:300,y:50},  E:{x:300,y:140}, F:{x:300,y:230},
        G:{x:410,y:95},  H:{x:500,y:140}
      },
      edges:[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['F','H'],['G','H']]
    };
    this.bfsState = { queue:['A'], visited:new Set(['A']), parent:{}, current:'A', done:false, maxMem:1, steps:0, path:null };
    this.dfsState = { stack:['A'], visited:new Set(['A']), parent:{}, current:'A', done:false, maxMem:1, steps:0, path:null };
    this._updateStats();
    document.getElementById('btn-compare-run').innerHTML = '<i class="fa-solid fa-play"></i> Start Race';
  }

  _play() {
    if (this.bfsState.done && this.dfsState.done) this._reset();
    this.isRunning = true;
    document.getElementById('btn-compare-run').innerHTML = '<i class="fa-solid fa-pause"></i> Pause Race';
    synth.lazyInit();
    this.simInterval = setInterval(() => {
      this._stepBFS();
      this._stepDFS();
      this._updateStats();
      if (this.bfsState.done && this.dfsState.done) this._pause();
    }, this.speed);
  }

  _pause() {
    this.isRunning = false;
    document.getElementById('btn-compare-run').innerHTML = '<i class="fa-solid fa-play"></i> Start Race';
    clearInterval(this.simInterval); this.simInterval = null;
  }

  _stepBFS() {
    const s = this.bfsState;
    if (s.done || s.queue.length === 0) { s.done = true; return; }
    s.steps++;
    const curr = s.queue.shift();
    s.current = curr;
    if (curr === this.graph.goal) { s.done = true; s.path = this._reconstructPath(s.parent, this.graph.goal); return; }
    this._neighbors(curr).forEach(n => {
      if (!s.visited.has(n)) { s.visited.add(n); s.parent[n]=curr; s.queue.push(n); }
    });
    s.maxMem = Math.max(s.maxMem, s.queue.length);
  }

  _stepDFS() {
    const s = this.dfsState;
    if (s.done || s.stack.length === 0) { s.done = true; return; }
    s.steps++;
    const curr = s.stack.pop();
    s.current = curr;
    if (curr === this.graph.goal) { s.done = true; s.path = this._reconstructPath(s.parent, this.graph.goal); return; }
    this._neighbors(curr).reverse().forEach(n => {
      if (!s.visited.has(n)) { s.visited.add(n); s.parent[n]=curr; s.stack.push(n); }
    });
    s.maxMem = Math.max(s.maxMem, s.stack.length);
  }

  _neighbors(n) {
    const res = [];
    this.graph.edges.forEach(([u,v]) => {
      if (u===n) res.push(v);
      if (v===n) res.push(u);
    });
    return res;
  }

  _reconstructPath(parent, goal) {
    const path = []; let c = goal;
    while(c) { path.unshift(c); c = parent[c]; }
    return path;
  }

  _updateStats() {
    const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
    set('comp-bfs-visited', this.bfsState.visited.size);
    set('comp-bfs-max-mem', this.bfsState.maxMem);
    set('comp-bfs-steps',   this.bfsState.steps);
    set('comp-bfs-path-len', this.bfsState.path ? this.bfsState.path.length : '-');
    set('comp-dfs-visited', this.dfsState.visited.size);
    set('comp-dfs-max-mem', this.dfsState.maxMem);
    set('comp-dfs-steps',   this.dfsState.steps);
    set('comp-dfs-path-len', this.dfsState.path ? this.dfsState.path.length : '-');
  }

  _drawLoop() {
    const tick = () => {
      if (this.modal.classList.contains('hidden')) { this._looping = false; return; }
      if (this.graph) {
        this._drawGraph(this.bfsCtx, this.bfsState, 'BFS');
        this._drawGraph(this.dfsCtx, this.dfsState, 'DFS');
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _drawGraph(ctx, state, mode) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    if (!W || !H) return;
    const scaleX = W / 560, scaleY = H / 310;

    // Background
    const bg = ctx.createLinearGradient(0,0,0,H);
    if (mode==='BFS') { bg.addColorStop(0,'#06101a'); bg.addColorStop(1,'#0e2035'); }
    else              { bg.addColorStop(0,'#110606'); bg.addColorStop(1,'#251010'); }
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Edges
    this.graph.edges.forEach(([u,v]) => {
      const nU = this.graph.nodes[u], nV = this.graph.nodes[v];
      const x1=nU.x*scaleX, y1=nU.y*scaleY, x2=nV.x*scaleX, y2=nV.y*scaleY;
      const inPath = state.path && state.path.includes(u) && state.path.includes(v);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      if (inPath) {
        ctx.strokeStyle='#ffd700'; ctx.lineWidth=3.5;
        ctx.shadowColor='#ffd700'; ctx.shadowBlur=12;
      } else if (state.visited.has(u) && state.visited.has(v)) {
        ctx.strokeStyle = mode==='BFS'?'rgba(0,210,255,0.45)':'rgba(255,157,0,0.45)';
        ctx.lineWidth=2;
      } else {
        ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1.5;
      }
      ctx.stroke(); ctx.restore();
    });

    // Nodes
    Object.keys(this.graph.nodes).forEach(k => {
      const node = this.graph.nodes[k];
      const x = node.x*scaleX, y = node.y*scaleY;
      const isVisited = state.visited.has(k);
      const isCurrent = state.current === k;
      const isGoal    = k === this.graph.goal;
      const inPath    = state.path && state.path.includes(k);

      ctx.save();
      ctx.translate(x, y);

      let fill = '#1a2332', stroke = '#475569', r = 14;
      if (isCurrent) { fill='#ffffff'; stroke=mode==='BFS'?'#00d2ff':'#ff9d00'; r=19; ctx.shadowColor=stroke; ctx.shadowBlur=18; }
      else if (inPath) { fill=mode==='BFS'?'#005580':'#803300'; stroke='#ffd700'; }
      else if (isVisited) { fill=mode==='BFS'?'#003d60':'#602000'; stroke=mode==='BFS'?'#00d2ff':'#ff9d00'; }
      if (isGoal) { stroke='#ffd700'; ctx.shadowColor='#ffd700'; ctx.shadowBlur=14; }

      ctx.fillStyle=fill; ctx.strokeStyle=stroke; ctx.lineWidth=isCurrent?2.5:1.8;
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); ctx.stroke();

      ctx.shadowBlur=0;
      ctx.fillStyle = isCurrent?'#000':'#fff';
      ctx.font=`bold ${isCurrent?10:8}px Cinzel,serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(k,0,0);
      ctx.restore();
    });

    // Overlay banner if done
    if (state.done) {
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,0.55)';
      ctx.fillRect(0, H/2-28, W, 56);
      ctx.fillStyle = mode==='BFS'?'#00d2ff':'#ff9d00';
      ctx.font=`bold 14px Cinzel,serif`;
      ctx.textAlign='center';
      ctx.fillText(`${mode} COMPLETE — Path length: ${state.path?state.path.length:'-'} nodes`, W/2, H/2);
      ctx.restore();
    }
  }
}

// ============================================================================
// 7. ADDITIONAL CSS INJECTED AT RUNTIME (Traversal Panel + Polish)
// ============================================================================
const runtimeCSS = `
  /* Traversal Order Panel */
  #traversal-order-panel {
    position: absolute;
    top: 90px;
    right: 16px;
    width: 155px;
    z-index: 15;
    pointer-events: none;
  }
  .trav-title {
    font-family: 'Cinzel', serif;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #ffd700;
    background: rgba(18,21,28,0.85);
    border: 1.5px solid #4a2e1b;
    border-radius: 8px 8px 0 0;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trav-list {
    background: rgba(12,14,20,0.88);
    border: 1.5px solid #4a2e1b;
    border-top: none;
    border-radius: 0 0 8px 8px;
    max-height: 220px;
    overflow-y: auto;
    padding: 4px 0;
  }
  .trav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .trav-item:last-child { border-bottom: none; }
  .trav-num  { font-size:0.6rem; color:#718096; width:14px; flex-shrink:0; font-family:'Outfit',sans-serif; }
  .trav-label{ font-family:'Cinzel',serif; font-size:0.78rem; font-weight:700; width:20px; flex-shrink:0; }
  .trav-name { font-size:0.62rem; color:#a0aec0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .trav-item.trav-bfs .trav-label { color: #00d2ff; }
  .trav-item.trav-dfs .trav-label { color: #ff9d00; }
  @keyframes trav-pop {
    0%  { transform:translateX(20px); opacity:0; }
    70% { transform:translateX(-3px); }
    100%{ transform:translateX(0);    opacity:1; }
  }
  .mem-empty {
    font-size:0.62rem; color:#718096; text-align:center; padding:8px; font-style:italic;
  }
  /* Slow-time pulsing border on timer */
  .slow-time-active #hud-timer {
    color: #00d2ff !important;
    animation: pulse-glow 1s infinite alternate;
  }
`;

const styleEl = document.createElement('style');
styleEl.textContent = runtimeCSS;
document.head.appendChild(styleEl);

// ============================================================================
// 8. BOOTSTRAP
// ============================================================================
window.addEventListener('load', () => {
  const game = new GameController();
  window.compareCtrl = new CompareRealmsController();
});
