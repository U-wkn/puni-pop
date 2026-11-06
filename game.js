/**
 * PUNI POP! - Main Game Engine
 * Soft-body Jelly Physics, Particle Effects, Chain Burst & Interaction Logic
 */

(function () {
  'use strict';

  // ==========================================================================
  // 定数 & カラーパレット
  // ==========================================================================
  const PUNI_COLORS = [
    { name: 'cyan', main: '#4FC3F7', light: '#E1F5FE', shadow: '#0288D1', dark: '#01579B' },
    { name: 'pink', main: '#FF80AB', light: '#FCE4EC', shadow: '#F50057', dark: '#C51162' },
    { name: 'purple', main: '#B388FF', light: '#EDE7F6', shadow: '#7C4DFF', dark: '#651FFF' },
    { name: 'yellow', main: '#FFE082', light: '#FFFDE7', shadow: '#FFB300', dark: '#FF8F00' },
    { name: 'mint', main: '#69F0AE', light: '#E8F5E9', shadow: '#00E676', dark: '#00C853' },
    { name: 'orange', main: '#FFAB91', light: '#FBE9E7', shadow: '#FF7043', dark: '#E64A19' },
    { name: 'rainbow', main: '#FF69B4', light: '#FFFFFF', shadow: '#BA68C8', dark: '#4FC3F7', isSpecial: true }
  ];

  const COMBO_TITLES = [
    { count: 1, text: 'POP!' },
    { count: 2, text: 'DOUBLE!' },
    { count: 3, text: 'GREAT! 🌟' },
    { count: 4, text: 'SUPER! ✨' },
    { count: 5, text: 'AMAZING! 💖' },
    { count: 7, text: 'EXCELLENT! 🌈' },
    { count: 10, text: 'FEVER! PERFECT! 👑' }
  ];

  // ==========================================================================
  // ユーティリティ
  // ==========================================================================
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ==========================================================================
  // 背景バブル（癒やし浮遊泡）
  // ==========================================================================
  class AmbientBubble {
    constructor(canvasWidth, canvasHeight) {
      this.reset(canvasWidth, canvasHeight, true);
    }

    reset(canvasWidth, canvasHeight, initial = false) {
      this.x = Math.random() * canvasWidth;
      this.y = initial ? Math.random() * canvasHeight : canvasHeight + randomRange(20, 60);
      this.radius = randomRange(12, 45);
      this.speedY = randomRange(0.4, 1.2);
      this.speedX = randomRange(-0.3, 0.3);
      this.wobbleSpeed = randomRange(0.015, 0.035);
      this.wobbleAmp = randomRange(10, 25);
      this.baseX = this.x;
      this.time = Math.random() * 100;
      this.alpha = randomRange(0.2, 0.5);
    }

    update(canvasWidth, canvasHeight) {
      this.time += this.wobbleSpeed;
      this.y -= this.speedY;
      this.x = this.baseX + Math.sin(this.time) * this.wobbleAmp;

      if (this.y + this.radius < -10) {
        this.reset(canvasWidth, canvasHeight, false);
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

      // 透明感あるシャボン玉のグラデーション
      const grad = ctx.createRadialGradient(
        this.x - this.radius * 0.3,
        this.y - this.radius * 0.3,
        this.radius * 0.1,
        this.x,
        this.y,
        this.radius
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha * 0.9})`);
      grad.addColorStop(0.6, `rgba(224, 247, 250, ${this.alpha * 0.4})`);
      grad.addColorStop(0.9, `rgba(238, 238, 255, ${this.alpha * 0.3})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${this.alpha * 0.7})`);

      ctx.fillStyle = grad;
      ctx.fill();

      // つやつやハイライト
      ctx.beginPath();
      ctx.arc(
        this.x - this.radius * 0.35,
        this.y - this.radius * 0.35,
        this.radius * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.95})`;
      ctx.fill();

      ctx.restore();
    }
  }

  // ==========================================================================
  // パーティクル（破裂時のゼリービーズ・キラキラ星）
  // ==========================================================================
  class Particle {
    constructor(x, y, color, isStar = false) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.isStar = isStar;

      const angle = Math.random() * Math.PI * 2;
      const speed = isStar ? randomRange(2, 7) : randomRange(3, 9);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - (isStar ? 1.5 : 0.5);

      this.radius = isStar ? randomRange(4, 8) : randomRange(3, 7);
      this.alpha = 1.0;
      this.decay = randomRange(0.015, 0.03);
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = randomRange(-0.15, 0.15);
      this.gravity = isStar ? 0.08 : 0.22;
      this.bounce = 0.55;
    }

    update(canvasHeight) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.rotation += this.rotSpeed;
      this.alpha -= this.decay;

      // 画面下で跳ねる
      if (this.y + this.radius > canvasHeight) {
        this.y = canvasHeight - this.radius;
        this.vy = -this.vy * this.bounce;
        this.vx *= 0.8;
      }

      return this.alpha > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      if (this.isStar) {
        // キラキラ星を描画
        ctx.fillStyle = '#FFF9C4';
        ctx.shadowColor = '#FFD54F';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(Math.cos((i * Math.PI) / 2) * this.radius, Math.sin((i * Math.PI) / 2) * this.radius);
          ctx.lineTo(
            Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (this.radius * 0.35),
            Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (this.radius * 0.35)
          );
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // つやつやゼリービーズ
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color.main;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // 衝撃波（連鎖波紋）
  // ==========================================================================
  class Shockwave {
    constructor(x, y, maxRadius, color) {
      this.x = x;
      this.y = y;
      this.radius = 10;
      this.maxRadius = maxRadius;
      this.color = color;
      this.alpha = 0.8;
      this.speed = (maxRadius - 10) / 18;
    }

    update() {
      this.radius += this.speed;
      this.alpha = Math.max(0, 1 - this.radius / this.maxRadius);
      return this.radius < this.maxRadius;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color.main;
      ctx.lineWidth = 4 * this.alpha;
      ctx.shadowColor = this.color.light;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ==========================================================================
  // フローティングテキスト（スコア＆コンボ演出）
  // ==========================================================================
  class FloatingText {
    constructor(x, y, text, color = '#FF4081', size = 24) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.size = size;
      this.alpha = 1.0;
      this.vy = -2.2;
      this.scale = 0.5;
    }

    update() {
      this.y += this.vy;
      this.vy *= 0.95;
      this.alpha -= 0.02;
      if (this.scale < 1.15) {
        this.scale += 0.08;
      } else if (this.scale > 1.0) {
        this.scale -= 0.03;
      }
      return this.alpha > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.scale(this.scale, this.scale);

      ctx.font = `800 ${this.size}px 'Fredoka', 'M PLUS Rounded 1c', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 白フチ
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.strokeText(this.text, 0, 0);

      // メイン文字
      ctx.fillStyle = this.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 6;
      ctx.fillText(this.text, 0, 0);

      ctx.restore();
    }
  }

  // ==========================================================================
  // ぷに（ソフトボディ・ゼリーオブジェクト）
  // ==========================================================================
  class Puni {
    constructor(x, y, radius, color) {
      this.x = x;
      this.y = y;
      this.baseRadius = radius;
      this.radius = radius;
      this.color = color;

      // 物理プロパティ
      this.vx = randomRange(-0.3, 0.3);
      this.vy = randomRange(-0.3, 0.3);
      this.scaleX = 1.0;
      this.scaleY = 1.0;
      this.stretchTargetX = 0;
      this.stretchTargetY = 0;
      this.isGrabbed = false;
      this.grabPointerId = null;

      // ソフトボディ頂点群（16頂点）
      this.numPoints = 16;
      this.points = [];
      for (let i = 0; i < this.numPoints; i++) {
        const angle = (i / this.numPoints) * Math.PI * 2;
        this.points.push({
          angle: angle,
          dist: this.radius,
          vel: 0,
          targetDist: this.radius
        });
      }

      // 表情・アニメーション
      this.blinkTimer = Math.random() * 200 + 100;
      this.isBlinking = false;
      this.squishFactor = 0; // 0 = 通常, 1 = ぎゅっと潰れた表情
      this.breathePhase = Math.random() * Math.PI * 2;

      // 連鎖マーク
      this.isBursting = false;
      this.burstScale = 1.0;
      this.chainDelay = 0;
    }

    // 押された・触られたときの凹み処理
    touch(px, py, force = 0.5) {
      const angle = Math.atan2(py - this.y, px - this.x);
      
      for (let i = 0; i < this.numPoints; i++) {
        const pt = this.points[i];
        let diff = Math.abs(pt.angle - angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < Math.PI * 0.45) {
          const impact = Math.cos((diff / (Math.PI * 0.45)) * (Math.PI / 2));
          pt.vel -= force * 35 * impact;
        } else {
          // 体積保存：反対側や横が少し膨らむ
          const expand = Math.sin(diff);
          pt.vel += force * 12 * expand;
        }
      }

      this.squishFactor = Math.min(1.0, this.squishFactor + force);
    }

    update(canvasWidth, canvasHeight) {
      if (this.isBursting) {
        this.burstScale *= 0.88;
        return;
      }

      // 呼吸とゆらめき
      this.breathePhase += 0.035;
      const breatheOffset = Math.sin(this.breathePhase) * 2.5;

      // まばたき制御
      this.blinkTimer--;
      if (this.blinkTimer <= 0) {
        this.isBlinking = !this.isBlinking;
        this.blinkTimer = this.isBlinking ? 12 : Math.random() * 220 + 120;
      }

      // 表情の復元
      this.squishFactor *= 0.92;

      // ソフトボディ頂点の物理シミュレーション（スプリング＆ダンパー）
      const k = 0.07; // バネ定数
      const damping = 0.86; // 減衰

      for (let i = 0; i < this.numPoints; i++) {
        const pt = this.points[i];
        const target = this.radius + breatheOffset;
        
        // 中心からの復元力
        const force = (target - pt.dist) * k;
        pt.vel = (pt.vel + force) * damping;
        pt.dist += pt.vel;
      }

      // 隣接頂点間の表面張力スムージング
      for (let i = 0; i < this.numPoints; i++) {
        const prev = this.points[(i - 1 + this.numPoints) % this.numPoints];
        const next = this.points[(i + 1) % this.numPoints];
        const pt = this.points[i];
        const avg = (prev.dist + next.dist) / 2;
        pt.dist += (avg - pt.dist) * 0.12;
      }

      // 移動＆壁バウンド
      if (!this.isGrabbed) {
        this.x += this.vx;
        this.y += this.vy;

        // ゆっくり画面内を漂う
        this.vx += (Math.random() - 0.5) * 0.04;
        this.vy += (Math.random() - 0.5) * 0.04;
        this.vx *= 0.99;
        this.vy *= 0.99;

        // 画面端の柔らかい反発
        const pad = this.radius + 10;
        if (this.x < pad) {
          this.x = pad;
          this.vx = Math.abs(this.vx) * 0.8 + 0.2;
          this.touch(this.x - 20, this.y, 0.4);
        } else if (this.x > canvasWidth - pad) {
          this.x = canvasWidth - pad;
          this.vx = -Math.abs(this.vx) * 0.8 - 0.2;
          this.touch(this.x + 20, this.y, 0.4);
        }

        if (this.y < pad + 60) {
          this.y = pad + 60;
          this.vy = Math.abs(this.vy) * 0.8 + 0.2;
          this.touch(this.x, this.y - 20, 0.4);
        } else if (this.y > canvasHeight - pad - 60) {
          this.y = canvasHeight - pad - 60;
          this.vy = -Math.abs(this.vy) * 0.8 - 0.2;
          this.touch(this.x, this.y + 20, 0.4);
        }
      } else {
        // ドラッグされているときの引っ張り物理（伸びと追従）
        const dx = this.stretchTargetX - this.x;
        const dy = this.stretchTargetY - this.y;
        this.x += dx * 0.32;
        this.y += dy * 0.32;

        // 引っ張られている方向に頂点がびよ〜んと伸びる
        const stretchDist = Math.sqrt(dx * dx + dy * dy);
        if (stretchDist > 10) {
          const stretchAngle = Math.atan2(dy, dx);
          for (let i = 0; i < this.numPoints; i++) {
            const pt = this.points[i];
            let diff = Math.abs(pt.angle - stretchAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff < Math.PI * 0.5) {
              const pull = Math.cos(diff) * Math.min(30, stretchDist * 0.4);
              pt.vel += pull * 0.15;
            }
          }
        }

        this.touch(this.stretchTargetX, this.stretchTargetY, 0.2);
      }
    }

    draw(ctx) {
      if (this.isBursting && this.burstScale < 0.05) return;

      ctx.save();
      ctx.translate(this.x, this.y);

      if (this.isBursting) {
        ctx.scale(this.burstScale, this.burstScale);
      }

      // 1. ゼリーのぷるぷるソフトボディ輪郭パスの作成
      ctx.beginPath();
      const p0 = this.points[0];
      const startX = Math.cos(p0.angle) * p0.dist;
      const startY = Math.sin(p0.angle) * p0.dist;
      ctx.moveTo(startX, startY);

      for (let i = 0; i < this.numPoints; i++) {
        const next = this.points[(i + 1) % this.numPoints];
        const midAngle = (this.points[i].angle + next.angle) / 2 + (next.angle < this.points[i].angle ? Math.PI : 0);
        const midDist = (this.points[i].dist + next.dist) / 2;
        const cx = Math.cos(this.points[i].angle) * this.points[i].dist;
        const cy = Math.sin(this.points[i].angle) * this.points[i].dist;
        const nx = Math.cos(midAngle) * midDist;
        const ny = Math.sin(midAngle) * midDist;

        ctx.quadraticCurveTo(cx, cy, nx, ny);
      }
      ctx.closePath();

      // 2. ぷるぷるゼリーの透明感グラデーション塗り
      let grad;
      if (this.color.isSpecial) {
        // レインボーぷに（虹色に輝く）
        grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
        grad.addColorStop(0, '#FF80AB');
        grad.addColorStop(0.25, '#FFD54F');
        grad.addColorStop(0.5, '#69F0AE');
        grad.addColorStop(0.75, '#4FC3F7');
        grad.addColorStop(1, '#B388FF');
      } else {
        grad = ctx.createRadialGradient(
          -this.radius * 0.3,
          -this.radius * 0.35,
          this.radius * 0.1,
          0,
          0,
          this.radius * 1.15
        );
        grad.addColorStop(0, this.color.light);
        grad.addColorStop(0.5, this.color.main);
        grad.addColorStop(0.9, this.color.shadow);
        grad.addColorStop(1, this.color.dark);
      }

      ctx.fillStyle = grad;
      ctx.shadowColor = this.color.shadow;
      ctx.shadowBlur = this.color.isSpecial ? 24 : 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. インナーグロー＆透明リムライト
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();

      // 4. つやつやゼリーのハイライト（上部三日月）
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        -this.radius * 0.28,
        -this.radius * 0.38,
        this.radius * 0.42,
        this.radius * 0.2,
        -Math.PI / 6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // サブハイライト（右下の反射光）
      ctx.beginPath();
      ctx.ellipse(
        this.radius * 0.35,
        this.radius * 0.35,
        this.radius * 0.22,
        this.radius * 0.1,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();
      ctx.restore();

      // 5. かわいい表情（目・口・チーク）
      this.drawFace(ctx);

      ctx.restore();
    }

    drawFace(ctx) {
      const eyeOffsetX = this.radius * 0.28;
      const eyeOffsetY = -this.radius * 0.05;
      const isSquished = this.squishFactor > 0.35;

      // チーク（ほっぺの赤らみ）
      ctx.save();
      ctx.fillStyle = 'rgba(255, 105, 180, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX - 6, eyeOffsetY + 12, 7, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(eyeOffsetX + 6, eyeOffsetY + 12, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 目
      ctx.save();
      ctx.fillStyle = '#263238';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      if (isSquished) {
        // ぎゅっとつぶれた表情 `> <`
        const size = 6;
        // 左目 `>`
        ctx.beginPath();
        ctx.moveTo(-eyeOffsetX - size, eyeOffsetY - size);
        ctx.lineTo(-eyeOffsetX + 2, eyeOffsetY);
        ctx.lineTo(-eyeOffsetX - size, eyeOffsetY + size);
        ctx.stroke();

        // 右目 `<`
        ctx.beginPath();
        ctx.moveTo(eyeOffsetX + size, eyeOffsetY - size);
        ctx.lineTo(eyeOffsetX - 2, eyeOffsetY);
        ctx.lineTo(eyeOffsetX + size, eyeOffsetY + size);
        ctx.stroke();
      } else if (this.isBlinking) {
        // まばたき（横線）
        ctx.beginPath();
        ctx.moveTo(-eyeOffsetX - 6, eyeOffsetY);
        ctx.lineTo(-eyeOffsetX + 6, eyeOffsetY);
        ctx.moveTo(eyeOffsetX - 6, eyeOffsetY);
        ctx.lineTo(eyeOffsetX + 6, eyeOffsetY);
        ctx.stroke();
      } else {
        // 通常のつぶらな瞳
        const eyeRadius = this.isGrabbed ? 6.5 : 5.5;
        
        // 左目
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // 右目
        ctx.beginPath();
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // 瞳のハイライト
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-eyeOffsetX - 1.8, eyeOffsetY - 1.8, eyeRadius * 0.42, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX - 1.8, eyeOffsetY - 1.8, eyeRadius * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }

      // 口
      ctx.beginPath();
      if (isSquished || this.isGrabbed) {
        // おちょぼ口 `w` または `o`
        ctx.arc(0, eyeOffsetY + 10, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF7043';
        ctx.fill();
      } else {
        // にっこり口
        ctx.arc(0, eyeOffsetY + 7, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    }

    containsPoint(px, py) {
      return distance(this.x, this.y, px, py) <= this.radius * 1.15;
    }
  }

  // ==========================================================================
  // ゲームマスタークラス（全体管理・入力・レンダリング）
  // ==========================================================================
  class Game {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      // 状態管理
      this.punis = [];
      this.particles = [];
      this.shockwaves = [];
      this.floatingTexts = [];
      this.ambientBubbles = [];
      this.score = 0;
      this.combo = 0;
      this.comboTimer = null;
      this.currentMode = 'squish'; // 'squish' | 'pop' | 'free'
      this.autoSpawn = true;
      this.maxPuniCount = 14;

      // タッチ＆ポインタ管理
      this.activePointers = new Map(); // pointerId -> { x, y, puni, isDragging, startX, startY, startTime }

      // UIエレメント
      this.scoreEl = document.getElementById('score-val');
      this.comboEl = document.getElementById('combo-val');
      this.comboBadge = document.getElementById('combo-badge');
      this.hintTextEl = document.getElementById('hint-text');

      // 初期化
      this.initCanvasSize();
      this.initEventListeners();
      this.initAmbientBubbles();
      this.resetPunis();

      // アニメーションループ開始
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    initCanvasSize() {
      const dpr = window.devicePixelRatio || 1;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    initAmbientBubbles() {
      this.ambientBubbles = [];
      const count = Math.floor(Math.min(24, (this.width * this.height) / 35000));
      for (let i = 0; i < count; i++) {
        this.ambientBubbles.push(new AmbientBubble(this.width, this.height));
      }
    }

    resetPunis() {
      this.punis = [];
      const baseCount = this.width < 600 ? 6 : 9;
      for (let i = 0; i < baseCount; i++) {
        this.spawnPuni(false);
      }
    }

    spawnPuni(dropAnimation = true) {
      if (this.punis.length >= this.maxPuniCount) return;

      const radius = randomRange(36, 56);
      const color = PUNI_COLORS[Math.floor(Math.random() * PUNI_COLORS.length)];
      
      let x = randomRange(radius + 40, this.width - radius - 40);
      let y = dropAnimation 
        ? -radius - randomRange(10, 50) 
        : randomRange(radius + 100, this.height - radius - 120);

      const puni = new Puni(x, y, radius, color);
      if (dropAnimation) {
        puni.vy = randomRange(4, 8);
        puni.vx = randomRange(-1.5, 1.5);
      }
      this.punis.push(puni);
    }

    // ========================================================================
    // インタラクション & 入力ハンドリング
    // ========================================================================
    initEventListeners() {
      window.addEventListener('resize', () => {
        this.initCanvasSize();
        this.initAmbientBubbles();
      });

      // Canvasポインタイベント
      this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
      this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
      this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
      this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));

      // モード切替タブ
      const tabs = document.querySelectorAll('.mode-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.setMode(tab.dataset.mode);
        });
      });

      // 下部クイックボタン
      document.getElementById('btn-add-puni').addEventListener('click', () => {
        window.soundEngine.init();
        window.soundEngine.playBounce(1.2);
        this.spawnPuni(true);
      });

      document.getElementById('btn-chain-burst').addEventListener('click', () => {
        window.soundEngine.init();
        this.triggerSuperBurst();
      });

      document.getElementById('btn-reset').addEventListener('click', () => {
        window.soundEngine.init();
        window.soundEngine.playSquish(0.9);
        this.resetPunis();
        this.resetCombo();
      });

      // ヘッダーボタン
      const btnSound = document.getElementById('btn-sound');
      btnSound.addEventListener('click', () => {
        window.soundEngine.init();
        const isMuted = window.soundEngine.toggleMute();
        btnSound.textContent = isMuted ? '🔇' : '🔊';
        btnSound.classList.toggle('muted', isMuted);
      });

      const btnBgm = document.getElementById('btn-bgm');
      btnBgm.addEventListener('click', () => {
        window.soundEngine.init();
        const isActive = window.soundEngine.toggleBgm();
        btnBgm.textContent = isActive ? '🎵' : '💤';
        btnBgm.classList.toggle('muted', !isActive);
      });

      // 設定モーダル
      const modal = document.getElementById('settings-modal');
      document.getElementById('btn-settings').addEventListener('click', () => {
        modal.classList.add('open');
      });

      document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.classList.remove('open');
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });

      // スライダー
      const sliderMaster = document.getElementById('slider-master-vol');
      const labelMaster = document.getElementById('label-master-vol');
      sliderMaster.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        window.soundEngine.setMasterVolume(val);
        labelMaster.textContent = `${e.target.value}%`;
      });

      const sliderSe = document.getElementById('slider-se-vol');
      const labelSe = document.getElementById('label-se-vol');
      sliderSe.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        window.soundEngine.setSeVolume(val);
        labelSe.textContent = `${e.target.value}%`;
      });

      const sliderBgm = document.getElementById('slider-bgm-vol');
      const labelBgm = document.getElementById('label-bgm-vol');
      sliderBgm.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        window.soundEngine.setBgmVolume(val);
        labelBgm.textContent = `${e.target.value}%`;
      });

      // 自動補充チェックボックス
      const checkAuto = document.getElementById('check-auto-spawn');
      checkAuto.addEventListener('change', (e) => {
        this.autoSpawn = e.target.checked;
      });
    }

    setMode(mode) {
      this.currentMode = mode;
      if (mode === 'squish') {
        this.hintTextEl.textContent = '🔮 ぷにぷにモード: 触ると「ぷにっ」、離すと「ぽよん」。伸ばしてこねてね！';
      } else if (mode === 'pop') {
        this.hintTextEl.textContent = '💥 ポップモード: タップで「パチッ！」と弾ける！連鎖を狙おう！';
      } else {
        this.hintTextEl.textContent = '✨ フリーモード: ドラッグでぷにぷに、タップや連鎖で気持ちよくPOP！';
      }
    }

    onPointerDown(e) {
      window.soundEngine.init();

      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // 触れたぷにを探す（手前のもの優先＝逆順走査）
      let targetPuni = null;
      for (let i = this.punis.length - 1; i >= 0; i--) {
        const puni = this.punis[i];
        if (!puni.isBursting && puni.containsPoint(px, py)) {
          targetPuni = puni;
          break;
        }
      }

      this.activePointers.set(e.pointerId, {
        x: px,
        y: py,
        startX: px,
        startY: py,
        startTime: performance.now(),
        puni: targetPuni,
        isDragging: false
      });

      if (targetPuni) {
        if (this.currentMode === 'pop') {
          // 即座にPOP!
          this.popPuni(targetPuni, true);
        } else {
          // ぷにぷに凹ます
          targetPuni.touch(px, py, 0.8);
          targetPuni.isGrabbed = true;
          targetPuni.grabPointerId = e.pointerId;
          targetPuni.stretchTargetX = px;
          targetPuni.stretchTargetY = py;

          window.soundEngine.playSquish(randomRange(0.9, 1.15));
        }
      } else {
        // 背景タッチ時の小さな水滴紋様
        this.shockwaves.push(new Shockwave(px, py, 35, { main: '#80DEEA', light: '#E0F7FA' }));
        window.soundEngine.playSquish(1.4);
      }
    }

    onPointerMove(e) {
      const ptr = this.activePointers.get(e.pointerId);
      if (!ptr) return;

      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      ptr.x = px;
      ptr.y = py;

      const dist = distance(ptr.startX, ptr.startY, px, py);
      if (dist > 8) {
        ptr.isDragging = true;
      }

      if (ptr.puni && !ptr.puni.isBursting) {
        if (this.currentMode === 'pop') {
          // ポップモードでなぞったぷにも次々破裂（スワイプPOP!）
          this.popPuni(ptr.puni, true);
        } else {
          ptr.puni.stretchTargetX = px;
          ptr.puni.stretchTargetY = py;

          // 引っ張りASMR音
          if (dist > 25 && Math.random() > 0.75) {
            window.soundEngine.playStretch(Math.min(1.0, dist / 120));
          }
        }
      } else if (this.currentMode === 'pop') {
        // スワイプで他のぷにに触れたらPOP!
        for (let i = this.punis.length - 1; i >= 0; i--) {
          const p = this.punis[i];
          if (!p.isBursting && p.containsPoint(px, py)) {
            this.popPuni(p, true);
            break;
          }
        }
      }
    }

    onPointerUp(e) {
      const ptr = this.activePointers.get(e.pointerId);
      if (!ptr) return;

      const elapsed = performance.now() - ptr.startTime;

      if (ptr.puni && !ptr.puni.isBursting) {
        ptr.puni.isGrabbed = false;
        ptr.puni.grabPointerId = null;

        if (this.currentMode === 'free') {
          // フリーモード: 短いタップならPOP、長押し・ドラッグならぽよんと跳ねる
          if (!ptr.isDragging && elapsed < 320) {
            this.popPuni(ptr.puni, true);
          } else {
            // スリングショットのように指を離すとぽよんと弾む
            const dx = ptr.x - ptr.puni.x;
            const dy = ptr.y - ptr.puni.y;
            ptr.puni.vx = -dx * 0.15;
            ptr.puni.vy = -dy * 0.15;
            ptr.puni.touch(ptr.x, ptr.y, 0.9);
            window.soundEngine.playBounce(randomRange(0.9, 1.2));
          }
        } else if (this.currentMode === 'squish') {
          // ぷにぷにモード: 離すと心地いいぽよん音
          const dx = ptr.x - ptr.puni.x;
          const dy = ptr.y - ptr.puni.y;
          ptr.puni.vx = -dx * 0.12;
          ptr.puni.vy = -dy * 0.12;
          ptr.puni.touch(ptr.x, ptr.y, 0.9);
          window.soundEngine.playBounce(randomRange(0.9, 1.2));
        }
      }

      this.activePointers.delete(e.pointerId);
    }

    // ========================================================================
    // 破裂（POP!）＆コンボ・連鎖ロジック
    // ========================================================================
    popPuni(puni, isDirect = false) {
      if (puni.isBursting) return;
      puni.isBursting = true;

      // コンボカウント
      this.incrementCombo();

      // 音響：コンボ数に応じたペンタトニック連鎖音
      window.soundEngine.playChain(this.combo);

      // スコア計算
      const basePoints = 100;
      const points = basePoints * this.combo;
      this.score += points;
      this.scoreEl.textContent = this.score.toLocaleString();

      // 衝撃波（連鎖波紋）
      const shockRadius = puni.radius * 2.8;
      this.shockwaves.push(new Shockwave(puni.x, puni.y, shockRadius, puni.color));

      // パーティクル発生（ゼリービーズ＋星）
      const pCount = Math.floor(randomRange(16, 26));
      for (let i = 0; i < pCount; i++) {
        this.particles.push(new Particle(puni.x, puni.y, puni.color, false));
      }
      for (let i = 0; i < 6; i++) {
        this.particles.push(new Particle(puni.x, puni.y, puni.color, true));
      }

      // フローティングテキスト表示
      let label = `+${points}`;
      let textColor = puni.color.shadow;
      let fontSize = 22;

      // 連鎖タイトル演出
      const comboTitle = COMBO_TITLES.slice().reverse().find(ct => this.combo >= ct.count);
      if (comboTitle && this.combo > 1) {
        label = `${comboTitle.text} +${points}`;
        textColor = '#FF4081';
        fontSize = 26;
      }
      this.floatingTexts.push(new FloatingText(puni.x, puni.y - 15, label, textColor, fontSize));

      // 周囲のぷにへの誘爆・連鎖チェック
      this.punis.forEach(other => {
        if (other !== puni && !other.isBursting) {
          const d = distance(puni.x, puni.y, other.x, other.y);
          if (d < shockRadius) {
            // 物理的な揺れを与える
            other.touch(puni.x, puni.y, 0.7);

            // ポップモード、または連鎖バースト中は誘爆！
            if (this.currentMode === 'pop' || other.chainMarked) {
              const delay = Math.floor(d * 0.7 + randomRange(40, 90));
              setTimeout(() => {
                this.popPuni(other, false);
              }, delay);
            }
          }
        }
      });
    }

    // 連鎖バースト（大連鎖ボタン）
    triggerSuperBurst() {
      if (this.punis.length === 0) return;

      // 画面中央に最も近いぷにを起点に連鎖
      const cx = this.width / 2;
      const cy = this.height / 2;
      let centerPuni = this.punis[0];
      let minDist = Infinity;

      this.punis.forEach(p => {
        const d = distance(cx, cy, p.x, p.y);
        if (d < minDist) {
          minDist = d;
          centerPuni = p;
        }
      });

      // 全ぷにを連鎖マークして波及させる
      this.punis.forEach((p, index) => {
        p.chainMarked = true;
      });

      this.popPuni(centerPuni, true);
    }

    incrementCombo() {
      this.combo++;
      this.comboEl.textContent = this.combo;
      this.comboBadge.classList.add('active');

      if (this.comboTimer) clearTimeout(this.comboTimer);
      this.comboTimer = setTimeout(() => {
        this.resetCombo();
      }, 1800);
    }

    resetCombo() {
      this.combo = 0;
      this.comboEl.textContent = '0';
      this.comboBadge.classList.remove('active');
      if (this.comboTimer) {
        clearTimeout(this.comboTimer);
        this.comboTimer = null;
      }
    }

    // ぷに同士の柔らかい接触＆反発（ゼリー物理）
    resolveCollisions() {
      const len = this.punis.length;
      for (let i = 0; i < len; i++) {
        const p1 = this.punis[i];
        if (p1.isBursting) continue;

        for (let j = i + 1; j < len; j++) {
          const p2 = this.punis[j];
          if (p2.isBursting) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = (p1.radius + p2.radius) * 0.94;

          if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // 位置補正（重なり解消）
            const moveRatio1 = p1.isGrabbed ? 0 : (p2.isGrabbed ? 1 : 0.5);
            const moveRatio2 = p2.isGrabbed ? 0 : (p1.isGrabbed ? 1 : 0.5);

            p1.x -= nx * overlap * moveRatio1;
            p1.y -= ny * overlap * moveRatio1;
            p2.x += nx * overlap * moveRatio2;
            p2.y += ny * overlap * moveRatio2;

            // 速度の跳ね返り
            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            if (!p1.isGrabbed) {
              p1.vx -= p * nx * 0.45;
              p1.vy -= p * ny * 0.45;
            }
            if (!p2.isGrabbed) {
              p2.vx += p * nx * 0.45;
              p2.vy += p * ny * 0.45;
            }

            // 接触面をぷるんと凹ます
            const contactX = p1.x + nx * p1.radius;
            const contactY = p1.y + ny * p1.radius;
            p1.touch(contactX, contactY, Math.min(0.35, overlap * 0.05));
            p2.touch(contactX, contactY, Math.min(0.35, overlap * 0.05));
          }
        }
      }
    }

    // ========================================================================
    // メインループ
    // ========================================================================
    loop(currentTime) {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // 1. 浮遊バブル（癒やし背景）
      this.ambientBubbles.forEach(bubble => {
        bubble.update(this.width, this.height);
        bubble.draw(this.ctx);
      });

      // 2. 衝撃波
      this.shockwaves = this.shockwaves.filter(sw => {
        const alive = sw.update();
        if (alive) sw.draw(this.ctx);
        return alive;
      });

      // 3. ぷに（ソフトボディ）
      this.punis.forEach(puni => {
        puni.update(this.width, this.height);
      });

      // ぷに同士のソフト衝突
      this.resolveCollisions();

      this.punis.forEach(puni => {
        puni.draw(this.ctx);
      });

      // 破裂完了したぷにの除去
      this.punis = this.punis.filter(puni => !puni.isBursting || puni.burstScale >= 0.05);

      // 自動補充
      if (this.autoSpawn && this.punis.length < 5) {
        this.spawnPuni(true);
      }

      // 4. パーティクル
      this.particles = this.particles.filter(p => {
        const alive = p.update(this.height);
        if (alive) p.draw(this.ctx);
        return alive;
      });

      // 5. フローティングテキスト
      this.floatingTexts = this.floatingTexts.filter(ft => {
        const alive = ft.update();
        if (alive) ft.draw(this.ctx);
        return alive;
      });

      requestAnimationFrame(this.loop.bind(this));
    }
  }

  // DOMロード後にゲーム初期化
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
})();
