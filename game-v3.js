/* 
================================================================================
   GRAPH QUEST: THE TRAVERSAL REALMS - V3 (Drag & Drop + Custom Graphs)
================================================================================
*/
'use strict';

const $ = id => document.getElementById(id);

// ============================================================================
// 1. REGION & LEVEL DATA
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
  { id:1, name:"Elderwood Grove", region:"FOREST", mode:"DFS", startNode:"A", nodes:{"A":{x:200,y:250},"B":{x:400,y:150},"C":{x:400,y:350},"D":{x:600,y:150},"E":{x:600,y:350}}, edges:[["A","B"],["A","C"],["B","D"],["C","E"]] },
  { id:2, name:"Nimbus Arch", region:"SKYLANDS", mode:"BFS", startNode:"A", nodes:{"A":{x:150,y:250},"B":{x:350,y:100},"C":{x:350,y:250},"D":{x:350,y:400},"E":{x:550,y:175},"F":{x:550,y:325}}, edges:[["A","B"],["A","C"],["A","D"],["B","E"],["C","F"]] }
];

// ============================================================================
// 2. AI GUIDE CONTROLLER
// ============================================================================
class AIGuideController {
  constructor() {
    this.textEl = $('guide-dialogue');
    this.hintEl = $('guide-hint-text');
  }
  say(text, isHint = false) {
    if(isHint) {
      this.hintEl.innerText = text;
      this.hintEl.classList.remove('hidden');
    } else {
      this.textEl.innerText = text;
      this.hintEl.classList.add('hidden');
    }
  }
  feedback(isCorrect, mode, expectedNode, wrongNode) {
    if(isCorrect) {
      this.say(`Correct! ${mode === 'BFS' ? 'BFS explores all immediate neighbors first.' : 'DFS goes deep into the current path before backtracking.'}`);
    } else {
      const why = mode === 'BFS' ? 
        `Incorrect! Node ${wrongNode} is deeper in the graph. BFS must first explore all nodes at the current depth level.` : 
        `Incorrect! DFS continues exploring the current branch before backtracking.`;
      this.say(`${why} \n\nNode ${expectedNode} should be placed next!`);
    }
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
    this.graph = {};
    
    this.ai = new AIGuideController();
    this.renderer = new GameRenderer(this);
    
    this._bindEvents();
    
    // Start background render loop
    this.renderer.startLoop();
  }
  
  _bindEvents() {
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
    $('btn-victory-next').onclick = () => $('start-menu').classList.remove('hidden');
    $('btn-hud-menu').onclick = () => $('start-menu').classList.remove('hidden');
  }

  startStoryMode() {
    $('start-menu').classList.add('hidden');
    $('victory-overlay').classList.add('hidden');
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
    
    // Radial Layout logic
    const nodesObj = {};
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2 - 50;
    const radius = 200;
    
    nodeNames.forEach((name, i) => {
      if(name === startNode) {
        nodesObj[name] = { x: 150, y: cy };
      } else {
        const angle = (i / (nodeNames.length - 1 || 1)) * Math.PI - Math.PI/2;
        nodesObj[name] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
      }
    });

    const level = {
      name: "Custom Realm",
      region: "CELESTIAL",
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
    $('hud-level-name').innerText = levelData.name;
    $('hud-mode-text').innerText = `${this.mode} Mode`;
    this.ai.say(`Welcome to ${levelData.name}! Drag nodes into the traversal slots below in the correct ${this.mode} order.`);
    
    // Build adjacency list
    this.graph = {};
    Object.keys(levelData.nodes).forEach(n => this.graph[n] = []);
    levelData.edges.forEach(([u,v]) => {
      if(this.graph[u]) this.graph[u].push(v);
      if(this.graph[v]) this.graph[v].push(u); // Undirected
    });

    // Sort neighbors alphabetically for predictable traversal
    Object.keys(this.graph).forEach(n => this.graph[n].sort());

    this.expectedOrder = this.computeTraversal(levelData.startNode, this.mode);
    this.visited = [];
    
    this.setupSlots();
    this.renderer.setLevel(this.level);
    this.updateAlgoVisuals();
  }

  computeTraversal(start, mode) {
    const order = [];
    const vis = new Set();
    
    if(mode === 'BFS') {
      const q = [start];
      vis.add(start);
      while(q.length > 0) {
        const curr = q.shift();
        order.push(curr);
        for(let n of this.graph[curr]) {
          if(!vis.has(n)) {
            vis.add(n);
            q.push(n);
          }
        }
      }
    } else { // DFS
      const dfs = (node) => {
        vis.add(node);
        order.push(node);
        for(let n of this.graph[node]) {
          if(!vis.has(n)) dfs(n);
        }
      };
      dfs(start);
    }
    return order;
  }

  setupSlots() {
    const container = $('traversal-slots-container');
    container.innerHTML = '';
    this.expectedOrder.forEach((node, i) => {
      const slot = document.createElement('div');
      slot.className = 't-slot';
      slot.dataset.index = i;
      container.appendChild(slot);
    });
  }

  handleNodeDrop(nodeId, slotIndex) {
    if (slotIndex !== this.visited.length) return false; // Must fill slots sequentially
    
    const expected = this.expectedOrder[this.visited.length];
    if (nodeId === expected) {
      this.visited.push(nodeId);
      this.ai.feedback(true, this.mode, expected, nodeId);
      
      const slots = document.querySelectorAll('.t-slot');
      if(slots[slotIndex]) {
        slots[slotIndex].classList.add('filled');
        slots[slotIndex].innerText = nodeId;
        gsap.from(slots[slotIndex], { scale: 1.5, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
      
      this.updateAlgoVisuals();
      this.renderer.playCorrectVFX(nodeId);
      
      if(this.visited.length === this.expectedOrder.length) {
        setTimeout(() => this.showVictory(), 1500);
      }
      return true;
    } else {
      this.ai.feedback(false, this.mode, expected, nodeId);
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 500);
      return false; // Snap back
    }
  }

  updateAlgoVisuals() {
    // Basic representation of queue/stack
    const list = $('algo-items-list');
    $('algo-title-text').innerText = this.mode === 'BFS' ? 'Queue (FIFO)' : 'Stack (LIFO)';
    list.innerHTML = '';
    
    // Naive state tracking for visualizer based on visited nodes
    const visSet = new Set(this.visited);
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
      // For DFS, just show the current path
      ds = [...this.visited].reverse(); // top of stack first
    }
    
    if(ds.length === 0) {
      list.innerHTML = '<div class="algo-empty">Empty</div>';
    } else {
      ds.forEach(item => {
        const div = document.createElement('div');
        div.className = 'algo-item';
        div.innerText = item;
        list.appendChild(div);
      });
    }
  }
  
  showVictory() {
    $('victory-overlay').classList.remove('hidden');
    $('victory-summary').className = `concept-summary ${this.mode.toLowerCase()}-concept`;
    $('victory-summary').innerHTML = `<strong>What you learned:</strong> ${this.mode === 'BFS' ? 'BFS explores layer by layer, guaranteeing the shortest path in unweighted graphs!' : 'DFS dives as deeply as possible, making it great for finding paths through mazes and topological sorting!'}`;
  }
}

// ============================================================================
// 4. GAME RENDERER (Canvas + Drag/Drop)
// ============================================================================
class GameRenderer {
  constructor(controller) {
    this.ctrl = controller;
    this.canvas = $('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    this.draggedNode = null;
    this.dragOffset = {x:0, y:0};
    
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', e => this.onPointerUp(e));
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setLevel(level) {
    this.level = level;
    this.region = REGIONS[level.region];
    this.nodes = JSON.parse(JSON.stringify(level.nodes)); // deep copy for dragging
    this.edges = level.edges;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    for(let i=0; i<50; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vy: Math.random() * -1 - 0.5,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
  }
  
  onPointerDown(e) {
    if(!this.level) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    for(let id in this.nodes) {
      if(this.ctrl.visited.includes(id)) continue; // Already placed
      const n = this.nodes[id];
      const dx = mouseX - n.x;
      const dy = mouseY - n.y;
      if(dx*dx + dy*dy < 40*40) {
        this.draggedNode = id;
        this.dragOffset = {x: dx, y: dy};
        this.originalPos = {x: n.x, y: n.y};
        break;
      }
    }
  }
  
  onPointerMove(e) {
    if(!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    this.nodes[this.draggedNode].x = e.clientX - rect.left - this.dragOffset.x;
    this.nodes[this.draggedNode].y = e.clientY - rect.top - this.dragOffset.y;
    
    // Highlight drop slots if hovering
    const slots = document.querySelectorAll('.t-slot:not(.filled)');
    slots.forEach(slot => {
      const sRect = slot.getBoundingClientRect();
      if(e.clientX > sRect.left && e.clientX < sRect.right && e.clientY > sRect.top && e.clientY < sRect.bottom) {
        slot.classList.add('active-drop');
      } else {
        slot.classList.remove('active-drop');
      }
    });
  }
  
  onPointerUp(e) {
    if(!this.draggedNode) return;
    
    let droppedInSlot = -1;
    const slots = document.querySelectorAll('.t-slot');
    slots.forEach((slot, idx) => {
      slot.classList.remove('active-drop');
      const sRect = slot.getBoundingClientRect();
      if(e.clientX > sRect.left && e.clientX < sRect.right && e.clientY > sRect.top && e.clientY < sRect.bottom) {
        droppedInSlot = idx;
      }
    });
    
    if(droppedInSlot >= 0) {
      const success = this.ctrl.handleNodeDrop(this.draggedNode, droppedInSlot);
      if(!success) {
        // Snap back
        gsap.to(this.nodes[this.draggedNode], { x: this.originalPos.x, y: this.originalPos.y, duration: 0.3, ease: 'power2.out' });
      } else {
        // Hide node from canvas since it's now in the slot
        this.nodes[this.draggedNode].placed = true; 
      }
    } else {
      // Snap back if dropped anywhere else
      gsap.to(this.nodes[this.draggedNode], { x: this.originalPos.x, y: this.originalPos.y, duration: 0.3, ease: 'power2.out' });
    }
    
    this.draggedNode = null;
  }
  
  playCorrectVFX(nodeId) {
    // Generate a burst of particles from the original node pos
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
    
    // Draw background gradient based on region
    if(this.region) {
      const grad = this.ctx.createLinearGradient(0,0,0,this.canvas.height);
      grad.addColorStop(0, this.region.sky[0]);
      grad.addColorStop(1, this.region.sky[2]);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      
      // Draw particles
      this.ctx.fillStyle = this.region.particleColor;
      this.particles.forEach(p => {
        p.y += p.vy;
        if(p.y < 0) p.y = this.canvas.height;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        this.ctx.fill();
      });
      this.ctx.globalAlpha = 1.0;
    }

    if(!this.level) return;

    // Draw Edges
    this.ctx.lineWidth = 3;
    this.edges.forEach(([u,v]) => {
      const n1 = this.level.nodes[u]; // use original static positions for lines to avoid moving lines during drag
      const n2 = this.level.nodes[v];
      if(!n1 || !n2) return;
      
      const isVisited = this.ctrl.visited.includes(u) && this.ctrl.visited.includes(v);
      
      this.ctx.strokeStyle = isVisited ? (this.ctrl.mode === 'BFS' ? '#00d2ff' : '#ff9d00') : 'rgba(255,255,255,0.2)';
      this.ctx.beginPath();
      this.ctx.moveTo(n1.x, n1.y);
      this.ctx.lineTo(n2.x, n2.y);
      this.ctx.stroke();
    });

    // Draw Nodes
    for(let id in this.nodes) {
      const n = this.nodes[id];
      if(n.placed) continue; // Don't draw if dropped successfully in slot
      
      const isVisited = this.ctrl.visited.includes(id);
      
      // Glow if it's the expected next node (Hint)
      if(id === this.ctrl.expectedOrder[this.ctrl.visited.length]) {
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        this.ctx.shadowBlur = 15;
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillStyle = isVisited ? '#555' : (id === this.draggedNode ? '#fff' : '#2a3a4a');
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, 25, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px Cinzel';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(id, n.x, n.y);
    }
  }
}

// Bootstrap
window.addEventListener('load', () => {
  window.game = new GameController();
});
