import * as THREE from 'three';

interface TrailTextureOptions {
  width?: number;
  height?: number;
  maxAge?: number;
  radius?: number;
  intensity?: number;
  interpolate?: number;
  smoothing?: number;
  minForce?: number;
  blend?: string;
  ease?: (x: number) => number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  force: number;
}

export class TrailTexture {
  width: number;
  height: number;
  size: number;
  maxAge: number;
  radius: number;
  intensity: number;
  ease: (x: number) => number;
  interpolate: number;
  smoothing: number;
  minForce: number;
  blend: string;
  trail: TrailPoint[];
  force: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.Texture;

  constructor({
    width = 256,
    height = 256,
    maxAge = 2000,
    radius = 0.15,
    intensity = 0.5,
    interpolate = 0,
    smoothing = 0.5,
    minForce = 0.3,
    blend = 'screen',
    ease = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
  }: TrailTextureOptions = {}) {
    this.width = width;
    this.height = height;
    this.size = Math.min(this.width, this.height);
    this.maxAge = maxAge;
    this.radius = radius;
    this.intensity = intensity;
    this.ease = ease;
    this.interpolate = interpolate;
    this.smoothing = smoothing;
    this.minForce = minForce;
    this.blend = blend;
    this.trail = [];
    this.force = 0;
    this.initTexture();
  }

  initTexture() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.Texture(this.canvas);
    this.canvas.id = 'touchTexture';
    this.canvas.style.width = this.canvas.style.height = `${this.canvas.width}px`;
  }

  update(delta: number) {
    this.clear();
    this.trail = this.trail.filter((point) => {
      point.age += delta * 1000;
      return point.age <= this.maxAge;
    });
    if (!this.trail.length) this.force = 0;
    this.trail.forEach((point) => {
      this.drawTouch(point);
    });
    this.texture.needsUpdate = true;
  }

  clear() {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  addTouch(point: { x: number; y: number }) {
    let last = this.trail[this.trail.length - 1];
    if (last) {
      let dx = last.x - point.x;
      let dy = last.y - point.y;
      let dist = dx * dx + dy * dy;
      let force = Math.max(this.minForce, Math.min(dist * 10000, 1));
      this.force = this.lerp(force, this.force, this.smoothing);
      if (this.interpolate) {
        let steps = Math.ceil(dist / Math.pow((this.radius * 0.5) / this.interpolate, 2));
        if (steps > 1) {
          for (let i = 1; i < steps; i++) {
            this.trail.push({
              x: last.x - (dx / steps) * i,
              y: last.y - (dy / steps) * i,
              age: 0,
              force,
            });
          }
        }
      }
    }
    this.trail.push({ x: point.x, y: point.y, age: 0, force: this.force });
  }

  drawTouch(point: TrailPoint) {
    let pos = {
      x: point.x * this.width,
      y: (1 - point.y) * this.height,
    };
    
    // Adjust intensity based on age for a slower permeation effect
    let ageRatio = point.age / this.maxAge;
    let intensity = this.ease(1 - ageRatio) * this.intensity;
    
    // Increase radius over time for permeation effect
    let baseRadius = this.size * this.radius;
    let radius = baseRadius + (baseRadius * 2 * ageRatio);
    
    this.ctx.globalCompositeOperation = this.blend as GlobalCompositeOperation;
    let grd = this.ctx.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      radius
    );
    
    // Adjust color stops for a more natural permeation
    grd.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    grd.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
    grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    
    this.ctx.beginPath();
    this.ctx.fillStyle = grd;
    this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  lerp(a: number, b: number, n = 0.9) {
    return (1 - n) * a + n * b;
  }
}