/* 
================================================================================
   GRAPH QUEST: THE TRAVERSAL REALMS - V4 (Click-based RPG Puzzle Game)
================================================================================
*/
'use strict';

const $ = id => document.getElementById(id);

// ============================================================================
// 1. REGION & LEVEL DATA (Normalized Coordinates 0.0 to 1.0)
// ============================================================================
const REGIONS = {
  FOREST: { name: "Ancient Forest Realm", sky: ["#020d05","#091d11","#15331e"], particleColor: "#39ff14", nodeType: "shrine" },
  VALLEY: { name: "Waterfall Valley", sky: ["#020b12","#05151e","#0e2c3d"], particleColor: "#00e5ff", nodeType: "village" },
  SKYLANDS: { name: "Floating Sky Kingdom", sky: ["#050a14","#0d1320","#1a253a"], particleColor: "#c8d8ff", nodeType: "portal" },
  CAVERNS: { name: "Lava Dungeon", sky: ["#0a0101","#170505","#300c0c"], particleColor: "#ff5500", nodeType: "crystal" },
  RUINS: { name: "Forgotten Temple", sky: ["#050505","#0e0f12","#1e222b"], particleColor: "#c8a000", nodeType: "tower" },
  CRYSTAL: { name: "Crystal Cave", sky: ["#110022","#220044","#441166"], particleColor: "#ff00ff", nodeType: "crystal" },
  SHADOW: { name: "Shadow Realm", sky: ["#000000","#0a0a0a","#111111"], particleColor: "#8800ff", nodeType: "portal" },
  CELESTIAL: { name: "Celestial Castle", sky: ["#03010a","#0f0b1a","#1c1535"], particleColor: "#ffffff", nodeType: "tower" }
};

const LEVELS = [
  { id:1, name:"Elderwood Grove", region:"FOREST", mode:"DFS", startNode:"A", nodes:{"A":{x:0.15,y:0.5},"B":{x:0.5,y:0.25},"C":{x:0.5,y:0.75},"D":{x:0.85,y:0.25},"E":{x:0.85,y:0.75}}, edges:[["A","B"],["A","C"],["B","D"],["C","E"]] },
  { id:2, name:"Nimbus Arch", region:"SKYLANDS", mode:"BFS", startNode:"A", nodes:{"A":{x:0.15,y:0.5},"B":{x:0.5,y:0.18},"C":{x:0.5,y:0.5},"D":{x:0.5,y:0.82},"E":{x:0.85,y:0.3},"F":{x:0.85,y:0.7}}, edges:[["A","B"],["A","C"],["A","D"],["B","E"],["C","F"]] }
];

// ============================================================================
// 2. AI GUIDE CONTROLLER
// ============================================================================
class AIGuideController {
  constructor() {
    this.textEl = $('guide-dialogue');
  }
  say(text) {
    this.textEl.innerHTML = text;
  }
}

// ============================================================================
// 3. GAME CONTROLLER
// ============================================================================
class GameController {
  constructor() {
    this.mode = 'BFS';
    this.level = null;
    this.visited = [];
    this.expectedOrder = [];
    this.stepClues = [];
    this.graph = {};
    this.currentLevelIndex = 0;
    this.xp = 0;
    this.timeLeft = 155; // 02:35 equivalent
    this.shieldActive = false;
    this.customSceneryActive = false;
    this.sceneryToggleIdx = 0;
    
    this.ai = new AIGuideController();
    this.renderer = new GameRenderer(this);
    
    this._bindEvents();
    this.startTimer();
    
    // Start background render loop
    this.renderer.startLoop();
  }
  
  _bindEvents() {
    // Splash Screen fade out logic
    const fadeSplash = () => {
      const splash = $('splash-screen');
      if (splash && !splash.classList.contains('hidden')) {
        gsap.to(splash, {
          opacity: 0,
          scale: 1.1,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            splash.classList.add('hidden');
          }
        });
      }
    };

    $('btn-start-game').onclick = fadeSplash;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        fadeSplash();
      }
    });

    // Start Menu bindings
    $('btn-mode-adventure').onclick = () => {
      $('adventure-overlay').classList.remove('hidden');
    };
    $('btn-adventure-close').onclick = () => {
      $('adventure-overlay').classList.add('hidden');
    };
    
    // Grid cards click bindings
    const adventureCards = document.querySelectorAll('.adventure-card');
    adventureCards.forEach(card => {
      card.onclick = () => {
        const type = card.getAttribute('data-adventure');
        this.startAdventure(type);
      };
    });

    $('btn-mode-story').onclick = () => this.startStoryMode();
    $('btn-mode-challenge').onclick = () => this.startChallengeMode();
    $('btn-mode-compare').onclick = () => this.startCompareRealms();
    
    // Close Start Menu overlay
    $('btn-menu-close').onclick = () => {
      $('start-menu').classList.add('hidden');
    };
    
    $('btn-compare-close').onclick = () => {
      $('compare-overlay').classList.add('hidden');
    };
    
    $('btn-compare-simulate').onclick = () => {
      $('compare-text-view').classList.add('hidden');
      $('compare-arena-view').classList.remove('hidden');
      this.initParallelSimulation();
    };

    $('btn-sim-back').onclick = () => {
      if (this.simState && this.simState.timer) {
        clearInterval(this.simState.timer);
      }
      $('compare-text-view').classList.remove('hidden');
      $('compare-arena-view').classList.add('hidden');
    };

    $('btn-sim-play').onclick = () => {
      $('btn-sim-play').classList.add('hidden');
      $('btn-sim-pause').classList.remove('hidden');
      if (this.simState) {
        if (this.simState.stepIndex >= 5) {
          this.initParallelSimulation();
        }
        this.simState.timer = setInterval(() => {
          this.stepParallelSimulation();
        }, 1800);
      }
    };

    $('btn-sim-pause').onclick = () => {
      $('btn-sim-play').classList.remove('hidden');
      $('btn-sim-pause').classList.add('hidden');
      if (this.simState && this.simState.timer) {
        clearInterval(this.simState.timer);
        this.simState.timer = null;
      }
    };

    $('btn-sim-step').onclick = () => {
      if (this.simState) {
        if (this.simState.stepIndex >= 5) {
          this.initParallelSimulation();
        } else {
          this.stepParallelSimulation();
        }
      }
    };

    $('btn-sim-reset').onclick = () => {
      this.initParallelSimulation();
      $('btn-sim-play').classList.remove('hidden');
      $('btn-sim-pause').classList.add('hidden');
    };


    
    // Left Sidebar bindings
    $('sidebar-btn-bfs').onclick = () => {
      if (this.mode === 'BFS') return;
      this.mode = 'BFS';
      
      // Auto-toggle scenery if no custom scenery is manually selected/pinned
      if (!this.customSceneryActive) {
        const sceneries = [
          "assets/graph_quest_bg.png",
          "assets/forest_bg.png",
          "assets/caverns_bg.png"
        ];
        this.sceneryToggleIdx = (this.sceneryToggleIdx + 1) % sceneries.length;
        this.level.bg = sceneries[this.sceneryToggleIdx];
      }
      
      this.loadLevel({...this.level, mode: 'BFS'});
    };
    $('sidebar-btn-dfs').onclick = () => {
      if (this.mode === 'DFS') return;
      this.mode = 'DFS';
      
      // Auto-toggle scenery if no custom scenery is manually selected/pinned
      if (!this.customSceneryActive) {
        const sceneries = [
          "assets/temple_bg.png",
          "assets/desert_bg.png",
          "assets/frost_bg.png"
        ];
        this.sceneryToggleIdx = (this.sceneryToggleIdx + 1) % sceneries.length;
        this.level.bg = sceneries[this.sceneryToggleIdx];
      }
      
      this.loadLevel({...this.level, mode: 'DFS'});
    };
    
    // Difficulty bindings
    const diffs = ['easy', 'medium', 'hard'];
    diffs.forEach(diff => {
      $(`diff-${diff}`).onclick = () => {
        diffs.forEach(d => $(`diff-${d}`).classList.remove('active'));
        $(`diff-${diff}`).classList.add('active');
        
        if (diff === 'easy') {
          this.currentLevelIndex = 0;
          this.loadLevel(LEVELS[0]);
        } else if (diff === 'medium') {
          this.currentLevelIndex = 1;
          this.loadLevel(LEVELS[1]);
        } else if (diff === 'hard') {
          const randomGraph = this.generateRandomPracticeGraph();
          const hardLevel = {
            id: 3,
            name: "The Waterfall Path",
            region: "VALLEY",
            mode: this.mode,
            startNode: "A",
            nodes: randomGraph.nodes,
            edges: randomGraph.edges
          };
          this.currentLevelIndex = 2;
          this.loadLevel(hardLevel);
        }
      };
    });

    // Sound Controls


    // HUD Menu
    $('btn-hud-menu').onclick = () => $('start-menu').classList.remove('hidden');
    $('btn-hud-exit').onclick = () => {
      $('start-menu').classList.add('hidden');
      $('victory-overlay').classList.add('hidden');
      if ($('adventure-overlay')) $('adventure-overlay').classList.add('hidden');
      if ($('compare-overlay')) $('compare-overlay').classList.add('hidden');
      if ($('incorrect-overlay')) $('incorrect-overlay').classList.add('hidden');
      
      const splash = $('splash-screen');
      if (splash) {
        gsap.set(splash, { opacity: 1, scale: 1 });
        splash.classList.remove('hidden');
      }
    };

    // Progression & Navigation handlers for Victory Overlay
    $('btn-victory-next').onclick = () => {
      $('victory-overlay').classList.add('hidden');
      if (this.currentLevelIndex + 1 < LEVELS.length) {
        this.currentLevelIndex++;
        this.loadLevel(LEVELS[this.currentLevelIndex]);
      } else if (this.currentLevelIndex === 1) {
        $('diff-hard').click();
      } else {
        $('start-menu').classList.remove('hidden');
      }
    };
    
    $('btn-victory-stay').onclick = () => {
      $('victory-overlay').classList.add('hidden');
      this.ai.say(`👏 <b>Superb path traversal!</b> You can now look around and admire your glowing active Ley Lines! When you are ready, use the <b>Difficulty panels</b> on the left to start another level, or click the top-right <b>Menu</b> gear to return home!`);
    };

    $('btn-victory-home').onclick = () => {
      $('victory-overlay').classList.add('hidden');
      $('start-menu').classList.remove('hidden');
    };

    // Power-up triggers
    $('powerup-hint').onclick = () => {
      if (this.hintsCount <= 0) {
        this.ai.say(`🔮 <b>No hints remaining!</b> You must decipher the path on your own, Pathfinder!`);
        return;
      }
      
      const correctNode = this.expectedOrder[this.visited.length];
      if (correctNode) {
        this.hintsCount--;
        const hintCountEl = document.querySelector('#powerup-hint .p-count');
        if (hintCountEl) hintCountEl.innerText = this.hintsCount;

        const nextClue = this.stepClues[this.visited.length] || '';
        this.ai.say(`🔮 <b>Power-Up: Hint Active!</b> Aria reveals the next correct traversal path leads to Node <b>${correctNode}</b>.<br><br>${nextClue}`);
      }
    };

    $('powerup-rewind').onclick = () => {
      if (this.visited.length > 0) {
        const popped = this.visited.pop();
        this.ai.say(`⏳ <b>Power-Up: Rewind Active!</b> Undoing last step. Node <b>${popped}</b> has been returned to the ether.`);
        this.setupSlots();
        this.updateAlgoVisuals();
        this.updateChoiceButtons();
        
        const prev = this.visited.length > 0 ? this.visited[this.visited.length - 1] : this.level.startNode;
        this.renderer.slidePlayerTo(prev);
      }
    };

    $('powerup-shield').onclick = () => {
      if (this.shieldsCount <= 0) {
        this.ai.say(`🛡️ <b>No shields remaining!</b> Explore carefully!`);
        return;
      }
      if (this.shieldActive) {
        this.ai.say(`🛡️ <b>Shield is already active!</b> You are protected from the next mistake.`);
        return;
      }
      this.shieldActive = true;
      this.shieldsCount--;
      const shieldCountEl = document.querySelector('#powerup-shield .p-count');
      if (shieldCountEl) shieldCountEl.innerText = this.shieldsCount;
      this.ai.say(`🛡️ <b>Power-Up: Shield Active!</b> Protected against your next incorrect move!`);
    };

    $('btn-incorrect-retry').onclick = () => {
      $('incorrect-overlay').classList.add('hidden');
    };
  }

  startAdventure(type) {
    this.customSceneryActive = true;
    $('adventure-overlay').classList.add('hidden');
    $('start-menu').classList.add('hidden');
    $('victory-overlay').classList.add('hidden');
    
    // Enable powerup buttons
    $('powerup-hint').style.display = 'flex';
    $('powerup-shield').style.display = 'flex';
    this.isChallengeMode = false;
    
    const randomGraph = this.generateRandomPracticeGraph();

    let levelName = "The Waterfall Path";
    let bgUrl = "assets/graph_quest_bg.png";
    let region = "VALLEY";
    
    if (type === 'temple') {
      levelName = "Ancient Temple";
      bgUrl = "assets/temple_bg.png";
      region = "RUINS";
    } else if (type === 'rainforest') {
      levelName = "Rainforest Trail";
      bgUrl = "assets/forest_bg.png";
      region = "FOREST";
    } else if (type === 'desert') {
      levelName = "Desert Ruins";
      bgUrl = "assets/desert_bg.png";
      region = "VALLEY";
    } else if (type === 'crystal') {
      levelName = "Crystal Caves";
      bgUrl = "assets/caverns_bg.png";
      region = "CAVERNS";
    } else if (type === 'frost') {
      levelName = "Frost Peaks";
      bgUrl = "assets/frost_bg.png";
      region = "SKYLANDS";
    }
    
    const adventureLevel = {
      id: "Adventure",
      name: levelName,
      region: region,
      mode: this.mode,
      startNode: "A",
      nodes: randomGraph.nodes,
      edges: randomGraph.edges,
      bg: bgUrl
    };
    
    this.currentLevelIndex = 999;
    this.loadLevel(adventureLevel);
  }

  startStoryMode() {
    this.customSceneryActive = false;
    $('start-menu').classList.add('hidden');
    $('victory-overlay').classList.add('hidden');
    
    // Enable powerup buttons for story mode
    $('powerup-hint').style.display = 'flex';
    $('powerup-shield').style.display = 'flex';
    this.isChallengeMode = false;
    
    this.currentLevelIndex = 0;
    
    $('diff-easy').classList.add('active');
    $('diff-medium').classList.remove('active');
    $('diff-hard').classList.remove('active');
    
    this.loadLevel(LEVELS[0]);
  }

  startChallengeMode() {
    this.customSceneryActive = false;
    $('start-menu').classList.add('hidden');
    $('victory-overlay').classList.add('hidden');
    
    // Procedural randomized challenge graph layout
    const challengeLevel = {
      id: 99,
      name: "Void of Time",
      region: "WATERFALL", // Cosmic high intensity waterfall region
      mode: this.mode,
      startNode: "A",
      nodes: {
        "A": { x: 0.5, y: 0.15 },
        "B": { x: 0.25, y: 0.4 },
        "C": { x: 0.75, y: 0.4 },
        "D": { x: 0.1, y: 0.7 },
        "E": { x: 0.4, y: 0.65 },
        "F": { x: 0.6, y: 0.65 },
        "G": { x: 0.9, y: 0.7 },
        "H": { x: 0.5, y: 0.9 }
      },
      edges: [
        ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"],
        ["C", "F"], ["C", "G"], ["D", "H"], ["E", "H"],
        ["F", "H"], ["G", "H"]
      ]
    };
    
    this.isChallengeMode = true;
    this.timeLeft = 45; // Very strict 45 seconds timer Attack!
    
    // Hide magical powerups for true test of algorithmic strategy!
    $('powerup-hint').style.display = 'none';
    $('powerup-shield').style.display = 'none';
    
    this.currentLevelIndex = 99;
    this.loadLevel(challengeLevel);
    
    this.ai.say(`⏱️ <b>Void of Time (Challenge Mode) Loaded!</b> You must restore the ancient paths within **45 seconds** without Hints or Shields! Flawless traversal grants **Double XP (+1000 XP)**!`);
  }

  startCompareRealms() {
    $('compare-overlay').classList.remove('hidden');
    // Ensure we reset visual showdown states when launching
    $('compare-text-view').classList.remove('hidden');
    $('compare-arena-view').classList.add('hidden');
  }

  initParallelSimulation() {
    if (this.simState && this.simState.timer) {
      clearInterval(this.simState.timer);
    }
    
    this.simState = {
      active: false,
      timer: null,
      stepIndex: 0,
      bfs: {
        visited: [],
        queue: ["A"],
        history: [],
        currentNode: null,
        log: "Ready... Click <b>Run Showdown</b> or <b>Step Forward</b> to begin exploring Node <b>A</b>!"
      },
      dfs: {
        visited: [],
        stack: ["A"],
        history: [],
        currentNode: null,
        log: "Ready... Click <b>Run Showdown</b> or <b>Step Forward</b> to begin exploring Node <b>A</b>!"
      }
    };
    
    this.updateSimHUD();
    this.drawSimArenas();
  }

  stepParallelSimulation() {
    const s = this.simState;
    if (s.stepIndex >= 5) {
      if (s.timer) {
        clearInterval(s.timer);
        s.timer = null;
        $('btn-sim-play').classList.remove('hidden');
        $('btn-sim-pause').classList.add('hidden');
      }
      return;
    }
    
    s.stepIndex++;
    
    // --- 1. BFS Traversal Tick ---
    const b = s.bfs;
    if (s.stepIndex === 1) {
      b.currentNode = 'A';
      b.visited.push('A');
      b.queue = ['B', 'C'];
      b.log = "Pops <b>A</b> from front. Enqueues unvisited neighbors <b>B and C</b> to the back of the queue.";
    } else if (s.stepIndex === 2) {
      b.currentNode = 'B';
      b.visited.push('B');
      b.history.push('A-B');
      b.queue = ['C', 'D'];
      b.log = "Pops <b>B</b> (front of Queue). Enqueues neighbor <b>D</b> to the back of the queue.";
    } else if (s.stepIndex === 3) {
      b.currentNode = 'C';
      b.visited.push('C');
      b.history.push('A-C');
      b.queue = ['D', 'E'];
      b.log = "Pops <b>C</b> next because it was older in the queue than D! (Level-1 layer finished). Enqueues neighbor <b>E</b>.";
    } else if (s.stepIndex === 4) {
      b.currentNode = 'D';
      b.visited.push('D');
      b.history.push('B-D');
      b.queue = ['E'];
      b.log = "Pops <b>D</b> from front. No unvisited neighbors remaining.";
    } else if (s.stepIndex === 5) {
      b.currentNode = 'E';
      b.visited.push('E');
      b.history.push('C-E');
      b.queue = [];
      b.log = "Pops <b>E</b> from front. Wavefront exploration fully completed!";
    }
    
    // --- 2. DFS Traversal Tick ---
    const d = s.dfs;
    if (s.stepIndex === 1) {
      d.currentNode = 'A';
      d.visited.push('A');
      d.stack = ['C', 'B']; // Pushing C then B to put B on top
      d.log = "Pops <b>A</b> from stack. Pushes neighbors <b>C and B</b>. Node <b>B</b> is at the top of stack.";
    } else if (s.stepIndex === 2) {
      d.currentNode = 'B';
      d.visited.push('B');
      d.history.push('A-B');
      d.stack = ['C', 'D']; // B popped, D pushed on top
      d.log = "Pops <b>B</b> (top of Stack). Pushes child neighbor <b>D</b> on top, driving the search deeper.";
    } else if (s.stepIndex === 3) {
      d.currentNode = 'D';
      d.visited.push('D');
      d.history.push('B-D');
      d.stack = ['C']; // D popped, reaches dead end, only C left
      d.log = "Pops <b>D</b> (top of Stack). Reaches a dead-end! Backtracks to the next available stack node.";
    } else if (s.stepIndex === 4) {
      d.currentNode = 'C';
      d.visited.push('C');
      d.history.push('A-C');
      d.stack = ['E']; // C popped, E pushed on top
      d.log = "Pops <b>C</b> from stack. Pushes child neighbor <b>E</b> on top of the stack.";
    } else if (s.stepIndex === 5) {
      d.currentNode = 'E';
      d.visited.push('E');
      d.history.push('C-E');
      d.stack = [];
      d.log = "Pops <b>E</b> from top. Deep branch traversal fully completed!";
    }
    
    this.updateSimHUD();
    this.drawSimArenas();
    
    // Auto pause at the end
    if (s.stepIndex >= 5 && s.timer) {
      clearInterval(s.timer);
      s.timer = null;
      $('btn-sim-play').classList.remove('hidden');
      $('btn-sim-pause').classList.add('hidden');
    }
  }

  updateSimHUD() {
    const s = this.simState;
    $('sim-queue-val').innerHTML = s.bfs.queue.length > 0 ? `[ ${s.bfs.queue.join(', ')} ]` : 'Empty';
    $('sim-bfs-status').innerHTML = s.bfs.log;
    
    $('sim-stack-val').innerHTML = s.dfs.stack.length > 0 ? `[ ${s.dfs.stack.join(', ')} ]` : 'Empty';
    $('sim-dfs-status').innerHTML = s.dfs.log;
  }

  drawSimArenas() {
    this.renderSimNodeGraph('sim-canvas-bfs', 'BFS', this.simState.bfs);
    this.renderSimNodeGraph('sim-canvas-dfs', 'DFS', this.simState.dfs);
  }

  renderSimNodeGraph(canvasId, type, state) {
    const canvas = $(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isBFS = type === 'BFS';
    const mainColor = isBFS ? '#00d2ff' : '#ffaa00';
    const activeColor = '#ffd700'; // Gold head
    
    // Graph node layout
    const nodes = {
      "A": { x: 50, y: 125 },
      "B": { x: 175, y: 65 },
      "C": { x: 175, y: 185 },
      "D": { x: 320, y: 65 },
      "E": { x: 320, y: 185 }
    };
    const edges = [
      ["A", "B"], ["A", "C"], ["B", "D"], ["C", "E"]
    ];
    
    // 1. Draw Edges
    edges.forEach(([u, v]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[u].x, nodes[u].y);
      ctx.lineTo(nodes[v].x, nodes[v].y);
      
      const uVisited = state.visited.includes(u);
      const vVisited = state.visited.includes(v);
      const isTraversed = uVisited && vVisited && 
        (state.history.includes(`${u}-${v}`) || state.history.includes(`${v}-${u}`));
      
      if (isTraversed) {
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2.5;
      }
      ctx.stroke();
    });
    
    // 2. Draw Nodes
    Object.entries(nodes).forEach(([name, pos]) => {
      const isVisited = state.visited.includes(name);
      const isActive = state.currentNode === name;
      const inStructure = isBFS ? state.queue.includes(name) : state.stack.includes(name);
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
      
      if (isActive) {
        ctx.fillStyle = activeColor;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      } else if (isVisited) {
        ctx.fillStyle = mainColor;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
      } else if (inStructure) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
      } else {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
      }
      
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Node Text
      ctx.font = "bold 12px 'Cinzel', serif";
      ctx.fillStyle = (isActive || isVisited) ? '#0f172a' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, pos.x, pos.y);
    });
  }



  loadLevel(levelData) {
    // Generate different random graphs each and every time a level is loaded
    const randomGraph = this.generateRandomPracticeGraph();
    this.level = {
      ...levelData,
      nodes: randomGraph.nodes,
      edges: randomGraph.edges
    };
    this.mode = this.level.mode;
    
    // Auto background cycling if no custom manually-selected scenery is active
    if (!this.customSceneryActive) {
      const sceneries = [
        "assets/graph_quest_bg.png",
        "assets/temple_bg.png",
        "assets/forest_bg.png",
        "assets/desert_bg.png",
        "assets/caverns_bg.png",
        "assets/frost_bg.png"
      ];
      // Cycle backgrounds automatically based on level ID (if number) or fallback
      let idx = 0;
      if (typeof levelData.id === 'number') {
        idx = (levelData.id - 1) % sceneries.length;
      } else {
        idx = this.mode === 'BFS' ? 0 : 1;
      }
      levelData.bg = sceneries[idx];
    }

    let bgUrl = levelData.bg || (this.mode === 'BFS' ? 'assets/graph_quest_bg.png' : 'assets/temple_bg.png');
    document.body.style.background = `radial-gradient(circle, rgba(0, 0, 0, 0.05) 30%, rgba(0, 0, 0, 0.45) 100%), url('${bgUrl}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';
    
    if (this.mode === 'BFS') {
      $('sidebar-btn-bfs').classList.add('active');
      $('sidebar-btn-dfs').classList.remove('active');
    } else {
      $('sidebar-btn-dfs').classList.add('active');
      $('sidebar-btn-bfs').classList.remove('active');
    }

    $('hud-level-num').innerText = `Level ${levelData.id || "Custom"}`;
    $('hud-level-name').innerText = levelData.name;
    $('objective-text').innerHTML = `Traverse the graph starting from the red node <b>${levelData.startNode}</b> and visit all nodes using <b>${this.mode}</b>.`;

    const intro = this.mode === 'BFS' ?
      `🏰 <b>Your Goal:</b> Create a single energy path that connects and includes <b>every single node</b> in this realm!<br><br>🌊 <b>BFS Rule (Nearest Path):</b> To build this path, you must <b>always choose the nearest unvisited nodes first</b>. Explore the graph layer-by-layer: visit all immediate neighbors of your active nodes alphabetically before you are allowed to go deeper!` :
      `🏰 <b>Your Goal:</b> Create a single energy path that connects and includes <b>every single node</b> in this realm!<br><br>🌲 <b>DFS Rule (Dive Deep):</b> To build this path, you must <b>always dive as deeply as possible down a single route first</b>. From your active node, choose the first unvisited neighbor alphabetically. You must only <b>backtrack</b> to previous ancestor nodes when you hit a dead-end with no unvisited neighbors!`;
    this.ai.say(intro);
    
    this.graph = {};
    Object.keys(levelData.nodes).forEach(n => this.graph[n] = []);
    levelData.edges.forEach(([u,v]) => {
      if(this.graph[u]) this.graph[u].push(v);
      if(this.graph[v]) this.graph[v].push(u);
    });

    Object.keys(this.graph).forEach(n => this.graph[n].sort());

    const traversal = this.computeTraversalWithClues(levelData.startNode, this.mode);
    this.expectedOrder = traversal.order;
    this.stepClues = traversal.clues;
    this.visited = [];
    
    // Reset power-up quantities for the new traversal level
    this.hintsCount = 2;
    this.shieldsCount = 1;
    this.shieldActive = false;

    const hintCountEl = document.querySelector('#powerup-hint .p-count');
    if (hintCountEl) hintCountEl.innerText = this.hintsCount;
    const shieldCountEl = document.querySelector('#powerup-shield .p-count');
    if (shieldCountEl) shieldCountEl.innerText = this.shieldsCount;

    this.setupSlots();
    this.renderer.setLevel(this.level);
    this.updateAlgoVisuals();
    this.updateChoiceButtons();
  }

  computeTraversalWithClues(start, mode) {
    const order = [];
    const clues = [];
    const vis = new Set();
    
    if (mode === 'BFS') {
      const q = [start];
      vis.add(start);
      order.push(start);
      clues.push(`💡 <b>First Step (Start Node):</b> The goal is to build a path visiting all nodes. Start at root Node <b>${start}</b>!`);
      
      const qSim = [start];
      while (qSim.length > 0) {
        const curr = qSim.shift();
        const neighbors = this.graph[curr].filter(n => !vis.has(n));
        
        neighbors.forEach(n => {
          vis.add(n);
          qSim.push(n);
          order.push(n);
          clues.push(`💡 <b>BFS Clue (Choose Nearest):</b> We must visit the <b>nearest unvisited neighbors first</b>. The unvisited neighbors of Node <b>${curr}</b> are <b>${neighbors.join(', ')}</b>. Alphabetically, choose the nearest unvisited Node <b>${n}</b>!`);
        });
      }
    } else {
      const orderSet = new Set();
      let path = [];
      
      const dfsSimulate = (node, parent) => {
        orderSet.add(node);
        order.push(node);
        path.push(node);
        
        if (parent === null) {
          clues.push(`💡 <b>First Step (Start Node):</b> The goal is to build a path visiting all nodes. Start at root Node <b>${node}</b>!`);
        } else {
          const prevNode = order[order.length - 2];
          if (parent === prevNode) {
            const unvisitedList = this.graph[parent].filter(n => !orderSet.has(n) || n === node);
            clues.push(`💡 <b>DFS Clue (Dive Deep):</b> We must <b>dive deep</b> along a single path first. From Node <b>${parent}</b>, the first unvisited neighbor alphabetically is Node <b>${node}</b>. Dive deeper and choose Node <b>${node}</b>!`);
          } else {
            clues.push(`💡 <b>DFS Clue (Backtrack):</b> Node <b>${prevNode}</b> has no unvisited neighbors! Since we hit a dead-end, we must <b>backtrack</b> up our current path to find the nearest ancestor with unvisited neighbors, which is Node <b>${parent}</b>. Alphabetically, its first unvisited neighbor is Node <b>${node}</b>. Choose Node <b>${node}</b>!`);
          }
        }
        
        const neighbors = this.graph[node].filter(n => !orderSet.has(n));
        for (let n of neighbors) {
          if (!orderSet.has(n)) {
            dfsSimulate(n, node);
          }
        }
        path.pop();
      };
      
      dfsSimulate(start, null);
    }
    
    return { order, clues };
  }

  setupSlots() {
    const container = $('traversal-slots-container');
    container.innerHTML = '';
    
    this.expectedOrder.forEach((nodeId, i) => {
      if (i > 0) {
        const arrow = document.createElement('i');
        arrow.className = 'fa-solid fa-arrow-right flow-arrow';
        container.appendChild(arrow);
      }
      
      const nodeEl = document.createElement('div');
      if (i < this.visited.length) {
        nodeEl.className = 'flow-node filled';
        nodeEl.innerText = this.visited[i];
      } else {
        nodeEl.className = 'flow-node empty';
        nodeEl.innerText = '?';
        nodeEl.style.borderColor = '#4a5568';
        nodeEl.style.color = '#4a5568';
      }
      container.appendChild(nodeEl);
    });
    
    const nodesLeft = this.expectedOrder.length - this.visited.length;
    $('nodes-left-count').innerText = nodesLeft;
  }

  handleNodeClick(nodeId) {
    const expected = this.expectedOrder[this.visited.length];
    if (nodeId === expected) {
      this.visited.push(nodeId);
      this.xp += 250;
      $('hud-xp').innerText = `${this.xp} XP`;
      
      this.setupSlots();
      this.updateAlgoVisuals();
      this.renderer.playCorrectVFX(nodeId);
      this.renderer.slidePlayerTo(nodeId);
      
      if(this.visited.length === this.expectedOrder.length) {
        this.ai.say(`🎉 <b>Excellent job, Pathfinder!</b> You have successfully restored the ancient energy paths of this realm!`);
        this.renderer.triggerCelebration();
        setTimeout(() => this.showVictory(), 2500);
      } else {
        this.updateChoiceButtons();
      }
      return true;
    } else {
      if (this.shieldActive) {
        this.shieldActive = false;
        this.ai.say(`🛡️ <b>Shield Absorbed!</b> Your shield protected you from the incorrect path to Node <b>${nodeId}</b>.`);
        return false;
      }

      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 500);
      
      const currentClue = this.stepClues[this.visited.length];
      
      // Update explanation in popup
      $('incorrect-explanation-text').innerHTML = `<b>Designated Node ${nodeId} is incorrect!</b><br><br>${currentClue}`;
      
      // Show the popup overlay
      $('incorrect-overlay').classList.remove('hidden');
      
      this.ai.say(`❌ <b>Not quite!</b> ${currentClue}`);
      return false;
    }
  }

  updateChoiceButtons() {
    const container = $('bottom-node-choices');
    container.innerHTML = '';
    
    const idx = this.visited.length;
    if (idx >= this.expectedOrder.length) {
      container.innerHTML = '<div class="choice-empty">Realm Restored!</div>';
      return;
    }
    
    const correctNode = this.expectedOrder[idx];
    const choices = new Set([correctNode]);
    
    const allUnvisited = Object.keys(this.level.nodes).filter(n => !this.visited.includes(n) && n !== correctNode);
    allUnvisited.sort();
    
    for (let i = 0; i < Math.min(3, allUnvisited.length); i++) {
      choices.add(allUnvisited[i]);
    }
    
    if (choices.size < 4) {
      const allNodes = Object.keys(this.level.nodes);
      for (let n of allNodes) {
        if (n !== correctNode && choices.size < 4) {
          choices.add(n);
        }
      }
    }
    
    const choicesArr = Array.from(choices).sort();
    choicesArr.forEach(nodeId => {
      const btn = document.createElement('button');
      btn.className = 'btn-choice-node';
      btn.innerText = nodeId;
      btn.onclick = () => this.handleNodeClick(nodeId);
      container.appendChild(btn);
    });
  }

  updateAlgoVisuals() {
    const list = $('algo-items-list');
    const titleText = $('algo-title-text');
    const descText = $('algo-desc-text');
    
    titleText.innerHTML = this.mode === 'BFS' ? '<i class="fa-solid fa-scroll"></i> Queue (BFS)' : '<i class="fa-solid fa-layer-group"></i> Stack (DFS)';
    descText.innerText = this.mode === 'BFS' ? 
      'Nodes in the queue are visited in the order they were discovered (FIFO).' : 
      'Nodes in the stack are visited in reverse order of discovery (LIFO).';
    
    list.innerHTML = '';
    
    let ds = [];
    if(this.mode === 'BFS') {
      const q = [this.level.startNode];
      const added = new Set([this.level.startNode]);
      for(let i=0; i<this.visited.length; i++) {
        const v = q.shift();
        this.graph[v].forEach(n => {
          if(!added.has(n)) { added.add(n); q.push(n); }
        });
      }
      ds = q;
    } else {
      const path = [];
      const vis = new Set();
      const dfsFindPath = (node) => {
        vis.add(node);
        path.push(node);
        if (node === this.visited[this.visited.length - 1]) {
          return true;
        }
        for (let n of this.graph[node]) {
          if (!vis.has(n)) {
            if (dfsFindPath(n)) return true;
          }
        }
        path.pop();
        return false;
      };
      if (this.visited.length > 0) {
        dfsFindPath(this.level.startNode);
      } else {
        path.push(this.level.startNode);
      }
      ds = path;
    }
    
    if(ds.length === 0) {
      list.innerHTML = '<div class="algo-empty">Empty</div>';
    } else {
      ds.forEach((item, i) => {
        if (i > 0) {
          const arrow = document.createElement('i');
          arrow.className = 'fa-solid fa-arrow-right flow-arrow';
          list.appendChild(arrow);
        }
        const div = document.createElement('div');
        div.className = 'flow-node';
        div.innerText = item;
        list.appendChild(div);
      });
    }
  }
  
  startTimer() {
    setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        const min = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const sec = (this.timeLeft % 60).toString().padStart(2, '0');
        $('hud-timer').innerText = `${min}:${sec}`;
      }
    }, 1000);
  }

  showVictory() {
    $('victory-overlay').classList.remove('hidden');
    
    if (this.isChallengeMode) {
      $('victory-stars').innerText = '⭐⭐⭐⭐⭐';
    } else {
      $('victory-stars').innerText = '⭐⭐⭐';
    }
    
    $('victory-summary').className = `concept-summary ${this.mode.toLowerCase()}-concept`;
    $('victory-summary').innerHTML = `<strong>What you learned:</strong> ${this.mode === 'BFS' ? 'BFS explores layer by layer, guaranteeing the shortest path in unweighted graphs!' : 'DFS dives as deeply as possible, making it great for finding paths through mazes and topological sorting!'}`;
    
    // Draw finalized traversed graph on overlay canvas
    this.renderer.drawVictoryGraph('victory-canvas');
  }

  generateRandomPracticeGraph() {
    const nodesList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    
    // Choose one of 3 beautiful visual layout presets
    const layouts = [
      // 1. Layered Tree
      {
        "A": { x: 0.5, y: 0.12 },
        "B": { x: 0.28, y: 0.32 },
        "C": { x: 0.72, y: 0.32 },
        "D": { x: 0.12, y: 0.58 },
        "E": { x: 0.38, y: 0.58 },
        "F": { x: 0.62, y: 0.58 },
        "G": { x: 0.88, y: 0.58 },
        "H": { x: 0.35, y: 0.86 },
        "I": { x: 0.65, y: 0.86 }
      },
      // 2. Circular Outer-Ring
      {
        "A": { x: 0.5, y: 0.12 },
        "B": { x: 0.22, y: 0.3 },
        "C": { x: 0.78, y: 0.3 },
        "D": { x: 0.1, y: 0.55 },
        "E": { x: 0.9, y: 0.55 },
        "F": { x: 0.22, y: 0.8 },
        "G": { x: 0.78, y: 0.8 },
        "H": { x: 0.5, y: 0.92 },
        "I": { x: 0.5, y: 0.55 }
      },
      // 3. Horizontal Wave Grid
      {
        "A": { x: 0.12, y: 0.5 },
        "B": { x: 0.35, y: 0.25 },
        "C": { x: 0.35, y: 0.75 },
        "D": { x: 0.58, y: 0.15 },
        "E": { x: 0.58, y: 0.5 },
        "F": { x: 0.58, y: 0.85 },
        "G": { x: 0.8, y: 0.3 },
        "H": { x: 0.8, y: 0.7 },
        "I": { x: 0.92, y: 0.5 }
      }
    ];
    
    const selectedLayout = layouts[Math.floor(Math.random() * layouts.length)];
    
    // Generate a Spanning Tree to guarantee 100% connectivity
    const connected = ['A'];
    const unconnected = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const edges = [];
    
    // Helper to check if edge already exists
    const edgeExists = (u, v) => {
      return edges.some(([x, y]) => (x === u && y === v) || (x === v && y === u));
    };
    
    while (unconnected.length > 0) {
      // Pick a random connected node
      const u = connected[Math.floor(Math.random() * connected.length)];
      // Pick a random unconnected node
      const vIdx = Math.floor(Math.random() * unconnected.length);
      const v = unconnected[vIdx];
      
      edges.push([u, v]);
      connected.push(v);
      unconnected.splice(vIdx, 1);
    }
    
    // Add 3-4 extra random edges to create cycle complexity for BFS/DFS traversal
    const extraEdgesCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 extra edges
    let attempts = 0;
    while (edges.length < 8 + extraEdgesCount && attempts < 50) {
      attempts++;
      const u = nodesList[Math.floor(Math.random() * nodesList.length)];
      const v = nodesList[Math.floor(Math.random() * nodesList.length)];
      
      if (u !== v && !edgeExists(u, v)) {
        edges.push([u, v]);
      }
    }
    
    return {
      nodes: selectedLayout,
      edges: edges
    };
  }
}

// ============================================================================
// 4. GAME RENDERER (2.5D Centered Responsive Canvas View)
// ============================================================================
class GameRenderer {
  constructor(controller) {
    this.ctrl = controller;
    this.canvas = $('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];

    // Preload both hero images
    this.heroImgMale = new Image();
    this.heroImgMale.src = 'assets/male_hero.png';
    this.heroImgFemale = new Image();
    this.heroImgFemale.src = 'assets/female_hero.png';

    // Active hero image — default, updated by selectCharacter()
    const saved = localStorage.getItem('gq_selected_character');
    this.heroImg = (saved === 'female') ? this.heroImgFemale : this.heroImgMale;
    this.selectedGender = saved || 'male';

    // Player position & animation state
    this.playerNode = null;
    this.playerX = null;
    this.playerY = null;
    this.animProgress = 1.0;
    this.animSource = null;
    this.animTarget = null;
    this.lastActionTime = Date.now(); // Idle hint tracking

    // Running animation frame counter
    this.runFrame = 0;
    this.isRunning = false;
    this.facingRight = true;   // flip sprite when moving left

    this.isCelebrating = false;
    this.celebrationStartTime = 0;

    // Character dust trail + arrival burst particles
    this.charParticles = [];
    this.arrivalBurst  = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
  }

  /** Emit dust puffs behind the running character's feet */
  emitDustTrail() {
    const isFemale  = this.selectedGender === 'female';
    const dustColor = isFemale ? [190, 80, 255] : [80, 150, 255];
    const backX = this.playerX + (this.facingRight ? -1 : 1) * 18;
    const feetY = this.playerY - 26;
    for (let i = 0; i < 3; i++) {
      this.charParticles.push({
        x:     backX + (Math.random() - 0.5) * 10,
        y:     feetY + 10 + Math.random() * 6,
        vx:    (this.facingRight ? -1 : 1) * (Math.random() * 1.5 + 0.4),
        vy:    -(Math.random() * 1.2 + 0.3),
        life:  1.0,
        decay: Math.random() * 0.04 + 0.03,
        r:     dustColor[0], g: dustColor[1], b: dustColor[2],
        size:  Math.random() * 4 + 2
      });
    }
  }

  /** Emit a golden star-burst when landing on a node */
  emitArrivalBurst(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle  = (i / 20) * Math.PI * 2;
      const speed  = Math.random() * 3 + 1;
      this.charParticles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life:  1.0,
        decay: Math.random() * 0.03 + 0.025,
        r: 255, g: Math.random() > 0.5 ? 215 : 150, b: 0,
        size: Math.random() * 5 + 2
      });
    }
  }

  /** Emit confetti from bottom corners */
  emitConfettiBlast() {
    const colors = [
      [255, 60, 60], [60, 255, 60], [60, 150, 255], 
      [255, 255, 60], [60, 255, 255], [255, 60, 255], 
      [255, 140, 0], [255, 255, 255]
    ];
    
    // Blast from bottom-left and bottom-right
    [0, this.canvas.width].forEach(startX => {
      const isLeft = startX === 0;
      for (let i = 0; i < 90; i++) {
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.charParticles.push({
          x: startX, 
          y: this.canvas.height,
          vx: (isLeft ? 1 : -1) * (Math.random() * 10 + 4),
          vy: -(Math.random() * 14 + 8),
          life: 1.0,
          decay: Math.random() * 0.008 + 0.004,
          r: col[0], g: col[1], b: col[2],
          size: Math.random() * 6 + 4,
          isConfetti: true,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3
        });
      }
    });
  }

  /** Update & draw character trail / burst particles */
  drawCharParticles() {
    this.charParticles = this.charParticles.filter(p => p.life > 0);
    this.charParticles.forEach(p => {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.isConfetti ? 0.2 : 0.06;   // gravity
      p.life -= p.decay;
      
      if (p.isConfetti) {
         p.vx *= 0.98; // air resistance
         p.angle += p.rotSpeed;
      }
      
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life) * (p.isConfetti ? 1.0 : 0.85);
      this.ctx.fillStyle   = `rgb(${p.r},${p.g},${p.b})`;
      this.ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.7)`;
      this.ctx.shadowBlur  = p.isConfetti ? 0 : 6;
      
      this.ctx.translate(p.x, p.y);
      if (p.isConfetti) {
        this.ctx.rotate(p.angle);
        this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.7);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    });
  }

  /** Called by selectCharacter() to swap the active sprite instantly */
  switchCharacterImage(gender) {
    this.selectedGender = gender;
    this.heroImg = (gender === 'female') ? this.heroImgFemale : this.heroImgMale;
  }
  
  resize() {
    const parentRect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = parentRect.width || 800;
    this.canvas.height = parentRect.height || 480;
    this.initParticles();
  }

  // Maps normalized coordinate [0.0, 1.0] to a perfectly padded centered canvas viewport box
  getCanvasCoords(normX, normY) {
    const paddingX = this.canvas.width * 0.12; 
    const paddingY = this.canvas.height * 0.12; 
    const w = this.canvas.width - paddingX * 2;
    const h = this.canvas.height - paddingY * 2;
    return {
      x: paddingX + normX * w,
      y: paddingY + normY * h
    };
  }
  
  setLevel(level) {
    this.level = level;
    this.region = REGIONS[level.region];
    this.nodes = JSON.parse(JSON.stringify(level.nodes));
    this.edges = level.edges;
    this.initParticles();
    
    // Position player avatar at the start node
    this.playerNode = level.startNode;
    const startPos = this.getCanvasCoords(this.nodes[level.startNode].x, this.nodes[level.startNode].y);
    this.playerX = startPos.x;
    this.playerY = startPos.y;
    this.animProgress = 1.0;
    this.isCelebrating = false;
    this.lastActionTime = Date.now();
  }

  triggerCelebration() {
    this.isCelebrating = true;
    this.celebrationStartTime = Date.now();
    this.emitConfettiBlast();
  }

  slidePlayerTo(nodeId) {
    const prevNode = this.playerNode;
    this.playerNode = nodeId;

    if (prevNode && this.nodes[prevNode]) {
      const src  = this.getCanvasCoords(this.nodes[prevNode].x, this.nodes[prevNode].y);
      const dest = this.getCanvasCoords(this.nodes[nodeId].x,   this.nodes[nodeId].y);

      this.animSource   = src;
      this.animTarget   = dest;
      this.animProgress = 0.0;
      this.isRunning    = true;
      this.runFrame     = 0;

      // Determine which way the character should face
      this.facingRight  = (dest.x >= src.x);
    } else {
      const dest = this.getCanvasCoords(this.nodes[nodeId].x, this.nodes[nodeId].y);
      this.playerX      = dest.x;
      this.playerY      = dest.y;
      this.animProgress = 1.0;
      this.isRunning    = false;
    }
  }

  initParticles() {
    this.particles = [];
    for(let i=0; i<35; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vy: Math.random() * -0.6 - 0.2,
        alpha: Math.random() * 0.4 + 0.1
      });
    }
  }
  
  onPointerDown(e) {
    this.lastActionTime = Date.now();
    if(!this.level) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    for(let id in this.nodes) {
      if(this.ctrl.visited.includes(id)) continue;
      const n = this.nodes[id];
      const coords = this.getCanvasCoords(n.x, n.y);
      const dx = mouseX - coords.x;
      const dy = mouseY - coords.y;
      if(dx*dx + dy*dy < 28*28) {
        this.ctrl.handleNodeClick(id);
        break;
      }
    }
  }
  
  playCorrectVFX(nodeId) {
    const n = this.nodes[nodeId];
    if(!n) return;
    const coords = this.getCanvasCoords(n.x, n.y);
    for(let i=0; i<15; i++) {
      this.particles.push({
        x: coords.x,
        y: coords.y,
        vy: Math.random() * -2 - 1,
        vx: (Math.random() - 0.5) * 4,
        alpha: 1.0
      });
    }
  }

  startLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
  
  drawPlayerAvatar() {
    if (this.playerX === null || this.playerY === null) return;

    const ctx  = this.ctx;
    const px   = this.playerX;
    const py   = this.playerY;

    // ── Animation state ──────────────────────────────────────────────
    const running = this.isRunning;
    const isCeleb = this.isCelebrating;
    const celebT  = isCeleb ? (Date.now() - this.celebrationStartTime) : 0;
    const t       = this.runFrame;
    const isFem   = this.selectedGender === 'female';
    const dir     = this.facingRight ? 1 : -1; // +1 = facing right

    // Running cycle sine wave
    const swing    = running ? Math.sin(t * 0.38) : 0;
    
    let scale = 1.0;
    let jumpY = 0;
    if (isCeleb) {
      scale = Math.min(1.8, 1.0 + (celebT / 600) * 0.8);
      jumpY = Math.abs(Math.sin(celebT * 0.005)) * 50 * scale;
    }

    const bodyBob  = running ? Math.abs(Math.sin(t * 0.76)) * 4 : 0;
    const forwardLean = running && !isCeleb ? dir * 0.16 : 0; // radians

    // ── Dimensions ───────────────────────────────────────────────────
    const headR   = 9;
    const torsoH  = 20;
    const torsoW  = 8;
    const thighL  = 14;
    const shinL   = 13;
    const armUpL  = 11;
    const armLoL  = 9;

    // ── Colors (gender-aware) ─────────────────────────────────────────
    const skinLight = isFem ? '#f2c8a0' : '#d4a070';
    const skinDark  = isFem ? '#c89060' : '#a06030';
    const armorPri  = isFem ? '#5a1f80' : '#102550'; // Deep purple vs Dark blue
    const armorHi   = isFem ? '#8a3fcf' : '#204590';
    const armorDark = isFem ? '#2a0840' : '#050a20';
    const armorTrim = isFem ? '#e8e8e8' : '#ffd700'; // Silver vs Gold
    const legCol    = isFem ? '#3a1050' : '#0a1530';
    const legDark   = isFem ? '#1a0520' : '#040815';
    const bootCol   = isFem ? '#1a0520' : '#040815';
    const hairCol   = isFem ? '#8b2200' : '#1a0a00';

    // ── Local coord origin = feet position ───────────────────────────
    const footY = py - 28 - bodyBob;

    // Pulsing aura ring on node (drawn before character, behind feet)
    const pulseR = 26 + Math.sin(Date.now() / 180) * 3;
    ctx.save();
    ctx.shadowColor = isFem ? 'rgba(180,60,255,0.8)' : 'rgba(60,140,255,0.8)';
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = armorTrim;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // ── Main character transform ──────────────────────────────────────
    ctx.save();
    ctx.translate(px, footY - jumpY);
    ctx.scale(scale, scale);
    ctx.rotate(forwardLean);   // lean forward when running

    // Ground shadow
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle   = '#000';
    ctx.beginPath();
    ctx.ellipse(0, bodyBob + jumpY / scale + 4, 16 + Math.abs(swing) * 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ────────────────────────────────────────────────────────────────
    // Helper: draw a rounded limb segment (from point A to point B)
    // ────────────────────────────────────────────────────────────────
    const drawSegment = (x1, y1, x2, y2, w, colLight, colDark) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const len   = Math.hypot(x2 - x1, y2 - y1);
      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);
      const g = ctx.createLinearGradient(0, -w, 0, w);
      g.addColorStop(0, colLight);
      g.addColorStop(0.35, colLight);
      g.addColorStop(0.7, colDark);
      g.addColorStop(1, colDark + '88');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(0, -w * 0.5, len, w, w * 0.4);
      ctx.fill();
      ctx.restore();
    };

    // ────────────────────────────────────────────────────────────────
    // CAPE (drawn first, behind body)
    // ────────────────────────────────────────────────────────────────
    const capeLen  = running ? 22 + Math.abs(swing) * 14 : 12;
    const capeFlap = running ? swing * 8 : 0;
    ctx.save();
    const cg = ctx.createLinearGradient(dir * (-3), -torsoH, dir * (-capeLen), 0);
    cg.addColorStop(0, armorPri + 'ee');
    cg.addColorStop(0.5, armorDark + 'aa');
    cg.addColorStop(1, armorDark + '00');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(dir * (-4), -torsoH + 1);
    ctx.quadraticCurveTo(
      dir * (-capeLen * 0.5), -torsoH * 0.4 + capeFlap * 0.5,
      dir * (-capeLen),        capeFlap
    );
    ctx.quadraticCurveTo(
      dir * (-capeLen * 0.4), capeFlap * 0.4,
      dir * (-2),             -torsoH + 8
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ────────────────────────────────────────────────────────────────
    // LEGS
    // ────────────────────────────────────────────────────────────────
    // Leg 1 = left (swings forward when swing > 0)
    // Leg 2 = right (opposite phase)
    const leg1Thigh = swing * 0.55;        // thigh angle from vertical (rad)
    const leg2Thigh = -swing * 0.55;

    // Knee bends backward when leg swings backward
    const leg1Knee  = running ? Math.max(0, -leg1Thigh) * 0.85 : 0;
    const leg2Knee  = running ? Math.max(0, -leg2Thigh) * 0.85 : 0;

    const drawLeg = (hipOffX, thighAng, kneeBend, isBack) => {
      // Thigh: from hip downward
      const kx = hipOffX + Math.sin(thighAng) * thighL;
      const ky = Math.cos(thighAng) * thighL;
      // Shin: continues from knee
      const sa = thighAng + kneeBend;
      const fx = kx + Math.sin(sa) * shinL;
      const fy = ky + Math.cos(sa) * shinL;

      const alpha = isBack ? 0.7 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;

      // Thigh segment
      drawSegment(hipOffX, 0, kx, ky, 4.5, legCol, legDark);
      // Shin segment
      drawSegment(kx, ky, fx, fy, 3.5, legDark, bootCol);
      // Boot
      ctx.fillStyle = bootCol;
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(fx + dir * Math.sin(sa) * 3, fy, 5.5, 3, sa * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    // Draw back leg first, then front
    if (swing >= 0) {
      drawLeg(-3, leg2Thigh, leg2Knee, true);   // right = back
      drawLeg( 3, leg1Thigh, leg1Knee, false);  // left  = front
    } else {
      drawLeg( 3, leg1Thigh, leg1Knee, true);   // left  = back
      drawLeg(-3, leg2Thigh, leg2Knee, false);  // right = front
    }

    // ────────────────────────────────────────────────────────────────
    // TORSO  (trapezoid: wider at shoulders, narrower at waist)
    // ────────────────────────────────────────────────────────────────
    ctx.save();
    const tg = ctx.createLinearGradient(-torsoW, -torsoH, torsoW, 0);
    tg.addColorStop(0, armorHi + '55');
    tg.addColorStop(0.25, armorPri);
    tg.addColorStop(0.75, armorPri);
    tg.addColorStop(1, armorDark);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-torsoW * 0.85, -torsoH);
    ctx.lineTo( torsoW * 0.85, -torsoH);
    ctx.lineTo( torsoW * 0.5,   0);
    ctx.lineTo(-torsoW * 0.5,   0);
    ctx.closePath();
    ctx.fill();

    // Chest plate highlight (oval)
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.ellipse(0, -torsoH * 0.58, torsoW * 0.42, torsoH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder trim line
    ctx.strokeStyle = armorTrim;
    ctx.lineWidth   = 1.2;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(-torsoW * 0.85, -torsoH);
    ctx.lineTo( torsoW * 0.85, -torsoH);
    ctx.stroke();

    // Belt line
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-torsoW * 0.5, 0);
    ctx.lineTo( torsoW * 0.5, 0);
    ctx.stroke();
    ctx.restore();

    // ────────────────────────────────────────────────────────────────
    // ARMS  (opposing the legs for natural running)
    // ────────────────────────────────────────────────────────────────
    const arm1Upper = isCeleb ? (Math.PI * 0.85) : (-swing * 0.45); // left arm swings OPPOSITE left leg
    const arm2Upper = isCeleb ? (-Math.PI * 0.85) : (swing * 0.45);

    const drawArm = (shoulderX, upperAng, isBack) => {
      const ex = shoulderX + Math.sin(upperAng) * armUpL;
      const ey = -torsoH + 3 + Math.cos(upperAng) * armUpL;
      // Forearm hangs slightly forward
      const la = upperAng * 0.4;
      const fx2 = ex + Math.sin(la) * armLoL;
      const fy2 = ey + Math.cos(la) * armLoL;

      ctx.save();
      ctx.globalAlpha = isBack ? 0.65 : 1;
      drawSegment(shoulderX, -torsoH + 3, ex, ey, 3.5, armorPri, armorDark);
      drawSegment(ex, ey, fx2, fy2, 2.8, skinLight, skinDark);
      // Hand
      ctx.fillStyle = skinLight;
      ctx.beginPath();
      ctx.arc(fx2, fy2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    if (swing >= 0) {
      drawArm(-torsoW * 0.9, arm2Upper, true);   // right = back
      drawArm( torsoW * 0.9, arm1Upper, false);  // left  = front
    } else {
      drawArm( torsoW * 0.9, arm1Upper, true);   // left  = back
      drawArm(-torsoW * 0.9, arm2Upper, false);  // right = front
    }

    // ────────────────────────────────────────────────────────────────
    // HEAD  (3D sphere with face)
    // ────────────────────────────────────────────────────────────────
    const headCY = -torsoH - headR - 3;

    // Neck
    drawSegment(-2, -torsoH, 2, headCY + headR, 3, skinLight, skinDark);

    // Sphere gradient (light from upper-left)
    const hg = ctx.createRadialGradient(
      -headR * 0.3, headCY - headR * 0.3, headR * 0.1,
      0, headCY, headR
    );
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(0.2, skinLight);
    hg.addColorStop(0.7, skinLight);
    hg.addColorStop(1, skinDark);
    ctx.fillStyle = hg;
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, headCY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hair
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headCY - headR * 0.25, headR, Math.PI, Math.PI * 2);
    ctx.fill();
    if (isFem) {
      // Long flowing side strands
      ctx.strokeStyle = hairCol;
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      [1, -1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(side * headR * 0.7, headCY + 1);
        ctx.quadraticCurveTo(
          side * headR * 1.5,  headCY + headR + swing * dir * 3,
          side * headR * 1.1,  headCY + headR * 3 + swing * dir * 6
        );
        ctx.stroke();
      });
    } else {
      // Short spiky hair tufts
      ctx.fillStyle = hairCol;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3.5, headCY - headR * 0.88);
        ctx.lineTo(i * 3.5 + 1.5, headCY - headR * 1.3 - Math.abs(i) * 1.5);
        ctx.lineTo(i * 3.5 + 3, headCY - headR * 0.88);
        ctx.fill();
      }
    }

    // Eyes (face direction-aware)
    const eyeX = dir * headR * 0.28;
    ctx.fillStyle = '#1a0600';
    ctx.beginPath();
    ctx.ellipse(eyeX, headCY - 1, 1.8, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlight
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(eyeX + 0.5, headCY - 1.8, 0.65, 0, Math.PI * 2);
    ctx.fill();
    // Iris color
    ctx.fillStyle = isFem ? '#9030d0' : '#1a50c0';
    ctx.beginPath();
    ctx.ellipse(eyeX, headCY - 1, 1.1, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end main character transform

    // ────────────────────────────────────────────────────────────────
    // NAME BANNER (fixed above character, no lean)
    // ────────────────────────────────────────────────────────────────
    const totalH   = headR * 2 + torsoH + thighL + shinL;
    const bannerY  = footY - bodyBob - totalH - 22;
    
    const defaultName = isFem ? 'ARIA' : 'KAEL';
    let name = window.heroNames ? window.heroNames[this.selectedGender] : defaultName;
    if (!name || name.trim() === '') name = defaultName;
    name = name.toUpperCase();

    ctx.font         = 'bold 11px Cinzel, serif';
    const textW = ctx.measureText(name).width;
    const bW = Math.max(56, textW + 16);
    const bH = 18;

    ctx.save();
    // Pill background
    ctx.fillStyle   = 'rgba(0,0,0,0.82)';
    ctx.strokeStyle = armorTrim;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = isFem ? 'rgba(180,60,255,0.6)' : 'rgba(60,140,255,0.6)';
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(px - bW / 2, bannerY, bW, bH, 6);
    else               ctx.rect(px - bW / 2, bannerY, bW, bH);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur  = 0;

    ctx.fillStyle    = armorTrim;
    ctx.font         = 'bold 11px Cinzel, serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, px, bannerY + bH / 2);
    ctx.restore();
  }

  drawVictoryGraph(canvasId) {
    const canvas = $(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const activeColor = this.ctrl.mode === 'BFS' ? '#00d2ff' : '#ff9d00';
    
    // Map normalized coordinates from this.nodes
    const getCoords = (x, y) => {
      const paddingX = canvas.width * 0.12; 
      const paddingY = canvas.height * 0.12; 
      const w = canvas.width - paddingX * 2;
      const h = canvas.height - paddingY * 2;
      return {
        x: paddingX + x * w,
        y: paddingY + y * h
      };
    };

    // 1. Draw Sequential Traversed Edges with Directional Arrow Marks
    for (let i = 0; i < this.ctrl.visited.length - 1; i++) {
      const u = this.ctrl.visited[i];
      const v = this.ctrl.visited[i + 1];
      const n1 = this.nodes[u];
      const n2 = this.nodes[v];
      if (!n1 || !n2) continue;
      
      const c1 = getCoords(n1.x, n1.y);
      const c2 = getCoords(n2.x, n2.y);
      
      // Thick Glowing Traversed Line
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();

      // Traversal Direction Arrow Head at Midpoint
      const midX = c1.x + (c2.x - c1.x) * 0.55; 
      const midY = c1.y + (c2.y - c1.y) * 0.55;
      const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
      const arrowSize = 8;

      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - arrowSize * Math.cos(angle - Math.PI / 6), midY - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - arrowSize * Math.cos(angle + Math.PI / 6), midY - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }

    // 2. Draw Faint Untraversed Edges for Graph Context
    this.edges.forEach(([u, v]) => {
      const n1 = this.nodes[u];
      const n2 = this.nodes[v];
      if (!n1 || !n2) return;
      
      const c1 = getCoords(n1.x, n1.y);
      const c2 = getCoords(n2.x, n2.y);
      
      // Check if this edge was drawn sequentially above
      let isSequential = false;
      for (let i = 0; i < this.ctrl.visited.length - 1; i++) {
        if ((this.ctrl.visited[i] === u && this.ctrl.visited[i + 1] === v) || 
            (this.ctrl.visited[i] === v && this.ctrl.visited[i + 1] === u)) {
          isSequential = true;
          break;
        }
      }
      
      if (!isSequential) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
      }
    });

    // Draw Nodes
    Object.entries(this.nodes).forEach(([id, n]) => {
      const coords = getCoords(n.x, n.y);
      const isVisited = this.ctrl.visited.includes(id);
      
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 16, 0, Math.PI * 2);
      
      if (isVisited) {
        ctx.fillStyle = activeColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
      } else {
        ctx.fillStyle = '#10151e';
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1.5;
      }
      ctx.fill();
      ctx.stroke();

      // Node Label
      ctx.fillStyle = isVisited ? '#000000' : '#a0aec0';
      ctx.font = "bold 11px Cinzel";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(id, coords.x, coords.y);
    });
  }

  render() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    
    if(this.region) {
      this.ctx.fillStyle = this.region.particleColor;
      this.particles.forEach((p) => {
        p.y += p.vy;
        if(p.vx) p.x += p.vx;
        if(p.y < 0) {
          p.y = this.canvas.height;
          p.vx = 0;
        }
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        this.ctx.fill();
      });
      this.ctx.globalAlpha = 1.0;
    }

    if(!this.level) return;

    // Draw graph pathways (Edges)
    this.edges.forEach(([u,v]) => {
      const n1 = this.level.nodes[u];
      const n2 = this.level.nodes[v];
      if(!n1 || !n2) return;
      
      const c1 = this.getCanvasCoords(n1.x, n1.y);
      const c2 = this.getCanvasCoords(n2.x, n2.y);
      const isVisited = this.ctrl.visited.includes(u) && this.ctrl.visited.includes(v);
      
      if (isVisited) {
        // High-Intensity Glowing Neon Underlay (Vastly increased thickness and opacity)
        this.ctx.strokeStyle = this.ctrl.mode === 'BFS' ? 'rgba(0, 210, 255, 0.6)' : 'rgba(255, 140, 0, 0.6)';
        this.ctx.lineWidth = 18;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Thick Solid Core Energy Path
        this.ctx.strokeStyle = this.ctrl.mode === 'BFS' ? '#00e5ff' : '#ffaa00';
        this.ctx.lineWidth = 7;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Animated Sliding Ley Line Spark (Larger, more intense glow orb)
        const time = (Date.now() / 800) % 1.0; 
        const sparkX = c1.x + (c2.x - c1.x) * time;
        const sparkY = c1.y + (c2.y - c1.y) * time;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = this.ctrl.mode === 'BFS' ? '#00e5ff' : '#ffaa00';
        this.ctx.shadowBlur = 18;
        this.ctx.beginPath();
        this.ctx.arc(sparkX, sparkY, 6.5, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; 
      } else {
        // High-Contrast Dark Backing Path (Guarantees visibility over bright image details)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'; 
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Thick, Highly Visible Solid White Pathway (Matches the clean solid paths in reference)
        this.ctx.strokeStyle = '#f7fafc'; 
        this.ctx.lineWidth = 4.5;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();
      }
    });

    // Each node gets its own unique vibrant color identity
    const NODE_PALETTES = {
      'A': { light: '#ff3b30', mid: '#b91c1c', dark: '#1e0505', ring: '#ff3355', shadow: 'rgba(255, 30, 50, 0.95)'   }, // Vivid Red
      'B': { light: '#818cf8', mid: '#4338ca', dark: '#1e1b4b', ring: '#6366f1', shadow: 'rgba(99, 102, 241, 0.95)'  }, // Electric Indigo
      'C': { light: '#34d399', mid: '#059669', dark: '#064e3b', ring: '#10b981', shadow: 'rgba(16, 185, 129, 0.95)'  }, // Neon Emerald
      'D': { light: '#fbbf24', mid: '#d97706', dark: '#1c1400', ring: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.95)'  }, // Solar Amber
      'E': { light: '#f472b6', mid: '#be185d', dark: '#1e0215', ring: '#ec4899', shadow: 'rgba(236, 72, 153, 0.95)'  }, // Neon Pink
      'F': { light: '#38bdf8', mid: '#0284c7', dark: '#082038', ring: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.95)'  }, // Sky Cyan
      'G': { light: '#fb923c', mid: '#c2410c', dark: '#1c0a00', ring: '#f97316', shadow: 'rgba(249, 115, 22, 0.95)'  }, // Blaze Orange
      'H': { light: '#a78bfa', mid: '#7c3aed', dark: '#1e0f40', ring: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.95)'  }, // Vivid Violet
      'I': { light: '#2dd4bf', mid: '#0f766e', dark: '#042e2a', ring: '#14b8a6', shadow: 'rgba(20, 184, 166, 0.95)'  }, // Aqua Teal
    };
    
    // Fallback palette for any node id not in A-I
    const FALLBACK_PALETTE = { light: '#94a3b8', mid: '#475569', dark: '#0f172a', ring: '#64748b', shadow: 'rgba(100,116,139,0.7)' };

    // Draw graph nodes (Gorgeous Segmented Metallic / Stone Sockets with per-node unique colors)
    for(let id in this.nodes) {
      const n = this.nodes[id];
      const coords = this.getCanvasCoords(n.x, n.y);
      const isVisited = this.ctrl.visited.includes(id);
      const isCurrent = this.ctrl.visited[this.ctrl.visited.length - 1] === id;
      const isActive = isVisited || isCurrent;
      
      this.ctx.save();
      
      const palette = NODE_PALETTES[id] || FALLBACK_PALETTE;
      
      let ringColor, radialGrad;
      
      if (isActive) {
        // Fully lit up with unique per-node neon glow
        ringColor = palette.ring;
        this.ctx.shadowColor = palette.shadow;
        this.ctx.shadowBlur = 26;
        
        radialGrad = this.ctx.createRadialGradient(coords.x, coords.y, 2, coords.x, coords.y, 24);
        radialGrad.addColorStop(0, palette.light);
        radialGrad.addColorStop(0.5, palette.mid);
        radialGrad.addColorStop(1, palette.dark);
      } else {
        // Unvisited: muted dark socket showing a hint of the unique ring color
        ringColor = palette.ring + '66'; // 40% opacity hint of the node's color
        this.ctx.shadowBlur = 0;
        
        radialGrad = this.ctx.createRadialGradient(coords.x, coords.y, 2, coords.x, coords.y, 24);
        radialGrad.addColorStop(0, palette.dark);
        radialGrad.addColorStop(1, '#0a0c12');
      }

      // 1. Draw circular background fill
      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y, 24, 0, Math.PI*2);
      this.ctx.fillStyle = radialGrad;
      this.ctx.fill();

      // 2. Draw thick outer ring (unique per-node color, glowing when active)
      this.ctx.strokeStyle = isActive ? palette.ring : palette.ring + '66';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y, 24, 0, Math.PI*2);
      this.ctx.stroke();
      if (isActive) {
        this.ctx.stroke(); // Double stroke for extremely vibrant neon halo!
      }

      // 3. Draw inner concentric ring
      this.ctx.strokeStyle = isActive ? palette.light + 'cc' : '#2d3748';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y, 19, 0, Math.PI*2);
      this.ctx.stroke();

      // 4. Draw 8 radial gear notches
      this.ctx.strokeStyle = isActive ? palette.ring : palette.ring + '55';
      this.ctx.lineWidth = 1.8;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x + Math.cos(a) * 19, coords.y + Math.sin(a) * 19);
        this.ctx.lineTo(coords.x + Math.cos(a) * 24, coords.y + Math.sin(a) * 24);
        this.ctx.stroke();
      }
      
      // 5. Draw centered node letter label
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
      this.ctx.font = 'bold 18px Cinzel, serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(id, coords.x, coords.y);
      
      this.ctx.restore();
    }

    // Update and draw player avatar positions
    if (this.animProgress < 1.0) {
      this.animProgress += 0.010; // Even slower, more relaxed travel time
      this.runFrame++;             // advance running bob frame

      // Emit dust every 3 frames while running
      if (this.runFrame % 3 === 0) this.emitDustTrail();

      if (this.animProgress >= 1.0) {
        this.animProgress = 1.0;
        this.playerX   = this.animTarget.x;
        this.playerY   = this.animTarget.y;
        this.isRunning = false;
        this.runFrame  = 0;
        // Arrival star-burst!
        this.emitArrivalBurst(this.animTarget.x, this.animTarget.y - 26);
      } else {
        // Smooth ease-in-out interpolation
        const t    = this.animProgress;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        this.playerX = this.animSource.x + (this.animTarget.x - this.animSource.x) * ease;
        this.playerY = this.animSource.y + (this.animTarget.y - this.animSource.y) * ease;
      }
    } else if (this.playerNode && this.nodes[this.playerNode]) {
      const currentPos = this.getCanvasCoords(this.nodes[this.playerNode].x, this.nodes[this.playerNode].y);
      this.playerX   = currentPos.x;
      this.playerY   = currentPos.y;
      this.isRunning = false;
    }

    // Draw trail + burst particles BEFORE avatar (so they appear behind/around feet)
    this.drawCharParticles();
    this.drawPlayerAvatar();
    this.drawCatHint();
    this.drawLegend();
  }

  // Draws a cute procedural gold/white cat that offers a hint if idle
  drawCatHint() {
    if (!this.ctrl || this.isCelebrating || this.ctrl.visited.length >= Object.keys(this.nodes).length) return;
    
    // Check if idle for 10 seconds
    if (Date.now() - this.lastActionTime < 10000) return;

    // Determine the next valid node
    const expectedNode = this.ctrl.expectedOrder[this.ctrl.visited.length];
    if (!expectedNode) return;

    const ctx = this.ctx;
    ctx.save();
    
    // Position cat slightly offset from player (behind them)
    const cx = this.playerX + (this.facingRight ? -45 : 45);
    const cy = this.playerY - 10;

    // Small bobbing and wagging animation
    const bob = Math.sin(Date.now() / 200) * 3;
    const wag = Math.sin(Date.now() / 150) * 0.4;
    
    ctx.translate(cx, cy + bob);
    ctx.scale(1.25, 1.25); // Make the cat a bit larger
    
    // 1. Shadow underneath
    ctx.beginPath();
    ctx.ellipse(0, 15, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.filter = 'blur(2px)';
    ctx.fill();
    ctx.filter = 'none';

    // 2. Tail (wags)
    ctx.save();
    ctx.translate(-8, 8);
    ctx.rotate(wag);
    const tailGrad = ctx.createLinearGradient(-15, -20, 0, 0);
    tailGrad.addColorStop(0, '#ff9d00'); // Orange tip
    tailGrad.addColorStop(1, '#ffffff'); // White base
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -10, -5, -20);
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // 3. Body (gradient)
    const bodyGrad = ctx.createRadialGradient(-3, 2, 2, 0, 5, 12);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(1, '#e0e0e0');
    ctx.beginPath();
    ctx.ellipse(0, 7, 11, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 4. Back Leg / Haunch
    ctx.beginPath();
    ctx.ellipse(-5, 10, 5, 6, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#d0d0d0';
    ctx.fill();

    // 5. Orange Patch on Body
    const patchGrad = ctx.createLinearGradient(0, 0, 8, 12);
    patchGrad.addColorStop(0, '#ffaa00');
    patchGrad.addColorStop(1, '#cc5500');
    ctx.beginPath();
    ctx.ellipse(4, 5, 6, 7, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = patchGrad;
    ctx.fill();

    // 6. Front Paws
    ctx.beginPath();
    ctx.ellipse(3, 15, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 14, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 7. Head (gradient)
    const headGrad = ctx.createRadialGradient(-2, -7, 2, 0, -5, 10);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(1, '#d9d9d9');
    ctx.beginPath();
    ctx.arc(0, -5, 10, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();

    // 8. Ears
    // Left ear (White outer, pink inner)
    ctx.beginPath();
    ctx.moveTo(-9, -10); ctx.lineTo(-13, -22); ctx.lineTo(-2, -14);
    ctx.fillStyle = '#e6e6e6'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -12); ctx.lineTo(-11, -19); ctx.lineTo(-4, -14);
    ctx.fillStyle = '#ff9999'; ctx.fill();

    // Right ear (Orange outer, pink inner)
    ctx.beginPath();
    ctx.moveTo(9, -10); ctx.lineTo(13, -22); ctx.lineTo(2, -14);
    ctx.fillStyle = '#ff9d00'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -12); ctx.lineTo(11, -19); ctx.lineTo(4, -14);
    ctx.fillStyle = '#ff9999'; ctx.fill();

    // 9. Muzzle
    ctx.beginPath();
    ctx.ellipse(0, -1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 10. Nose
    ctx.beginPath();
    ctx.moveTo(-1.5, -2); ctx.lineTo(1.5, -2); ctx.lineTo(0, 0);
    ctx.fillStyle = '#ff7777';
    ctx.fill();

    // 11. Eyes (with catchlights)
    ctx.beginPath();
    ctx.ellipse(-4, -5.5, 1.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath();
    ctx.arc(-4.5, -6.5, 0.6, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();

    ctx.beginPath();
    ctx.ellipse(4, -5.5, 1.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath();
    ctx.arc(3.5, -6.5, 0.6, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();

    // 12. Whiskers
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-3, -1); ctx.lineTo(-12, -2);
    ctx.moveTo(-3, 0);  ctx.lineTo(-13, 1);
    ctx.moveTo(3, -1); ctx.lineTo(12, -2);
    ctx.moveTo(3, 0);  ctx.lineTo(13, 1);
    ctx.stroke();

    // Speech Bubble "Need a hint?"
    const text = `Sudo here! Try node ${expectedNode}`;
    ctx.font = 'bold 12px Cinzel';
    const tW = ctx.measureText(text).width + 16;
    
    ctx.translate(0, -35); // Move up for speech bubble
    
    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-5, -5);
    ctx.lineTo(5, -5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();

    // Bubble body
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-tW/2, -25, tW, 20, 6);
    } else {
      ctx.rect(-tW/2, -25, tW, 20);
    }
    ctx.fill();
    
    // Orange trim around bubble
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#1a0600';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -14);
    
    ctx.restore();
  }

  // Draw a horizontal, clean, highly-legible canvas legend matching the reference image
  drawLegend() {
    const items = [
      { label: "Start Node", fill: "#1e0505", border: "#ff3355", glow: "rgba(255, 51, 85, 0.7)" },
      { label: "Visited", fill: "#003c73", border: "#00e5ff", glow: "rgba(0, 210, 255, 0.6)" },
      { label: "Current", fill: "#003d1c", border: "#00ff88", glow: "rgba(0, 255, 136, 0.6)" },
      { label: "Unvisited", fill: "#121620", border: "#4e535c", glow: null }
    ];
    
    const centerY = this.canvas.height - 25;
    const itemWidth = 110;
    const totalWidth = items.length * itemWidth;
    let startX = (this.canvas.width - totalWidth) / 2 + 10;
    
    this.ctx.save();
    items.forEach((item, i) => {
      const cx = startX + i * itemWidth;
      
      // 1. Draw glowing color circle indicator
      this.ctx.beginPath();
      this.ctx.arc(cx, centerY, 6, 0, Math.PI * 2);
      
      if (item.glow) {
        this.ctx.shadowColor = item.glow;
        this.ctx.shadowBlur = 10;
      } else {
        this.ctx.shadowBlur = 0;
      }
      
      this.ctx.fillStyle = item.fill;
      this.ctx.strokeStyle = item.border;
      this.ctx.lineWidth = 2;
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
      
      // 2. Draw text label
      this.ctx.fillStyle = i === 3 ? '#cbd5e0' : '#ffffff';
      this.ctx.font = "bold 11px Cinzel, serif";
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.label, cx + 12, centerY);
    });
    this.ctx.restore();
  }
}

// ============================================================================
// CHARACTER SELECTION (Global – called from inline onclick in HTML)
// ============================================================================
window.heroNames = {
  male: 'Kael',
  female: 'Aria'
};

window.updateHeroName = function(gender, newName) {
  window.heroNames[gender] = newName;
};

window.selectCharacter = function(gender) {
  const maleCard   = document.getElementById('char-male');
  const femaleCard = document.getElementById('char-female');
  if (!maleCard || !femaleCard) return;

  // Toggle selected class
  maleCard.classList.remove('selected');
  femaleCard.classList.remove('selected');
  const chosen = gender === 'male' ? maleCard : femaleCard;
  chosen.classList.add('selected');

  // Persist selection
  localStorage.setItem('gq_selected_character', gender);

  // Swap the live canvas sprite so it takes effect immediately
  if (window.game && window.game.renderer) {
    window.game.renderer.switchCharacterImage(gender);
  }

  // Update sidebar hero art
  const heroImg = document.querySelector('.hero-character-img');
  if (heroImg) {
    heroImg.src = gender === 'male' ? 'assets/male_hero.png' : 'assets/female_hero.png';
    heroImg.alt = gender === 'male' ? 'Kael – The Pathfinder' : 'Aria – The Sorceress';
  }

  // Gold flash ripple on the card
  chosen.style.transition = 'box-shadow 0.15s';
  chosen.style.boxShadow  = '0 0 40px rgba(255,215,0,0.9)';
  setTimeout(() => {
    chosen.style.boxShadow  = '';
    chosen.style.transition = '';
  }, 420);

  // Enable the Begin Quest button
  const btn  = document.getElementById('btn-begin-quest');
  const hint = document.getElementById('begin-quest-hint');
  if (btn) {
    btn.classList.add('ready');
  }
  if (hint) {
    const heroName = gender === 'female' ? 'Aria' : 'Kael';
    hint.textContent = `✦ ${heroName} is ready for the journey! ✦`;
    hint.classList.remove('hidden');
  }
};

/** Called by the Begin Quest button – starts Story Mode with chosen hero */
window.beginQuest = function() {
  const btn = document.getElementById('btn-begin-quest');
  if (!btn || !btn.classList.contains('ready')) return;

  // Close the start menu overlay
  const menu = document.getElementById('start-menu');
  if (menu) menu.classList.add('hidden');

  // Kick off Story Mode via the game controller
  if (window.game) {
    window.game.startStoryMode();
  }
};

// Restore previously saved character on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('gq_selected_character');
  if (saved) {
    window.selectCharacter(saved);
  }
});

// Bootstrap
window.addEventListener('load', () => {
  window.game = new GameController();
});

