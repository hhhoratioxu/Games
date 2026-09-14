(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    score: document.getElementById("score"),
    highScore: document.getElementById("highScore"),
    lives: document.getElementById("lives"),
    level: document.getElementById("level"),
    startOverlay: document.getElementById("startOverlay"),
    gameOverOverlay: document.getElementById("gameOverOverlay"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    finalScore: document.getElementById("finalScore"),
    finalHighScore: document.getElementById("finalHighScore"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    muteBtn: document.getElementById("muteBtn"),
  };

  const W = canvas.width;
  const H = canvas.height;

  const keys = new Set();
  let state = "ready";
  let score = 0;
  let level = 1;
  let lives = 3;
  let highScore = Number(localStorage.getItem("airplaneBattleHighScore") || 0);
  let lastTime = 0;
  let enemyTimer = 0;
  let shotTimer = 0;
  let elapsed = 0;
  let screenShake = 0;
  let muted = false;
  let touchActive = false;

  let bullets = [];
  let enemies = [];
  let enemyBullets = [];
  let particles = [];
  let powerUps = [];
  let stars = [];

  const audio = {
    ctx: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    tone(freq, duration, type = "square", volume = 0.03, slideTo = null) {
      if (muted) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    },
    shoot() {
      this.tone(540, 0.055, "square", 0.018, 880);
    },
    hit() {
      this.tone(150, 0.12, "sawtooth", 0.028, 65);
    },
    power() {
      this.tone(460, 0.18, "sine", 0.035, 980);
    },
    hurt() {
      this.tone(110, 0.28, "sawtooth", 0.04, 45);
    },
  };

  const player = {
    x: W / 2,
    y: H - 95,
    w: 42,
    h: 54,
    speed: 330,
    invincible: 0,
    rapidFire: 0,
    shield: 0,
  };

  function resetStars() {
    stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      s: Math.random() * 55 + 18,
      a: Math.random() * 0.65 + 0.25,
    }));
  }

  resetStars();
  ui.highScore.textContent = highScore;

  function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    elapsed = 0;
    enemyTimer = 0;
    shotTimer = 0;
    screenShake = 0;

    bullets = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    powerUps = [];

    player.x = W / 2;
    player.y = H - 95;
    player.invincible = 1.2;
    player.rapidFire = 0;
    player.shield = 0;

    updateUI();
  }

  function startGame() {
    audio.init();
    resetGame();
    state = "running";
    ui.startOverlay.classList.remove("visible");
    ui.gameOverOverlay.classList.remove("visible");
    ui.pauseOverlay.classList.remove("visible");
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function togglePause() {
    if (state === "running") {
      state = "paused";
      ui.pauseOverlay.classList.add("visible");
      ui.pauseBtn.textContent = "▶";
    } else if (state === "paused") {
      state = "running";
      ui.pauseOverlay.classList.remove("visible");
      ui.pauseBtn.textContent = "⏸";
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function gameOver() {
    state = "over";
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("airplaneBattleHighScore", String(highScore));
    }
    ui.finalScore.textContent = score;
    ui.finalHighScore.textContent = highScore;
    ui.highScore.textContent = highScore;
    ui.gameOverOverlay.classList.add("visible");
    ui.pauseOverlay.classList.remove("visible");
    ui.pauseBtn.textContent = "⏸";
  }

  function updateUI() {
    ui.score.textContent = score;
    ui.highScore.textContent = highScore;
    ui.lives.textContent = lives;
    ui.level.textContent = level;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b, pad = 0) {
    return (
      a.x - a.w / 2 + pad < b.x + b.w / 2 - pad &&
      a.x + a.w / 2 - pad > b.x - b.w / 2 + pad &&
      a.y - a.h / 2 + pad < b.y + b.h / 2 - pad &&
      a.y + a.h / 2 - pad > b.y - b.h / 2 + pad
    );
  }

  function spawnParticles(x, y, color, count = 12, speed = 160) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + 35;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: Math.random() * 0.55 + 0.35,
        maxLife: 0.9,
        size: Math.random() * 4 + 1.5,
        color,
      });
    }
  }

  function shootPlayer() {
    const delay = player.rapidFire > 0 ? 0.105 : 0.19;
    if (shotTimer < delay) return;

    shotTimer = 0;
    const powered = player.rapidFire > 0;

    if (powered) {
      bullets.push(
        { x: player.x - 11, y: player.y - 31, w: 5, h: 16, vy: -650, damage: 1 },
        { x: player.x + 11, y: player.y - 31, w: 5, h: 16, vy: -650, damage: 1 }
      );
    } else {
      bullets.push({ x: player.x, y: player.y - 31, w: 5, h: 17, vy: -620, damage: 1 });
    }
    audio.shoot();
  }

  function spawnEnemy() {
    const progress = Math.min(1, elapsed / 80);
    const roll = Math.random();
    let type = "scout";

    if (level >= 3 && roll > 0.78) type = "zigzag";
    if (level >= 5 && roll > 0.88) type = "heavy";

    const presets = {
      scout: {
        w: 35,
        h: 43,
        hp: 1,
        speed: 120 + progress * 85,
        score: 20,
        color: "#f87171",
        fireChance: 0.0015 + level * 0.00015,
      },
      zigzag: {
        w: 38,
        h: 46,
        hp: 2,
        speed: 105 + progress * 72,
        score: 45,
        color: "#fbbf24",
        fireChance: 0.0021 + level * 0.00017,
      },
      heavy: {
        w: 52,
        h: 60,
        hp: 5,
        speed: 78 + progress * 55,
        score: 100,
        color: "#c084fc",
        fireChance: 0.003 + level * 0.0002,
      },
    };

    const p = presets[type];
    enemies.push({
      ...p,
      type,
      x: 36 + Math.random() * (W - 72),
      y: -60,
      t: Math.random() * 10,
      hitFlash: 0,
    });
  }

  function spawnEnemyBullet(enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 175 + level * 8;
    enemyBullets.push({
      x: enemy.x,
      y: enemy.y + enemy.h / 2,
      w: 8,
      h: 14,
      vx: (dx / len) * speed,
      vy: Math.max(100, (dy / len) * speed),
    });
  }

  function maybeDropPowerUp(x, y) {
    if (Math.random() > 0.12) return;
    const types = ["rapid", "shield", "life"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
      x,
      y,
      w: 26,
      h: 26,
      type,
      vy: 95,
      spin: 0,
    });
  }

  function damagePlayer() {
    if (player.invincible > 0) return;

    if (player.shield > 0) {
      player.shield = 0;
      player.invincible = 0.7;
      spawnParticles(player.x, player.y, "#67e8f9", 20, 210);
      audio.power();
      return;
    }

    lives -= 1;
    player.invincible = 1.65;
    screenShake = 10;
    spawnParticles(player.x, player.y, "#fb7185", 28, 250);
    audio.hurt();
    updateUI();

    if (lives <= 0) gameOver();
  }

  function collectPowerUp(p) {
    if (p.type === "rapid") player.rapidFire = 7;
    if (p.type === "shield") player.shield = 10;
    if (p.type === "life") lives = Math.min(5, lives + 1);

    score += 25;
    spawnParticles(p.x, p.y, "#86efac", 18, 160);
    audio.power();
    updateUI();
  }

  function update(dt) {
    elapsed += dt;
    shotTimer += dt;
    player.invincible = Math.max(0, player.invincible - dt);
    player.rapidFire = Math.max(0, player.rapidFire - dt);
    player.shield = Math.max(0, player.shield - dt);
    screenShake *= 0.88;

    const nextLevel = 1 + Math.floor(score / 600);
    if (nextLevel !== level) {
      level = nextLevel;
      updateUI();
    }

    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed * dt;
      player.y += (dy / len) * player.speed * dt;
    }

    player.x = clamp(player.x, 26, W - 26);
    player.y = clamp(player.y, 48, H - 38);

    if (keys.has(" ") || touchActive) shootPlayer();

    for (const star of stars) {
      star.y += star.s * dt * (1 + level * 0.025);
      if (star.y > H + 4) {
        star.y = -4;
        star.x = Math.random() * W;
      }
    }

    const spawnInterval = Math.max(0.26, 0.86 - level * 0.045);
    enemyTimer += dt;
    if (enemyTimer >= spawnInterval) {
      enemyTimer = 0;
      spawnEnemy();
    }

    for (const bullet of bullets) bullet.y += bullet.vy * dt;

    for (const enemy of enemies) {
      enemy.t += dt;
      enemy.y += enemy.speed * dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

      if (enemy.type === "zigzag") {
        enemy.x += Math.sin(enemy.t * 3.7) * 115 * dt;
      }
      enemy.x = clamp(enemy.x, 28, W - 28);

      if (Math.random() < enemy.fireChance * 60 * dt && enemy.y > 70 && enemy.y < H * 0.65) {
        spawnEnemyBullet(enemy);
      }
    }

    for (const bullet of enemyBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
    }

    for (const p of powerUps) {
      p.y += p.vy * dt;
      p.spin += dt * 3;
    }

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      let consumed = false;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (!rectsOverlap(bullet, enemy, 3)) continue;

        bullets.splice(i, 1);
        consumed = true;
        enemy.hp -= bullet.damage;
        enemy.hitFlash = 0.08;
        spawnParticles(bullet.x, bullet.y, "#e0f2fe", 4, 80);

        if (enemy.hp <= 0) {
          enemies.splice(j, 1);
          score += enemy.score;
          if (score > highScore) highScore = score;
          maybeDropPowerUp(enemy.x, enemy.y);
          spawnParticles(enemy.x, enemy.y, enemy.color, enemy.type === "heavy" ? 26 : 15, 210);
          audio.hit();
          updateUI();
        }
        break;
      }

      if (consumed) continue;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];

      if (rectsOverlap(player, enemy, 8)) {
        enemies.splice(i, 1);
        spawnParticles(enemy.x, enemy.y, enemy.color, 20, 210);
        damagePlayer();
        continue;
      }

      if (enemy.y > H + 80) {
        enemies.splice(i, 1);
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const bullet = enemyBullets[i];

      if (rectsOverlap(player, bullet, 5)) {
        enemyBullets.splice(i, 1);
        damagePlayer();
        continue;
      }

      if (bullet.y > H + 30 || bullet.x < -30 || bullet.x > W + 30) {
        enemyBullets.splice(i, 1);
      }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (rectsOverlap(player, p, 4)) {
        powerUps.splice(i, 1);
        collectPowerUp(p);
        continue;
      }
      if (p.y > H + 40) powerUps.splice(i, 1);
    }

    bullets = bullets.filter((b) => b.y > -40);
    particles = particles.filter((p) => p.life > 0);
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rr);
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#020617");
    gradient.addColorStop(0.6, "#061225");
    gradient.addColorStop(1, "#020817");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    for (const star of stars) {
      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#dbeafe";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const horizon = ctx.createRadialGradient(W / 2, H * 0.15, 20, W / 2, H * 0.2, 360);
    horizon.addColorStop(0, "rgba(56, 189, 248, 0.08)");
    horizon.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, W, H * 0.55);
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    if (player.shield > 0) {
      ctx.strokeStyle = "rgba(103, 232, 249, 0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 2, 34 + Math.sin(performance.now() / 140) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(56, 189, 248, 0.30)";
    ctx.beginPath();
    ctx.moveTo(-9, 22);
    ctx.lineTo(0, 48 + Math.random() * 8);
    ctx.lineTo(9, 22);
    ctx.closePath();
    ctx.fill();

    const g = ctx.createLinearGradient(0, -28, 0, 28);
    g.addColorStop(0, "#e0f2fe");
    g.addColorStop(0.34, "#38bdf8");
    g.addColorStop(1, "#2563eb");
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(11, -5);
    ctx.lineTo(27, 14);
    ctx.lineTo(10, 12);
    ctx.lineTo(6, 27);
    ctx.lineTo(0, 22);
    ctx.lineTo(-6, 27);
    ctx.lineTo(-10, 12);
    ctx.lineTo(-27, 14);
    ctx.lineTo(-11, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(0, -7, 5.5, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.ellipse(0, -10, 2.8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.hitFlash > 0) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffffff";
    }

    ctx.fillStyle = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;

    if (enemy.type === "heavy") {
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(23, 18);
      ctx.lineTo(21, -18);
      ctx.lineTo(9, -29);
      ctx.lineTo(0, -20);
      ctx.lineTo(-9, -29);
      ctx.lineTo(-21, -18);
      ctx.lineTo(-23, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#312e81";
      ctx.fillRect(-7, -12, 14, 24);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.lineTo(10, 8);
      ctx.lineTo(22, -10);
      ctx.lineTo(8, -8);
      ctx.lineTo(0, -25);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-22, -10);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.ellipse(0, 2, 4, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBullets() {
    for (const bullet of bullets) {
      const g = ctx.createLinearGradient(bullet.x, bullet.y - 8, bullet.x, bullet.y + 8);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, "#7dd3fc");
      g.addColorStop(1, "rgba(59, 130, 246, 0.15)");
      ctx.fillStyle = g;
      ctx.fillRect(bullet.x - bullet.w / 2, bullet.y - bullet.h / 2, bullet.w, bullet.h);
    }

    for (const bullet of enemyBullets) {
      ctx.fillStyle = "#fb7185";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#fb7185";
      ctx.beginPath();
      ctx.ellipse(bullet.x, bullet.y, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawPowerUps() {
    const labels = {
      rapid: ["R", "#fbbf24"],
      shield: ["S", "#67e8f9"],
      life: ["+", "#86efac"],
    };

    for (const p of powerUps) {
      const [label, color] = labels[p.type];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.spin) * 0.16);
      ctx.shadowBlur = 14;
      ctx.shadowColor = color;
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      drawRoundedRect(-13, -13, 26, 26, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "800 15px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawStatusEffects() {
    const effects = [];
    if (player.rapidFire > 0) effects.push(`⚡ 双发 ${player.rapidFire.toFixed(1)}s`);
    if (player.shield > 0) effects.push(`🛡 护盾 ${player.shield.toFixed(1)}s`);

    if (!effects.length) return;

    ctx.font = "700 12px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let x = 12;
    for (const text of effects) {
      const width = ctx.measureText(text).width + 20;
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      drawRoundedRect(x, 12, width, 30, 12);
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(text, x + 10, 20);
      x += width + 8;
    }
  }

  function render() {
    ctx.save();

    if (screenShake > 0.5) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    drawBackground();
    drawBullets();
    for (const enemy of enemies) drawEnemy(enemy);
    drawPowerUps();
    drawPlayer();
    drawParticles();
    drawStatusEffects();

    ctx.restore();
  }

  function loop(now) {
    if (state !== "running") return;

    const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    update(dt);
    render();

    if (state === "running") requestAnimationFrame(loop);
  }

  function pointerToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  function movePlayerToPointer(event) {
    if (state !== "running") return;
    const p = pointerToCanvas(event);
    if (!p) return;
    player.x = clamp(p.x, 26, W - 26);
    player.y = clamp(p.y - 34, 48, H - 38);
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      event.preventDefault();
    }

    if (key === "p") {
      togglePause();
      return;
    }

    if (key === "r" && state === "over") {
      startGame();
      return;
    }

    if (key === "m") {
      muted = !muted;
      ui.muteBtn.textContent = muted ? "🔇" : "🔊";
      return;
    }

    keys.add(key);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (state !== "running") return;
    touchActive = true;
    canvas.setPointerCapture?.(event.pointerId);
    movePlayerToPointer(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!touchActive) return;
    movePlayerToPointer(event);
  });

  const releasePointer = () => {
    touchActive = false;
  };

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") touchActive = false;
  });

  ui.startBtn.addEventListener("click", startGame);
  ui.restartBtn.addEventListener("click", startGame);
  ui.pauseBtn.addEventListener("click", togglePause);
  ui.muteBtn.addEventListener("click", () => {
    muted = !muted;
    ui.muteBtn.textContent = muted ? "🔇" : "🔊";
    if (!muted) audio.init();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running") togglePause();
  });

  render();
})();
