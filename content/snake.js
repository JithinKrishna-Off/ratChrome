/**
 * Snake physics - segmented follow with historical path
 * Each segment follows the head's historical positions
 */
var Snake = class Snake {
  constructor(settings) {
    this.settings = settings;
    this.segments = [];
    this.history = []; // {x, y, angle}
    this.maxHistory = 800;

    this.head = { x: 200, y: 200, angle: 0 };
    this.speed = 0;
    this.targetAngle = 0;
    this.time = 0;

    this.catchCooldown = 0;
    this.isCatching = 0;
    this.coilPhase = 0;

    this.init();
  }

  init() {
    const count = this.settings.segmentCount || 16;
    const spacing = this.settings.segmentSpacing || 18;
    // Start snake off-screen left or random
    this.head.x = -100;
    this.head.y = window.innerHeight * 0.5;
    this.head.angle = 0;
    this.segments = [];
    for (let i = 0; i < count; i++) {
      this.segments.push({
        x: this.head.x - i * spacing,
        y: this.head.y,
        angle: 0,
        undulation: 0
      });
    }
    this.history = [];
    for (let i = 0; i < this.maxHistory; i++) {
      this.history.unshift({
        x: this.head.x - i * 2,
        y: this.head.y,
        angle: 0
      });
    }
  }

  updateSettings(newSettings) {
    const oldCount = this.settings.segmentCount;
    this.settings = newSettings;
    if (newSettings.segmentCount !== oldCount) {
      const diff = newSettings.segmentCount - this.segments.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          const last = this.segments[this.segments.length - 1];
          this.segments.push({ x: last.x, y: last.y, angle: last.angle, undulation: 0 });
        }
      } else if (diff < 0) {
        this.segments.splice(newSettings.segmentCount);
      }
    }
  }

  resetPosition() {
    this.head.x = Math.random() * window.innerWidth;
    this.head.y = Math.random() * window.innerHeight;
    this.head.angle = Math.random() * Math.PI * 2;
    this.history = [];
    const spacing = this.settings.segmentSpacing;
    for (let i = 0; i < this.maxHistory; i++) {
      this.history.push({
        x: this.head.x - Math.cos(this.head.angle) * i * 2,
        y: this.head.y - Math.sin(this.head.angle) * i * 2,
        angle: this.head.angle
      });
    }
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].x = this.head.x - Math.cos(this.head.angle) * i * spacing;
      this.segments[i].y = this.head.y - Math.sin(this.head.angle) * i * spacing;
      this.segments[i].angle = this.head.angle;
    }
  }

  update(deltaTime, targetX, targetY, time) {
    this.time = time;
    const dt = Math.min(deltaTime, 0.05); // clamp
    if (this.catchCooldown > 0) this.catchCooldown -= dt;
    if (this.isCatching > 0) this.isCatching -= dt;

    const head = this.head;
    const dx = targetX - head.x;
    const dy = targetY - head.y;
    const dist = Math.hypot(dx, dy);

    // If target is behind or invalid (mouse outside), idle wander
    let desiredAngle;
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      // wander slightly
      desiredAngle = head.angle + Math.sin(time * 0.3) * 0.02;
    } else {
      desiredAngle = Math.atan2(dy, dx);
    }

    // Add subtle random variation so not robotic (low amplitude)
    const wander = Math.sin(time * 0.7) * 0.08 + (Math.random() - 0.5) * 0.04;
    desiredAngle += wander * 0.15;

    // Smooth turn - turnSpeed in rad/s
    const turnSpeed = this.settings.turnSpeed || 2.2;
    let angleDiff = desiredAngle - head.angle;
    // normalize to [-PI, PI]
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    const maxTurn = turnSpeed * dt;
    // slight s-curve easing for natural turning
    const turnAmount = Math.max(-maxTurn, Math.min(maxTurn, angleDiff * 1.2));
    head.angle += turnAmount;

    // Speed logic: accelerate when far, slow when close
    const baseSpeed = this.settings.snakeSpeed || 280; // px/s
    let speedFactor;
    if (dist > 600) speedFactor = 1.4;
    else if (dist > 300) speedFactor = 1.15;
    else if (dist > 150) speedFactor = 1.0;
    else if (dist > 80) speedFactor = 0.65;
    else if (dist > this.settings.catchDistance + 10) speedFactor = 0.45;
    else speedFactor = 0.35;

    // During catch cooldown, slightly faster escape
    if (this.isCatching > 0) speedFactor *= 0.3;

    // Slight acceleration/deceleration smoothing
    const targetSpeed = baseSpeed * speedFactor * (this.settings.snakeSize || 1);
    // lerp speed
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 4);

    // Add slight slither speed modulation
    const slitherMod = 1 + Math.sin(time * 3.2) * 0.06;
    const moveDist = this.speed * slitherMod * dt;

    // Move head
    head.x += Math.cos(head.angle) * moveDist;
    head.y += Math.sin(head.angle) * moveDist;

    // Keep history
    this.history.unshift({ x: head.x, y: head.y, angle: head.angle });
    if (this.history.length > this.maxHistory) this.history.pop();

    // Update segments to follow history path
    const spacing = (this.settings.segmentSpacing || 18) * (this.settings.snakeSize || 1);
    // For each segment, find position at distance = segmentIndex * spacing along history
    let accumDist = 0;
    let historyIndex = 0;
    // Precompute positions for each segment
    for (let i = 0; i < this.segments.length; i++) {
      const targetDist = i * spacing;
      // Walk history until we reach targetDist
      accumDist = 0;
      historyIndex = 0;
      let segX = head.x;
      let segY = head.y;
      let segAngle = head.angle;

      for (let h = 1; h < this.history.length; h++) {
        const prev = this.history[h - 1];
        const curr = this.history[h];
        const d = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        if (accumDist + d >= targetDist) {
          // interpolate
          const t = (targetDist - accumDist) / (d || 1);
          segX = prev.x + (curr.x - prev.x) * t;
          segY = prev.y + (curr.y - prev.y) * t;
          segAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
          // handle angle continuity: blend with prev angle if needed
          if (!isFinite(segAngle)) segAngle = prev.angle;
          break;
        }
        accumDist += d;
        if (h === this.history.length - 1) {
          segX = curr.x;
          segY = curr.y;
          segAngle = curr.angle;
        }
      }

      // Add S-shaped undulation perpendicular to movement direction
      // Tapered amplitude: stronger in middle, weaker at head/tail
      const taper = Math.sin((i / (this.segments.length - 1)) * Math.PI); // 0 at ends, 1 middle
      // Alternative: reduce at head for natural look, but keep some
      const amplitude = 7 * (this.settings.snakeSize || 1) * (0.5 + taper * 0.5);
      const frequency = 2.2;
      const wave = Math.sin(time * 3.5 + i * 0.65) * amplitude;
      // also lateral body wave depending on speed
      // apply offset perpendicular to segment direction
      const perpAngle = segAngle + Math.PI / 2;
      // Only apply undulation if moving sufficiently
      const undScale = Math.min(1, this.speed / 80);
      segX += Math.cos(perpAngle) * wave * undScale;
      segY += Math.sin(perpAngle) * wave * undScale;

      this.segments[i].x = segX;
      this.segments[i].y = segY;
      // Smooth angle interpolation toward history angle
      let aDiff = segAngle - this.segments[i].angle;
      aDiff = Math.atan2(Math.sin(aDiff), Math.cos(aDiff));
      this.segments[i].angle += aDiff * 0.35;
      this.segments[i].undulation = wave;
    }

    // Catch detection
    const catchDist = (this.settings.catchDistance || 34) * (this.settings.snakeSize || 1);
    if (dist < catchDist && this.catchCooldown <= 0 && this.isCatching <= 0) {
      this.triggerCatch();
      return true; // signal catch
    }
    return false;
  }

  triggerCatch() {
    this.isCatching = 0.45; // seconds of catch animation
    this.catchCooldown = 2.0 + Math.random() * 1.0;
  }

  getHead() {
    return this.head;
  }

  getSegments() {
    return this.segments;
  }
}
