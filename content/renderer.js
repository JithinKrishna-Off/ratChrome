/**
 * Renderer - Canvas overlay for snake + rat
 */
var SnakeChaseRenderer = class SnakeChaseRenderer {
  constructor(settings) {
    this.settings = { ...settings };
    this.canvas = null;
    this.ctx = null;
    this.snake = null;
    this.rat = null;
    this.animationId = null;
    this.lastTime = 0;
    this.time = 0;
    this.isHidden = false;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.mouseInside = true;
    this.dpr = window.devicePixelRatio || 1;

    this.catchEffectTime = 0;

    this.boundResize = () => this.resize();
    this.boundVisibility = () => this.handleVisibility();
  }

  init() {
    this.createOverlay();
    this.snake = new Snake(this.settings);
    this.rat = new Rat(this.settings);
    this.rat.setPosition(this.mouseX, this.mouseY);
    this.resize();
    this.start();
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('visibilitychange', this.boundVisibility);
  }

  createOverlay() {
    let overlay = document.getElementById('snake-chase-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'snake-chase-overlay';
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'snake-chase-canvas';
    overlay.appendChild(this.canvas);
    document.documentElement.appendChild(overlay);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    document.documentElement.classList.add('snake-chase-active');
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  handleVisibility() {
    if (document.hidden) {
      this.isHidden = true;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    } else {
      this.isHidden = false;
      this.lastTime = performance.now();
      if (!this.animationId) this.start();
    }
  }

  setMousePosition(x, y, inside = true) {
    this.mouseX = x;
    this.mouseY = y;
    this.mouseInside = inside;
    if (this.rat) this.rat.setPosition(x, y);
  }

  updateSettings(newSettings) {
    this.settings = { ...newSettings };
    if (this.snake) this.snake.updateSettings(this.settings);
    if (this.rat) this.rat.updateSettings(this.settings);
  }

  start() {
    if (this.animationId) return;
    console.log("[SnakeChase] RENDERER STARTED");
    this.lastTime = performance.now();
    const loop = (now) => {
      if (this.isHidden || document.hidden) {
        this.animationId = null;
        return;
      }
      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;
      this.time += delta;
      this.update(delta);
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibility);
    const overlay = document.getElementById('snake-chase-overlay');
    if (overlay) overlay.remove();
    document.documentElement.classList.remove('snake-chase-active');
    this.canvas = null;
    this.ctx = null;
  }

  update(deltaTime) {
    if (!this.snake || !this.rat) return;
    this.rat.update(deltaTime, this.time);
    // If mouse outside, snake wanders / idles near edge
    let targetX = this.mouseX;
    let targetY = this.mouseY;
    if (!this.mouseInside) {
      // pause chasing: snake slows and hovers
      targetX = this.snake.head.x + Math.cos(this.time * 0.2) * 10;
      targetY = this.snake.head.y + Math.sin(this.time * 0.2) * 10;
    }
    const caught = this.snake.update(deltaTime, targetX, targetY, this.time);
    if (caught) {
      this.rat.triggerEscape();
      this.catchEffectTime = 0.6;
      // Make rat jump away from snake
      const head = this.snake.getHead();
      const dx = this.rat.x - head.x;
      const dy = this.rat.y - head.y;
      const len = Math.hypot(dx, dy) || 1;
      const escapeDist = 90;
      const nx = dx / len;
      const ny = dy / len;
      this.rat.setPosition(
        Math.max(10, Math.min(window.innerWidth - 10, this.rat.x + nx * escapeDist)),
        Math.max(10, Math.min(window.innerHeight - 30, this.rat.y + ny * escapeDist))
      );
      // Also offset mouse target to feel escape (visual only, next mousemove corrects)
      this.mouseX = this.rat.targetX;
      this.mouseY = this.rat.targetY;
    }
    if (this.catchEffectTime > 0) this.catchEffectTime -= deltaTime;
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    this.drawSnake(ctx);
    this.drawRat(ctx);

    // catch flash
    if (this.catchEffectTime > 0) {
      const alpha = this.catchEffectTime / 0.6 * 0.12;
      ctx.fillStyle = `rgba(255,230,100,${alpha})`;
      ctx.fillRect(0,0,w,h);
    }
  }

  drawSnake(ctx) {
    const segments = this.snake.getSegments();
    const head = this.snake.getHead();
    const snakeSize = this.settings.snakeSize || 1;
    const baseWidth = (this.settings.snakeWidth || 14) * snakeSize;

    // Draw body as thick path with gradient
    // Build points for outline? Use segment circles + lines
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Body segments - draw from tail to head
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const t = i / (segments.length - 1); // 0 head, 1 tail
      // Taper width: head thick, tail thin
      const widthFactor = 1 - t * 0.72; // head 1, tail 0.28
      const radius = (baseWidth * widthFactor) / 2;

      // Color gradient: head more vibrant, body darker green/brown
      // Interpolate between head and tail colors
      const r = Math.round(58 + (1 - t) * 12); // 58-70
      const g = Math.round(152 + (1 - t) * 28); // 152-180
      const b = Math.round(62 + (1 - t) * 18);
      const darkR = Math.round(r * 0.55);
      const darkG = Math.round(g * 0.55);
      const darkB = Math.round(b * 0.55);

      // Create gradient for 3D effect
      const grad = ctx.createRadialGradient(seg.x - radius * 0.25, seg.y - radius * 0.35, radius * 0.2, seg.x, seg.y, radius);
      grad.addColorStop(0, `rgb(${Math.min(255, r+35)},${Math.min(255,g+28)},${Math.min(255,b+22)})`);
      grad.addColorStop(0.55, `rgb(${r},${g},${b})`);
      grad.addColorStop(1, `rgb(${darkR},${darkG},${darkB})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Scale texture
      if (i % 2 === 0 && i !== 0 && i !== segments.length - 1) {
        ctx.fillStyle = `rgba(0,0,0,0.07)`;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, radius * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connect to next segment with line for continuity (avoid gaps when undulating strongly)
      if (i < segments.length - 1) {
        const next = segments[i + 1];
        const avgRadius = (radius + (baseWidth * (1 - (i+1)/(segments.length-1)*0.72)/2)) / 2;
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = avgRadius * 1.85;
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        // overlay gradient line? Already covered by circles; line gives continuity
      }
    }
    ctx.restore();

    // Belly highlight (subtle)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#fff8dc';
    ctx.lineWidth = 2.5 * snakeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
    ctx.restore();

    // Head
    const headSeg = segments[0];
    const headRadius = baseWidth / 2;
    const headAngle = head.angle;

    // Head shape slightly elongated
    ctx.save();
    ctx.translate(headSeg.x, headSeg.y);
    ctx.rotate(headAngle);

    // Shadow handled via gradient ellipse
    const headGrad = ctx.createRadialGradient(-headRadius * 0.2, -headRadius * 0.3, headRadius * 0.2, 0, 0, headRadius * 1.28);
    headGrad.addColorStop(0, 'rgb(84,194,86)');
    headGrad.addColorStop(0.6, 'rgb(58,152,62)');
    headGrad.addColorStop(1, 'rgb(34,92,38)');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    // Egg-shaped head
    const w = headRadius * 2.05;
    const h = headRadius * 1.55;
    ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI*2);
    ctx.fill();

    // Snout
    ctx.fillStyle = 'rgb(82,166,70)';
    ctx.beginPath();
    ctx.ellipse(headRadius * 0.55, 0, headRadius * 0.55, headRadius * 0.52, 0, 0, Math.PI*2);
    ctx.fill();

    // Nostrils
    ctx.fillStyle = 'rgba(20,40,20,0.9)';
    ctx.beginPath();
    ctx.arc(headRadius * 0.82, -headRadius * 0.2, 1.4 * snakeSize, 0, Math.PI*2);
    ctx.arc(headRadius * 0.82, headRadius * 0.2, 1.4 * snakeSize, 0, Math.PI*2);
    ctx.fill();

    // Eyes
    const eyeX = -headRadius * 0.05;
    const eyeY = headRadius * 0.58;
    // white sclera
    ctx.fillStyle = 'rgba(16,16,12,0.95)';
    ctx.beginPath();
    ctx.ellipse(eyeX, -eyeY, headRadius * 0.32, headRadius * 0.30, 0.35, 0, Math.PI*2);
    ctx.ellipse(eyeX, eyeY, headRadius * 0.32, headRadius * 0.30, -0.35, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#f5e6a3';
    ctx.beginPath();
    ctx.ellipse(eyeX + headRadius * 0.06, -eyeY, headRadius * 0.20, headRadius * 0.20, 0, 0, Math.PI*2);
    ctx.ellipse(eyeX + headRadius * 0.06, eyeY, headRadius * 0.20, headRadius * 0.20, 0, 0, Math.PI*2);
    ctx.fill();
    // vertical slit pupil
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(eyeX + headRadius * 0.10, -eyeY, 1.7 * snakeSize, headRadius * 0.16, 0, 0, Math.PI*2);
    ctx.ellipse(eyeX + headRadius * 0.10, eyeY, 1.7 * snakeSize, headRadius * 0.16, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(eyeX + headRadius * 0.14, -eyeY - headRadius*0.07, 1.6*snakeSize, 0, Math.PI*2);
    ctx.arc(eyeX + headRadius * 0.14, eyeY - headRadius*0.07, 1.6*snakeSize, 0, Math.PI*2);
    ctx.fill();

    // Tongue flick
    const flickInterval = 1.8 + Math.sin(this.time * 0.7) * 0.6;
    const flickPhase = (this.time % flickInterval) / flickInterval;
    let tongueOut = 0;
    if (flickPhase > 0.88) {
      tongueOut = Math.sin((flickPhase - 0.88) / 0.12 * Math.PI);
    }
    if (this.snake.isCatching > 0) tongueOut = 1 - this.snake.isCatching / 0.45;
    if (tongueOut > 0.01) {
      const tongueLen = headRadius * 1.15 * tongueOut;
      ctx.strokeStyle = '#c83a4a';
      ctx.lineWidth = 1.7 * snakeSize;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(headRadius * 0.92, 0);
      ctx.lineTo(headRadius * 0.92 + tongueLen * 0.72, 0);
      ctx.stroke();
      // fork
      ctx.strokeStyle = '#e04a5e';
      ctx.lineWidth = 1.2 * snakeSize;
      ctx.beginPath();
      const tipX = headRadius * 0.92 + tongueLen * 0.72;
      const fork = tongueLen * 0.22;
      ctx.moveTo(tipX, 0);
      ctx.lineTo(tipX + fork * 0.6, -fork * 0.5);
      ctx.moveTo(tipX, 0);
      ctx.lineTo(tipX + fork * 0.6, fork * 0.5);
      ctx.stroke();
    }

    ctx.restore();

    // Catch lunge emphasis
    if (this.snake.isCatching > 0) {
      const p = 1 - this.snake.isCatching / 0.45;
      ctx.save();
      ctx.globalAlpha = 0.18 * (1 - p);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(headSeg.x, headSeg.y, headRadius * (1 + p * 0.6), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawRat(ctx) {
    if (!this.rat) return;
    const pos = this.rat.getPosition();
    if (!this.mouseInside) {
      // fade out when outside viewport edge? Keep near edge but semi-transparent
      ctx.save();
      ctx.globalAlpha = 0.35;
    }

    const ratSize = this.settings.ratSize || 1;
    const base = 14 * ratSize; // base half size
    const angle = pos.angle;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    // Shadow under rat
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(-base * 0.15, base * 0.55, base * 0.95, base * 0.42, 0, 0, Math.PI*2);
    ctx.fill();

    // Tail
    const tailWag = Math.sin(pos.footPhase * 1.6) * 0.55 + Math.sin(this.time * 4.2) * 0.2;
    ctx.save();
    ctx.translate(-base * 0.78, 0);
    ctx.rotate(tailWag * 0.5);
    ctx.strokeStyle = '#c9a8a0';
    ctx.lineWidth = 2.2 * ratSize;
    ctx.lineCap = 'round';
    // inner tail darker
    ctx.beginPath();
    // S-curve tail
    const tailLen = base * 1.55;
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-tailLen * 0.35, -tailWag * 6, -tailLen * 0.65, tailWag * 7, -tailLen, tailWag * 3);
    ctx.stroke();
    ctx.strokeStyle = '#e8c4bc';
    ctx.lineWidth = 1.0 * ratSize;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-tailLen * 0.35, -tailWag * 6, -tailLen * 0.65, tailWag * 7, -tailLen, tailWag * 3);
    ctx.stroke();
    ctx.restore();

    // Body
    ctx.fillStyle = '#8b7a72'; // outline shadow
    ctx.beginPath();
    ctx.ellipse(0, 0, base * 0.95, base * 0.60, 0, 0, Math.PI*2);
    ctx.fill();
    // Main body fur
    const bodyGrad = ctx.createRadialGradient(-base*0.1, -base*0.2, base*0.2, 0, 0, base*0.95);
    bodyGrad.addColorStop(0, '#b8a9a1');
    bodyGrad.addColorStop(0.5, '#9e8e86');
    bodyGrad.addColorStop(1, '#6f605a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(-base*0.05, -base*0.05, base*0.86, base*0.54, 0, 0, Math.PI*2);
    ctx.fill();
    // belly lighter
    ctx.fillStyle = 'rgba(245,232,220,0.92)';
    ctx.beginPath();
    ctx.ellipse(-base*0.08, base*0.16, base*0.58, base*0.28, 0, 0, Math.PI*2);
    ctx.fill();

    // Head
    ctx.save();
    ctx.translate(base * 0.58, 0);
    // head shape
    ctx.fillStyle = '#a99a92';
    ctx.beginPath();
    // slightly pointed snout
    ctx.ellipse(0, 0, base*0.58, base*0.40, 0, 0, Math.PI*2);
    ctx.fill();
    const snoutGrad = ctx.createRadialGradient(base*0.15, -0.08*base, base*0.1, 0, 0, base*0.58);
    snoutGrad.addColorStop(0, '#c4b5ad');
    snoutGrad.addColorStop(1, '#8f837c');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(0.02*base, 0, base*0.54, base*0.36, 0, 0, Math.PI*2);
    ctx.fill();
    // snout tip
    ctx.fillStyle = '#d8c8be';
    ctx.beginPath();
    ctx.ellipse(base*0.42, 0, base*0.26, base*0.22, 0, 0, Math.PI*2);
    ctx.fill();
    // nose
    ctx.fillStyle = '#2d2220';
    ctx.beginPath();
    ctx.ellipse(base*0.62, 0, base*0.08, base*0.06, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(base*0.62, -base*0.02, 1.0*ratSize, 0, Math.PI*2);
    ctx.fill();
    // whiskers
    ctx.strokeStyle = 'rgba(60,50,48,0.45)';
    ctx.lineWidth = 0.9*ratSize;
    ctx.lineCap = 'round';
    for (let w of [-1,0,1]) {
      ctx.beginPath();
      ctx.moveTo(base*0.38, w*base*0.07);
      ctx.lineTo(base*0.72, w*base*0.12 + (w*0.04*base));
      ctx.stroke();
    }
    // eyes
    ctx.fillStyle = '#1a1412';
    ctx.beginPath();
    ctx.arc(-base*0.04, -base*0.16, base*0.11, 0, Math.PI*2);
    ctx.arc(-base*0.04, base*0.16, base*0.11, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-base*0.01, -base*0.18, base*0.04, 0, Math.PI*2);
    ctx.arc(-base*0.01, base*0.14, base*0.04, 0, Math.PI*2);
    ctx.fill();
    // ears
    const earWiggle = pos.isMoving ? Math.sin(pos.footPhase*0.7)*0.08 : Math.sin(this.time*1.4)*0.05;
    // top ear
    ctx.save();
    ctx.translate(-base*0.18, -base*0.33);
    ctx.rotate(-0.45 + earWiggle);
    ctx.fillStyle = '#7d6e66';
    ctx.beginPath();
    ctx.ellipse(0,0, base*0.24, base*0.26, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#e8a0a8';
    ctx.beginPath();
    ctx.ellipse(0,0, base*0.13, base*0.14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(-base*0.18, base*0.33);
    ctx.rotate(0.45 - earWiggle);
    ctx.fillStyle = '#7d6e66';
    ctx.beginPath();
    ctx.ellipse(0,0, base*0.24, base*0.26, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#e8a0a8';
    ctx.beginPath();
    ctx.ellipse(0,0, base*0.13, base*0.14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // head end

    // Feet - animate
    const footPhase = pos.footPhase;
    const isMoving = pos.isMoving;
    // 4 tiny feet
    ctx.fillStyle = '#6b5c55';
    const footOffsets = [
      { x: base*0.26, y: -base*0.34, phase: 0 },
      { x: base*0.26, y: base*0.34, phase: Math.PI },
      { x: -base*0.26, y: -base*0.34, phase: Math.PI },
      { x: -base*0.26, y: base*0.34, phase: 0 },
    ];
    for (const f of footOffsets) {
      let fy = f.y;
      let fx = f.x;
      if (isMoving) {
        fy += Math.sin(footPhase + f.phase) * base*0.08;
        fx += Math.cos(footPhase + f.phase) * base*0.05;
      } else {
        fy += Math.sin(this.time*1.8 + f.phase*0.5)* base*0.015;
      }
      ctx.beginPath();
      ctx.ellipse(fx, fy, base*0.14, base*0.09, 0, 0, Math.PI*2);
      ctx.fill();
      // toes
      ctx.fillStyle = '#4a3f3a';
      ctx.beginPath();
      ctx.ellipse(fx + base*0.04, fy, base*0.035, base*0.035, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#6b5c55';
    }

    // Jump indicator? already translated jumpOffset
    ctx.restore();
    if (!this.mouseInside) ctx.restore();
  }
}
