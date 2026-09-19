/**
 * Rat - cursor replacement
 */
var Rat = class Rat {
  constructor(settings) {
    this.settings = settings;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.prevX = this.x;
    this.prevY = this.y;
    this.angle = 0;
    this.targetAngle = 0;
    this.speed = 0;
    this.time = 0;
    this.isMoving = false;
    this.moveTime = 0;
    this.idlePhase = Math.random() * Math.PI * 2;
    this.footPhase = 0;
    this.jumpOffset = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.jumpTime = 0;
  }

  updateSettings(s) {
    this.settings = s;
  }

  setPosition(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  triggerEscape() {
    this.isJumping = true;
    this.jumpTime = 0.35;
    this.jumpVelocity = -220;
    this.jumpOffset = 0;
  }

  update(deltaTime, time) {
    const dt = Math.min(deltaTime, 0.05);
    this.time = time;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    // Velocity for angle determination
    const vx = this.targetX - this.prevX;
    const vy = this.targetY - this.prevY;
    const vel = Math.hypot(vx, vy);

    // Determine if moving (threshold)
    this.isMoving = vel > 0.5 || dist > 2;

    if (this.isMoving) {
      this.moveTime += dt;
      // Face direction of movement
      if (vel > 1) {
        this.targetAngle = Math.atan2(vy, vx);
      } else if (dist > 1) {
        this.targetAngle = Math.atan2(dy, dx);
      }
      // Turn speed for rat
      let diff = this.targetAngle - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angle += diff * Math.min(1, dt * 12);
    } else {
      this.moveTime = 0;
      // idle slight angle wobble
      this.angle += Math.sin(time * 0.8 + this.idlePhase) * 0.002;
    }

    // Position update: snap closely to cursor but with tiny interpolation for smoothness
    // Use immediate for precise cursor, but add slight momentum for running animation
    // For spec: remain centered around real cursor, so nearly instant
    const lerpFactor = this.isMoving ? 0.85 : 1;
    // Actually just set directly but keep prev for velocity
    // Add tiny smoothing to avoid jitter at high DPI? Use lerp with high factor
    this.x += (this.targetX - this.x) * Math.min(1, dt * 60 * lerpFactor);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 60 * lerpFactor);

    this.prevX = this.targetX;
    this.prevY = this.targetY;

    // Foot animation
    if (this.isMoving) {
      this.footPhase += dt * (14 + vel * 0.08);
    } else {
      this.footPhase += dt * 2;
    }

    // Idle bobbing
    this.idlePhase += dt * 1.2;

    // Jump physics
    if (this.isJumping) {
      this.jumpTime -= dt;
      this.jumpVelocity += 580 * dt; // gravity
      this.jumpOffset += this.jumpVelocity * dt;
      if (this.jumpOffset > 0) {
        this.jumpOffset = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
      if (this.jumpTime <= 0 && this.jumpOffset === 0) {
        this.isJumping = false;
      }
    } else {
      // small bob when idle/moving
      if (this.isMoving) {
        this.jumpOffset = Math.sin(this.footPhase * 1.2) * 1.5;
      } else {
        this.jumpOffset = Math.sin(time * 2.5) * 0.8;
      }
    }

    this.speed = vel;
  }

  getPosition() {
    return { x: this.x, y: this.y - this.jumpOffset, angle: this.angle, footPhase: this.footPhase, isMoving: this.isMoving, idlePhase: this.idlePhase, jumpOffset: this.jumpOffset, isJumping: this.isJumping };
  }
}
