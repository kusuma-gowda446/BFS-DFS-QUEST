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
    this.hintEl = $('guide-hint-text');
  }
  say(text) {
    this.textEl.innerHTML = text;
  }
  showClue(text) {
    this.hintEl.innerHTML = text;
    this.hintEl.classList.remove('hidden');
  }
  hideClue() {
    this.hintEl.classList.add('hidden');
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
    
    this.ai = new AIGuideController();
    this.renderer = new GameRenderer(this);
    
    this._bindEvents();
    this.startTimer();
    
    // Start background render loop
    this.renderer.startLoop();
  }
  
  _bindEvents() {
    // Start Menu bindings
    $('btn-mode-story').onclick = () => this.startStoryMode();
    $('btn-mode-custom').onclick = () => {
      $('menu-main-view').classList.add('hidden');
      $('menu-custom-view').classList.remove('hidden');
    };
    $('btn-back-main').onclick = () => {
      $('menu-main-view').classList.remove('hidden');
      $('menu-custom-view').classList.add('hidden');
    };
    $('btn-generate-custom').onclick = () => this.generateCustomGraph();
    
    // Left Sidebar bindings
    $('sidebar-btn-bfs').onclick = () => {
      if (this.mode === 'BFS') return;
      this.mode = 'BFS';
      this.loadLevel({...this.level, mode: 'BFS'});
    };
    $('sidebar-btn-dfs').onclick = () => {
      if (this.mode === 'DFS') return;
      this.mode = 'DFS';
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
          // Centered normalized coordinates mimicking the reference mockup
          const hardLevel = {
            id: 3,
            name: "The Waterfall Path",
            region: "VALLEY",
            mode: this.mode,
            startNode: "A",
            nodes: {
              "A": { x: 0.5, y: 0.1 },
              "B": { x: 0.3, y: 0.3 },
              "C": { x: 0.7, y: 0.3 },
              "D": { x: 0.9, y: 0.45 },
              "E": { x: 0.1, y: 0.65 },
              "F": { x: 0.35, y: 0.65 },
              "G": { x: 0.6, y: 0.65 },
              "H": { x: 0.85, y: 0.65 },
              "I": { x: 0.5, y: 0.9 }
            },
            edges: [
              ["A", "B"], ["A", "C"], ["B", "E"], ["B", "F"],
              ["C", "G"], ["C", "D"], ["D", "H"], ["F", "I"], ["G", "I"]
            ]
          };
          this.currentLevelIndex = 2;
          this.loadLevel(hardLevel);
        }
      };
    });

    // Sound Controls
    $('btn-sound').onclick = () => {
      const icon = $('btn-sound').querySelector('i');
      if (icon.classList.contains('fa-volume-high')) {
        icon.className = 'fa-solid fa-volume-xmark';
      } else {
        icon.className = 'fa-solid fa-volume-high';
      }
    };
    
    // Help Panel Trigger
    $('btn-help').onclick = () => {
      this.ai.say(`💡 <b>Graph Quest Help:</b> Choose a traversal mode on the left. Analyze the world graph, and choose the correct next node by clicking the bottom circles or clicking the nodes directly in the canvas!`);
    };

    // HUD Menu
    $('btn-hud-menu').onclick = () => $('start-menu').classList.remove('hidden');

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
      const correctNode = this.expectedOrder[this.visited.length];
      if (correctNode) {
        this.ai.say(`🔮 <b>Power-Up: Hint Active!</b> Aria reveals the next correct traversal path leads to Node <b>${correctNode}</b>.`);
        this.renderer.playCorrectVFX(correctNode);
      }
    };

    $('powerup-rewind').onclick = () => {
      if (this.visited.length > 0) {
        const popped = this.visited.pop();
        this.ai.say(`⏳ <b>Power-Up: Rewind Active!</b> Undoing last step. Node <b>${popped}</b> has been returned to the ether.`);
        this.setupSlots();
        this.updateAlgoVisuals();
        this.updateClue();
        this.updateChoiceButtons();
      }
    };

    $('powerup-shield').onclick = () => {
      this.ai.say(`🛡️ <b>Power-Up: Shield Active!</b> Protected against your next incorrect move!`);
    };
  }

  startStoryMode() {
    $('start-menu').classList.add('hidden');
    $('victory-overlay').classList.add('hidden');
    this.currentLevelIndex = 0;
    
    $('diff-easy').classList.add('active');
    $('diff-medium').classList.remove('active');
    $('diff-hard').classList.remove('active');
    
    this.loadLevel(LEVELS[0]);
  }

  generateCustomGraph() {
    const nodesStr = $('custom-nodes-input').value;
    const edgesStr = $('custom-edges-input').value;
    const startNode = $('custom-start-input').value.trim();
    const mode = $('custom-algo-select').value;
    
    const nodeNames = nodesStr.split(',').map(n => n.trim()).filter(n => n);
    const edgesRaw = edgesStr.split(',').map(e => e.trim()).filter(e => e);
    const edges = edgesRaw.map(e => e.split('-').map(n=>n.trim()));
    
    // Centered normalized radial positions
    const nodesObj = {};
    nodeNames.forEach((name, i) => {
      if(name === startNode) {
        nodesObj[name] = { x: 0.5, y: 0.5 };
      } else {
        const angle = (i / (nodeNames.length - 1 || 1)) * Math.PI * 2;
        nodesObj[name] = { 
          x: 0.5 + Math.cos(angle) * 0.35, 
          y: 0.5 + Math.sin(angle) * 0.35 
        };
      }
    });

    const level = {
      name: "Custom Realm",
      region: "RUINS",
      mode: mode,
      startNode: startNode,
      nodes: nodesObj,
      edges: edges
    };
    
    $('start-menu').classList.add('hidden');
    this.loadLevel(level);
  }

  loadLevel(levelData) {
    this.level = levelData;
    this.mode = levelData.mode;
    
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
    
    this.setupSlots();
    this.renderer.setLevel(this.level);
    this.updateAlgoVisuals();
    this.updateClue();
    this.updateChoiceButtons();
  }

  updateClue() {
    const idx = this.visited.length;
    if (idx < this.stepClues.length) {
      this.ai.showClue(this.stepClues[idx]);
    } else {
      this.ai.hideClue();
    }
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
      
      if(this.visited.length === this.expectedOrder.length) {
        this.ai.say(`🎉 <b>Excellent job, Pathfinder!</b> You have successfully restored the ancient energy paths of this realm!`);
        this.ai.hideClue();
        setTimeout(() => this.showVictory(), 1500);
      } else {
        this.updateClue();
        this.updateChoiceButtons();
      }
      return true;
    } else {
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 500);
      
      const currentClue = this.stepClues[this.visited.length];
      this.ai.showClue(`❌ <b>Not quite!</b> ${currentClue}`);
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
    $('victory-summary').className = `concept-summary ${this.mode.toLowerCase()}-concept`;
    $('victory-summary').innerHTML = `<strong>What you learned:</strong> ${this.mode === 'BFS' ? 'BFS explores layer by layer, guaranteeing the shortest path in unweighted graphs!' : 'DFS dives as deeply as possible, making it great for finding paths through mazes and topological sorting!'}`;
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
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
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
        // Glowing Neon Underlay
        this.ctx.strokeStyle = this.ctrl.mode === 'BFS' ? 'rgba(0, 210, 255, 0.45)' : 'rgba(255, 157, 0, 0.45)';
        this.ctx.lineWidth = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Main Solid Core Energy Path
        this.ctx.strokeStyle = this.ctrl.mode === 'BFS' ? '#00d2ff' : '#ff9d00';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();

        // Animated Sliding Ley Line Spark
        const time = (Date.now() / 800) % 1.0; 
        const sparkX = c1.x + (c2.x - c1.x) * time;
        const sparkY = c1.y + (c2.y - c1.y) * time;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = this.ctrl.mode === 'BFS' ? '#00d2ff' : '#ff9d00';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(sparkX, sparkY, 4, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0; 
      } else {
        // Highly visible golden dashed pathway
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.48)'; 
        this.ctx.lineWidth = 3.5;
        this.ctx.setLineDash([6, 6]); 
        this.ctx.beginPath();
        this.ctx.moveTo(c1.x, c1.y);
        this.ctx.lineTo(c2.x, c2.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]); 
      }
    });

    // Draw graph nodes
    for(let id in this.nodes) {
      const n = this.nodes[id];
      const coords = this.getCanvasCoords(n.x, n.y);
      const isVisited = this.ctrl.visited.includes(id);
      const isCurrent = this.ctrl.visited[this.ctrl.visited.length - 1] === id;
      const isNextHint = id === this.ctrl.expectedOrder[this.ctrl.visited.length];
      
      if(isNextHint) {
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        this.ctx.shadowBlur = 18;
      } else {
        this.ctx.shadowBlur = 0;
      }

      if (id === this.level.startNode) {
        this.ctx.fillStyle = '#1e0505';
        this.ctx.strokeStyle = '#ff3355';
      } else if (isCurrent) {
        this.ctx.fillStyle = '#051e10';
        this.ctx.strokeStyle = '#00ff88';
      } else if (isVisited) {
        this.ctx.fillStyle = '#051325';
        this.ctx.strokeStyle = '#00d2ff';
      } else {
        this.ctx.fillStyle = '#10151e';
        this.ctx.strokeStyle = '#718096';
      }

      this.ctx.lineWidth = 3.5;
      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y, 25, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 18px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(id, coords.x, coords.y);
    }
  }
}

// Bootstrap
window.addEventListener('load', () => {
  window.game = new GameController();
});
