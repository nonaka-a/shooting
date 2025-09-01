'use strict';

// --- グローバル変数と定数 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundToggleButton = document.getElementById('soundToggleButton');
const clearScreenButtonsContainer = document.getElementById('clearScreenButtons');
const retryButton = document.getElementById('retryButton');
const nextStageButton = document.getElementById('nextStageButton');
const videoContainer = document.getElementById('videoContainer');
const finalStageIntroVideo = document.getElementById('finalStageIntroVideo');
const skipButton = document.getElementById('skipButton');

const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// ステージ4用の設定
const PLAYER_SPEED = 3;
const PLAYER_FIRE_RATE = 450;
const BULLET_SPEED = 4;
const ENEMY_SPAWN_INTERVAL = 1000;
const HEART_ITEM_SPAWN_INTERVAL = 12000;
const POWERUP_SPAWN_INTERVAL = 18000;
const ENEMY_BULLET_SPEED = 4;
const ENEMY_FIRE_RATE = 5000;
const BOSS_BULLET_SPEED = 5;
const BOSS_FIRE_RATE = 4000;
const BOSS_APPEAR_SCORE = 10000;
const STAGE4_BOSS_HP = 3400;
const TILT_ANGLE = 5 * Math.PI / 180;
const MAX_TITLE_PARTICLES = 150;
const ROCK_FALL_SPEED = 5; // ★★★ 修正・追加箇所 ★★★ (8から5へ変更)
const ROCK_SPAWN_INTERVAL = 4000; // ★★★ 修正・追加箇所 ★★★ (3000から4000へ変更)

// ゲームの状態
let gameState = 'loading';
let score = 0;
let lastTime = 0;
let isSoundOn = true;
let hasUserInteracted = false;
let gameStartTime = 0;
let bossWarningTimer = 0;
let itemsDroppedDuringWarning = 0;
let shakeIntensity = 0;
let shakeDuration = 0;

// エンティティ
const player = {}; const bullets = []; const enemies = []; const hearts = []; const powerups = []; const enemyBullets = []; const bossExplosionParticles = []; const boss = {}; let isBossActive = false; let hasBossAppeared = false; const titleParticles = [];
const rocks = []; 
const background = { y1: 0, y2: -canvas.height, speed: 2 };
const keys = {};
let lastEnemySpawnTime = 0, lastHeartSpawnTime = 0, lastPowerupSpawnTime = 0;
let lastRockSpawnTime = 0;

// --- リソース管理 ---
const resources = {
    images: {
        background: { src: 'images/background/background4.png', asset: new Image() },
        player1: { src: 'images/player/player_1.png', asset: new Image() },
        player2: { src: 'images/player/player_2.png', asset: new Image() },
        player3: { src: 'images/player/player_3.png', asset: new Image() },
        playerDamaged: { src: 'images/player/player_damaged.png', asset: new Image() },
        playerShadow: { src: 'images/player/player_shadow.png', asset: new Image() },
        playerFaceDecoration: { src: 'images/player/player_face_decoration.png', asset: new Image() },
        enemy: { src: 'images/enemy/enemy.png', asset: new Image() },
        enemyMacho: { src: 'images/enemy/enemy_macho.png', asset: new Image() },
        rock: { src: 'images/enemy/rock.png', asset: new Image() },
        bullet01: { src: 'images/bullet/bullet_01.png', asset: new Image() },
        bullet02: { src: 'images/bullet/bullet_02.png', asset: new Image() },
        bullet03: { src: 'images/bullet/bullet_03.png', asset: new Image() },
        enemyBullet01: { src: 'images/bullet/enemy_bullet_01.png', asset: new Image() },
        enemyBullet02: { src: 'images/bullet/enemy_bullet_02.png', asset: new Image() },
        enemyBullet03: { src: 'images/bullet/enemy_bullet_03.png', asset: new Image() },
        heart: { src: 'images/heart.png', asset: new Image() },
        heartItem: { src: 'images/heart_item.png', asset: new Image() },
        powerupThreeWay: { src: 'images/powerup_threeway.png', asset: new Image() },
        powerupSpeed: { src: 'images/powerup_speed.png', asset: new Image() },
        bossStage4: { src: 'images/boss/boss_stage4.png', asset: new Image() },
        bossStage4Damaged: { src: 'images/boss/boss_stage4_damaged.png', asset: new Image() },
    },
    sounds: {
        playBGM: { src: 'sounds/stage4_play.mp3', asset: new Audio() },
        bossBGM: { src: 'sounds/stage3_boss.mp3', asset: new Audio() },
        gameClear: { src: 'sounds/gameclear.mp3', asset: new Audio() }, 
        gameoverBGM: { src: 'sounds/gameover.mp3', asset: new Audio() },
        fire: { src: 'sounds/fire.mp3', asset: new Audio() },
        enemyHit: { src: 'sounds/enemy-hit.mp3', asset: new Audio() },
        itemGet: { src: 'sounds/item-get.mp3', asset: new Audio() },
        playerHit: { src: 'sounds/player-hit.mp3', asset: new Audio() },
        gameStart: { src: 'sounds/start.mp3', asset: new Audio() },
        bossLand: { src: 'sounds/enemy-hit.mp3', asset: new Audio() },
    }
};

// --- 音声制御 ---
let currentBGM = null; let fadeInterval = null; function playAudio(audio, loop = false, isBGM = false, volume = 1.0) { if (!isSoundOn) return; if (isBGM) { if (currentBGM) { if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; } currentBGM.pause(); currentBGM.currentTime = 0; } currentBGM = audio; } audio.loop = loop; if (!loop) { audio.currentTime = 0; } audio.volume = volume; audio.play().catch(e => console.error("Audio play failed.", e.name, e.message)); }
function fadeOutBGM(audio, duration, callback) { if (!audio || audio.paused || !isSoundOn) { if (callback) callback(); return; } const initialVolume = audio.volume; const steps = 50; const stepTime = duration / steps; let currentStep = 0; if (fadeInterval) { clearInterval(fadeInterval); } fadeInterval = setInterval(() => { currentStep++; if (currentStep >= steps) { audio.volume = 0; audio.pause(); audio.currentTime = 0; clearInterval(fadeInterval); fadeInterval = null; if (callback) callback(); } else { audio.volume = initialVolume * (1 - (currentStep / steps)); } }, stepTime); }
function stopBGM() { if (currentBGM) { if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; } currentBGM.pause(); currentBGM.currentTime = 0; currentBGM = null; } }
function setAllAudioMute(mute) { for (const key in resources.sounds) { resources.sounds[key].asset.muted = mute; } if (currentBGM) { currentBGM.muted = mute; } }

// --- 初期化・開始処理 ---
function resetGame() { const playerImage = resources.images.player1.asset; Object.assign(player, { width: playerImage.width * 0.2, height: playerImage.height * 0.2, x: canvas.width / 2 - (playerImage.width * 0.2) / 2, y: canvas.height - (playerImage.height * 0.2) - 20, speed: PLAYER_SPEED, baseSpeed: PLAYER_SPEED, dx: 0, dy: 0, fireRate: PLAYER_FIRE_RATE, lastBulletTime: 0, lives: 5, shotLevel: 1, speedLevel: 1, isDamaged: false, damageTimer: 0, animationFrame: 0, animationTimer: 0, animationDirection: 1, }); player.speed = player.baseSpeed + (player.speedLevel * 0.5); score = 0; bullets.length = 0; enemies.length = 0; hearts.length = 0; powerups.length = 0; enemyBullets.length = 0; 
    rocks.length = 0;
    Object.assign(boss, { 
        x: canvas.width / 2 - 125, y: -250, width: 250, height: 250, baseWidth: 250, baseHeight: 250, 
        hp: STAGE4_BOSS_HP, maxHp: STAGE4_BOSS_HP, 
        speed: 1.2, dx: 1, isDefeated: false, defeatAlpha: 1.0, defeatScale: 1.0, lastBossBulletTime: 0, isDamagedState: false, 
        currentScale: 1.0, scaleDirection: 1, 
        targetY: 50, dy: 0, 
        state: 'entering',
        jumpHeight: -400,
        jumpProgress: 0,
        jumpStartX: 0,
        jumpStartY: 0,
        jumpTargetX: 0,
        jumpTargetY: 0,
        lastJumpTime: 0, 
        jumpInterval: 4000, 
        aimTimer: 0, 
    }); 
    isBossActive = false; hasBossAppeared = false; bossExplosionParticles.length = 0; background.y1 = 0; background.y2 = -canvas.height; lastTime = 0; 
    shakeIntensity = 0; shakeDuration = 0;
}
function startGame() { resetGame(); playAudio(resources.sounds.gameStart.asset); gameState = 'playing'; gameStartTime = performance.now(); playAudio(resources.sounds.playBGM.asset, true, true); }
function loadResources(callback) { const allRes = [...Object.values(resources.images), ...Object.values(resources.sounds)]; let loadedCount = 0; if (allRes.length === 0) { callback(); return; } function onResourceLoaded(e) { if (e && e.type === 'error') { console.error(`Failed to load resource: ${this.src}`); } loadedCount++; if (loadedCount === allRes.length) { callback(); } } Object.values(resources.images).forEach(res => { res.asset.onload = onResourceLoaded; res.asset.onerror = onResourceLoaded; res.asset.src = res.src; }); Object.values(resources.sounds).forEach(res => { res.asset.addEventListener('canplaythrough', onResourceLoaded, { once: true }); res.asset.onerror = onResourceLoaded; res.asset.src = res.src; }); }

// --- メインゲームループ ---
function gameLoop(currentTime) { if (!lastTime) lastTime = currentTime; const deltaTime = currentTime - lastTime; update(deltaTime, currentTime); draw(deltaTime); lastTime = currentTime; requestAnimationFrame(gameLoop); }

// --- 更新処理 ---
function update(deltaTime, currentTime) {
    if (shakeDuration > 0) {
        shakeDuration -= deltaTime;
        if (shakeDuration <= 0) {
            shakeIntensity = 0;
        }
    }

    switch (gameState) {
        case 'playing': updatePlayingState(deltaTime, currentTime); break;
        case 'bossWarning': updateBossWarning(deltaTime, currentTime); break;
        case 'bossDefeatAnimation': updateBossDefeatAnimation(deltaTime, currentTime); break;
        case 'stageClear': updateTitleParticles(); break; 
    }
}
function updatePlayingState(deltaTime, currentTime) { 
    updateBackground(); 
    updatePlayer(currentTime); 
    updateEntities(deltaTime); 
    updateEnemyScaling(deltaTime); 
    updateEnemyBullets(deltaTime); 
    updateRocks(deltaTime);

    if (score >= BOSS_APPEAR_SCORE && !hasBossAppeared) { gameState = 'bossWarning'; bossWarningTimer = 8000; itemsDroppedDuringWarning = 0; enemyBullets.length = 0; fadeOutBGM(currentBGM, 1000); } 
    if (isBossActive) { updateBoss(deltaTime, currentTime); } else { spawnEntities(currentTime); fireEnemyBullets(currentTime); } 
    spawnItems(currentTime); 
    checkCollisions(); 
}
function updateBossWarning(deltaTime, currentTime) { bossWarningTimer -= deltaTime; updateBackground(); updatePlayer(currentTime); updateEntities(deltaTime); checkCollisions(); if (itemsDroppedDuringWarning < 10 && Math.random() < 0.1) { const itemType = itemsDroppedDuringWarning < 3 ? 'heart' : (Math.random() < 0.5 ? 'threeWay' : 'speed'); if (itemType === 'heart') { hearts.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, }); } else { powerups.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, type: itemType, image: resources.images[itemType === 'threeWay' ? 'powerupThreeWay' : 'powerupSpeed'].asset, }); } itemsDroppedDuringWarning++; } if (bossWarningTimer <= 0) { isBossActive = true; hasBossAppeared = true; boss.y = -boss.height; boss.targetY = 50; boss.dy = 0.5; boss.state = 'entering'; gameState = 'playing'; playAudio(resources.sounds.bossBGM.asset, true, true, 0.5); } }
function updateBoss(deltaTime, currentTime) {
    if (boss.isDefeated) {
        boss.defeatAlpha -= 0.01;
        boss.defeatScale += 0.01;
        if (Math.random() < 0.5) { bossExplosionParticles.push({ x: boss.x + boss.width / 2, y: boss.y + boss.height / 2, size: Math.random() * 10 + 5, alpha: 1.0, speed: Math.random() * 3 + 1, direction: Math.random() * Math.PI * 2, color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)` }); }
        if (boss.defeatAlpha <= 0) {
            boss.defeatAlpha = 0;
            gameState = 'stageClear';
            stopBGM();
            playAudio(resources.sounds.gameClear.asset);
        }
        return;
    }
    if (boss.hp <= boss.maxHp / 3 && !boss.isDamagedState) { boss.isDamagedState = true; }
    
    switch (boss.state) {
        case 'entering': 
            boss.y += boss.dy; 
            if (boss.y >= boss.targetY) { 
                boss.y = boss.targetY; 
                boss.dy = 0; 
                boss.state = 'idle'; 
                boss.lastJumpTime = currentTime; 
            } 
            break;
        case 'idle': 
            boss.x += boss.speed * boss.dx; 
            if (boss.x + boss.width > canvas.width || boss.x < 0) { boss.dx *= -1; } 
            if (currentTime - boss.lastBossBulletTime > BOSS_FIRE_RATE) { 
                fireBossBullets(); 
                boss.lastBossBulletTime = currentTime; 
            } 
            if (currentTime - boss.lastJumpTime > boss.jumpInterval) { 
                boss.state = 'aiming'; 
                boss.aimTimer = 1000; 
            } 
            break;
        case 'aiming': 
            boss.aimTimer -= deltaTime; 
            if (boss.aimTimer <= 0) { 
                boss.state = 'jumping'; 
                boss.jumpProgress = 0;
                boss.jumpStartX = boss.x;
                boss.jumpStartY = boss.y;
                boss.jumpTargetX = Math.max(0, Math.min(player.x + player.width / 2 - boss.width / 2, canvas.width - boss.width));
                boss.jumpTargetY = Math.max(50, Math.min(player.y + player.height/2 - boss.height/2, canvas.height/2));
            } 
            break;
        case 'jumping':
            boss.jumpProgress += deltaTime / 1000; 
            if (boss.jumpProgress >= 1) {
                boss.jumpProgress = 1;
                boss.state = 'landing';
            }
            const t = boss.jumpProgress;
            boss.x = boss.jumpStartX + (boss.jumpTargetX - boss.jumpStartX) * t;
            boss.y = boss.jumpStartY + (boss.jumpTargetY - boss.jumpStartY) * t + boss.jumpHeight * Math.sin(t * Math.PI);
            break;
        case 'landing':
            shakeDuration = 200; 
            shakeIntensity = 15; 
            playAudio(resources.sounds.bossLand.asset, false, false, 0.8);
            
            boss.x = boss.jumpTargetX;
            boss.y = boss.jumpTargetY;
            
            spawnRocks();

            boss.state = 'idle'; 
            boss.lastJumpTime = currentTime; 
            break;
    }
}
function fireBossBullets() { 
    const targetX = player.x + player.width / 2; 
    const targetY = player.y + player.height / 2; 
    const bulletY = boss.y + boss.height - 40; 
    
    const bulletXCenter = boss.x + boss.width / 2;
    let angleCenter = Math.atan2(targetY - bulletY, targetX - bulletXCenter); 
    enemyBullets.push({ x: bulletXCenter - 15, y: bulletY, width: 30, height: 30, speed: BOSS_BULLET_SPEED, dx: Math.cos(angleCenter) * BOSS_BULLET_SPEED, dy: Math.sin(angleCenter) * BOSS_BULLET_SPEED, frame: 0, animationTimer: 0, }); 
    
    const angleOffset = 20 * Math.PI / 180;
    const bulletXLeft = boss.x + boss.width / 4;
    const bulletXRight = boss.x + boss.width * 3 / 4;

    enemyBullets.push({ x: bulletXLeft - 15, y: bulletY, width: 30, height: 30, speed: BOSS_BULLET_SPEED, dx: Math.cos(angleCenter - angleOffset) * BOSS_BULLET_SPEED, dy: Math.sin(angleCenter - angleOffset) * BOSS_BULLET_SPEED, frame: 0, animationTimer: 0, }); 
    enemyBullets.push({ x: bulletXRight - 15, y: bulletY, width: 30, height: 30, speed: BOSS_BULLET_SPEED, dx: Math.cos(angleCenter + angleOffset) * BOSS_BULLET_SPEED, dy: Math.sin(angleCenter + angleOffset) * BOSS_BULLET_SPEED, frame: 0, animationTimer: 0, }); 
}
function updateBossDefeatAnimation(deltaTime, currentTime) { updateBackground(); updateBoss(deltaTime, currentTime); for (let i = bossExplosionParticles.length - 1; i >= 0; i--) { const p = bossExplosionParticles[i]; p.x += Math.cos(p.direction) * p.speed; p.y += Math.sin(p.direction) * p.speed; p.alpha -= 0.02; p.size += 0.5; if (p.alpha <= 0) { bossExplosionParticles.splice(i, 1); } } }
function updateBackground() { background.y1 += background.speed; background.y2 += background.speed; if (background.y1 >= canvas.height) { background.y1 = background.y2 - canvas.height; } if (background.y2 >= canvas.height) { background.y2 = background.y1 - canvas.height; } }
function updatePlayer(currentTime) { if (player.isDamaged) { player.damageTimer -= 16; if (player.damageTimer <= 0) { player.isDamaged = false; } } player.animationTimer += 16; if (player.animationTimer > 150) { player.animationFrame += player.animationDirection; if (player.animationFrame >= 2) player.animationDirection = -1; else if (player.animationFrame <= 0) player.animationDirection = 1; player.animationTimer = 0; } player.dx = 0; player.dy = 0; if (keys.ArrowLeft || keys.KeyA) player.dx = -player.speed; if (keys.ArrowRight || keys.KeyD) player.dx = player.speed; if (keys.ArrowUp || keys.KeyW) player.dy = -player.speed; if (keys.ArrowDown || keys.KeyS) player.dy = player.speed; player.x += player.dx; player.y += player.dy; player.x = Math.max(0, Math.min(player.x, canvas.width - player.width)); player.y = Math.max(0, Math.min(player.y, canvas.height - player.height)); if ((keys.Space || keys.KeyZ) && (currentTime - player.lastBulletTime > player.fireRate)) { fireBullet(); player.lastBulletTime = currentTime; } }
function updateEntities(deltaTime) { for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.y -= b.speed; if (b.dx) b.x += b.dx; if (b.dy) b.y -= b.dy; if (b.y + b.height < 0 || b.x < -b.width || b.x > canvas.width) { bullets.splice(i, 1); } } for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; if (e.type === 'macho') { updateMacho(e); } else { e.y += e.speed; if (e.y > canvas.height) { enemies.splice(i, 1); } } } for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.y += h.speed; if (h.y > canvas.height) hearts.splice(i, 1); } for (let i = powerups.length - 1; i >= 0; i--) { const p = powerups[i]; p.y += p.speed; if (p.y > canvas.height) powerups.splice(i, 1); } }
function updateMacho(macho) { if (macho.damageTimer > 0) { macho.damageTimer -= 16; } switch (macho.state) { case 'descending': macho.y += macho.speed; if (macho.y >= macho.initialY) { macho.y = macho.initialY; macho.state = 'idle'; } break; case 'idle': if (Math.abs((player.x + player.width / 2) - (macho.x + macho.width / 2)) < 30) { macho.state = 'aiming'; macho.aimTimer = 500; } break; case 'aiming': macho.aimTimer -= 16; if (macho.aimTimer <= 0) { macho.state = 'dashing'; } break; case 'dashing': macho.y += macho.dashSpeed; if (macho.y > canvas.height) { macho.state = 'returning'; macho.x = Math.random() * (canvas.width - macho.width); } break; case 'returning': macho.y -= macho.returnSpeed; if (macho.y <= macho.initialY) { macho.y = macho.initialY; macho.state = 'idle'; } break; } }
function updateEnemyScaling(deltaTime) { const scaleSpeed = 0.0005; enemies.forEach(e => { if (e.type === 'macho') return; e.currentScale += e.scaleDirection * scaleSpeed * deltaTime; if (e.scaleDirection === 1 && e.currentScale >= 1.1) { e.currentScale = 1.1; e.scaleDirection = -1; } else if (e.scaleDirection === -1 && e.currentScale <= 0.9) { e.currentScale = 0.9; e.scaleDirection = 1; } }); }
function updateEnemyBullets(deltaTime) { const enemyBulletImages = [resources.images.enemyBullet01.asset, resources.images.enemyBullet02.asset, resources.images.enemyBullet03.asset]; for (let i = enemyBullets.length - 1; i >= 0; i--) { const b = enemyBullets[i]; b.x += b.dx; b.y += b.dy; b.animationTimer += deltaTime; if (b.animationTimer > 100) { b.frame = (b.frame + 1) % enemyBulletImages.length; b.animationTimer = 0; } if (b.y > canvas.height || b.x < -b.width || b.x > canvas.width) { enemyBullets.splice(i, 1); } } }
function spawnRocks() {
    const rockCount = 5;
    for (let i = 0; i < rockCount; i++) {
        spawnSingleRock();
    }
}
function spawnSingleRock() {
    const rockSize = (Math.random() * 40 + 40) * 0.6; 
    rocks.push({
        x: Math.random() * (canvas.width - rockSize),
        y: -rockSize - Math.random() * 200,
        width: rockSize,
        height: rockSize,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
}
function updateRocks(deltaTime) {
    for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i];
        r.y += ROCK_FALL_SPEED;
        r.rotation += r.rotationSpeed;

        if (r.y > canvas.height) {
            rocks.splice(i, 1);
        }
    }
}
function spawnEntities(currentTime) { 
    if (currentTime - gameStartTime < 2000) return; 

    // 敵の生成
    if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) { 
        if (Math.random() < 0.3) { 
            const machoBaseWidth = 90; const machoBaseHeight = 90; 
            enemies.push({ type: 'macho', x: Math.random() * (canvas.width - machoBaseWidth), y: -machoBaseHeight, width: machoBaseWidth, height: machoBaseHeight, hp: 5, maxHp: 5, speed: 1.5, dashSpeed: 10, returnSpeed: 2, state: 'descending', initialY: Math.random() * 100 + 40, aimTimer: 0, lastEnemyBulletTime: 0, canShoot: true, damageTimer: 0, }); 
        } else { 
            const enemyBaseWidth = 50; const enemyBaseHeight = 50; 
            enemies.push({ type: 'normal', x: Math.random() * (canvas.width - enemyBaseWidth), y: -enemyBaseHeight, width: enemyBaseWidth, height: enemyBaseHeight, baseWidth: enemyBaseWidth, baseHeight: enemyBaseHeight, currentScale: 1.0, scaleDirection: Math.random() < 0.5 ? 1 : -1, speed: Math.random() * 2 + 1.5, lastEnemyBulletTime: 0, canShoot: Math.random() < 0.6, }); 
        } 
        lastEnemySpawnTime = currentTime; 
    }

    // 岩の生成
    if (currentTime - lastRockSpawnTime > ROCK_SPAWN_INTERVAL) {
        spawnSingleRock();
        lastRockSpawnTime = currentTime;
    }
}
function spawnItems(currentTime) {
    const heartInterval = isBossActive ? (HEART_ITEM_SPAWN_INTERVAL / 1.5) : HEART_ITEM_SPAWN_INTERVAL;

    if (currentTime - lastHeartSpawnTime > heartInterval) {
        hearts.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, });
        lastHeartSpawnTime = currentTime;
    }
    
    if (currentTime - lastPowerupSpawnTime > POWERUP_SPAWN_INTERVAL) {
        const itemType = Math.random() < 0.5 ? 'threeWay' : 'speed';
        powerups.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, type: itemType, image: resources.images[itemType === 'threeWay' ? 'powerupThreeWay' : 'powerupSpeed'].asset });
        lastPowerupSpawnTime = currentTime;
    }
}
function fireBullet() { playAudio(resources.sounds.fire.asset, false, false, 0.25); const baseBullet = { x: player.x + player.width / 2 - 15, y: player.y, width: 30, height: 30, speed: BULLET_SPEED, frame: 0, animationTimer: 0, }; if (player.shotLevel === 0) { bullets.push({ ...baseBullet }); } else if (player.shotLevel === 1) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -2, dy: 0 }); bullets.push({ ...baseBullet, dx: 2, dy: 0 }); } else if (player.shotLevel === 2) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -2.5, dy: 0 }); bullets.push({ ...baseBullet, dx: 2.5, dy: 0 }); bullets.push({ ...baseBullet, dx: -1, dy: 1 }); bullets.push({ ...baseBullet, dx: 1, dy: 1 }); } else if (player.shotLevel >= 3) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -3, dy: 0 }); bullets.push({ ...baseBullet, dx: 3, dy: 0 }); bullets.push({ ...baseBullet, dx: -2, dy: 1 }); bullets.push({ ...baseBullet, dx: 2, dy: 1 }); bullets.push({ ...baseBullet, dx: -1, dy: 2 }); bullets.push({ ...baseBullet, dx: 1, dy: 2 }); } }
function fireEnemyBullets(currentTime) {
    enemies.forEach(e => {
        if (e.type === 'macho' && e.state !== 'idle') {
            return;
        }
        if (e.canShoot && currentTime - e.lastEnemyBulletTime > ENEMY_FIRE_RATE) {
            const targetX = player.x + player.width / 2;
            const targetY = player.y + player.height / 2;
            const bulletX = e.x + e.width / 2;
            const bulletY = e.y + e.height;
            const angle = Math.atan2(targetY - bulletY, targetX - bulletX);
            enemyBullets.push({
                x: bulletX - 15, y: bulletY, width: 30, height: 30, speed: ENEMY_BULLET_SPEED,
                dx: Math.cos(angle) * ENEMY_BULLET_SPEED, dy: Math.sin(angle) * ENEMY_BULLET_SPEED,
                frame: 0, animationTimer: 0,
            });
            e.lastEnemyBulletTime = currentTime;
        }
    });
}
function checkCollisions() {
    if (isBossActive && boss.state === 'landing' && isColliding(player, boss)) {
        handlePlayerHit(2); 
    } else if (isBossActive && boss.state === 'idle' && isColliding(player, boss)) {
        handlePlayerHit(1);
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
        if(bullets[i]) {
            for (let k = rocks.length - 1; k >= 0; k--) {
                if (isColliding(bullets[i], rocks[k])) {
                    bullets.splice(i, 1);
                    break; 
                }
            }
        }

        if(bullets[i]) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (isColliding(bullets[i], enemies[j])) {
                    const e = enemies[j];
                    playAudio(resources.sounds.enemyHit.asset);
                    bullets.splice(i, 1);
                    if (e.type === 'macho') {
                        e.hp--;
                        e.damageTimer = 100;
                        if (e.hp <= 0) { enemies.splice(j, 1); score += 500; }
                    } else {
                        enemies.splice(j, 1);
                        score += 150;
                    }
                    break;
                }
            }
        }
        if (bullets[i] && isBossActive && boss.state !== 'jumping' && isColliding(bullets[i], boss)) {
            playAudio(resources.sounds.enemyHit.asset);
            boss.hp -= 10;
            bullets.splice(i, 1);
            if (boss.hp <= 0) {
                boss.isDefeated = true;
                isBossActive = false;
                score += 10000;
                gameState = 'bossDefeatAnimation';
                stopBGM();
            }
        }
    }
    for (let i = rocks.length - 1; i >= 0; i--) {
        if (isColliding(player, rocks[i])) {
            handlePlayerHit(1);
            rocks.splice(i, 1);
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) { if (isColliding(player, enemies[i])) { handlePlayerHit(1); enemies.splice(i, 1); } }
    for (let i = enemyBullets.length - 1; i >= 0; i--) { if (isColliding(player, enemyBullets[i])) { handlePlayerHit(1); enemyBullets.splice(i, 1); } }
    for (let i = hearts.length - 1; i >= 0; i--) { if (isColliding(player, hearts[i])) { playAudio(resources.sounds.itemGet.asset); hearts.splice(i, 1); player.lives++; } }
    for (let i = powerups.length - 1; i >= 0; i--) { if (isColliding(player, powerups[i])) { playAudio(resources.sounds.itemGet.asset); const p = powerups[i]; if (p.type === 'threeWay') { player.shotLevel = Math.min(player.shotLevel + 1, 3); } else if (p.type === 'speed') { if (player.speedLevel < 5) { player.speedLevel++; player.speed = player.baseSpeed + (player.speedLevel * 0.5); } } powerups.splice(i, 1); } }
}
function handlePlayerHit(damage) { if (!player.isDamaged) { playAudio(resources.sounds.playerHit.asset); player.lives -= damage; player.isDamaged = true; player.damageTimer = 1000; if (player.lives <= 0) { player.lives = 0; gameState = 'gameover'; stopBGM(); playAudio(resources.sounds.gameoverBGM.asset, true, true); } } }
function isColliding(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }

// --- 描画処理 ---
function draw(deltaTime) {
    ctx.save();
    if (shakeIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (gameState) {
        case 'loading': drawLoadingScreen(); break;
        case 'ready': drawReadyScreen(); break;
        case 'playing': case 'bossWarning': case 'gameover': case 'bossDefeatAnimation': case 'stageClear':
            drawPlayingScreen(deltaTime);
            if (gameState === 'bossWarning') drawBossWarningScreen();
            if (gameState === 'gameover') drawGameOverScreen();
            if (gameState === 'stageClear') drawStageClearScreen();
            break;
    }
    
    ctx.restore();
}
function drawPlayingScreen(deltaTime) { 
    const bgImage = resources.images.background.asset; 
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) { 
        ctx.drawImage(bgImage, 0, Math.floor(background.y1), canvas.width, canvas.height); 
        ctx.drawImage(bgImage, 0, Math.floor(background.y2), canvas.width, canvas.height); 
    } 
    drawEnemies(); 
    drawItems(); 
    drawBullets(deltaTime); 
    drawEnemyBullets();
    drawRocks();

    if (isBossActive || gameState === 'bossDefeatAnimation') { drawBoss(); } 
    drawPlayer(); 
    drawBossExplosionParticles(); 
    drawUI(); 
}
function drawPlayer() { const playerImages = [resources.images.player1.asset, resources.images.player2.asset, resources.images.player3.asset]; let currentImage = playerImages[player.animationFrame]; if (player.isDamaged) { if (Math.floor(player.damageTimer / 100) % 2 === 0) return; currentImage = resources.images.playerDamaged.asset; } if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) return; ctx.save(); const centerX = player.x + player.width / 2; const centerY = player.y + player.height / 2; ctx.translate(centerX, centerY); let tilt = 0; if (player.dx < 0) tilt = -TILT_ANGLE; else if (player.dx > 0) tilt = TILT_ANGLE; ctx.rotate(tilt); const shadowImage = resources.images.playerShadow.asset; if (shadowImage && shadowImage.complete) { const shadowWidth = player.width * 0.8; const shadowHeight = player.height * 0.2; const shadowOffsetX = -shadowWidth / 2; const shadowOffsetY = player.height / 2 - shadowHeight / 2 + 10; ctx.drawImage(shadowImage, shadowOffsetX, shadowOffsetY, shadowWidth, shadowHeight); } ctx.drawImage(currentImage, -player.width / 2, -player.height / 2, player.width, player.height); ctx.restore(); }
function drawBullets(deltaTime) { const bulletImages = [resources.images.bullet01.asset, resources.images.bullet02.asset, resources.images.bullet03.asset]; bullets.forEach(b => { b.animationTimer += deltaTime; if (b.animationTimer > 100) { b.frame = (b.frame + 1) % bulletImages.length; b.animationTimer = 0; } const currentImage = bulletImages[b.frame]; if (currentImage && currentImage.complete) { ctx.drawImage(currentImage, b.x, b.y, b.width, b.height); } }); }
function drawEnemies() {
    const shadowImage = resources.images.playerShadow.asset;
    enemies.forEach(e => {
        if (shadowImage && shadowImage.complete) {
            const shadowWidth = e.width * 0.8;
            const shadowHeight = e.height * 0.2;
            const shadowX = e.x + (e.width - shadowWidth) / 2;
            const shadowY = e.y + e.height - shadowHeight / 2;
            ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight);
        }
        if (e.damageTimer > 0 && Math.floor(e.damageTimer / 50) % 2 === 0) {
            return;
        }
        let enemyImage;
        if (e.type === 'macho') {
            enemyImage = resources.images.enemyMacho.asset.complete && resources.images.enemyMacho.asset.naturalWidth !== 0 ? resources.images.enemyMacho.asset : resources.images.enemy.asset;
        } else {
            enemyImage = resources.images.enemy.asset;
        }
        if (enemyImage && enemyImage.complete && enemyImage.naturalWidth !== 0) {
            const scaledWidth = e.type === 'macho' ? e.width : e.baseWidth * e.currentScale;
            const scaledHeight = e.type === 'macho' ? e.height : e.baseHeight * e.currentScale;
            const drawX = e.type === 'macho' ? e.x : e.x - (scaledWidth - e.baseWidth) / 2;
            const drawY = e.type === 'macho' ? e.y : e.y - (scaledHeight - e.baseHeight) / 2;
            if (e.type === 'macho' && e.state === 'aiming' && Math.floor(e.aimTimer / 100) % 2 === 0) {
                offscreenCanvas.width = scaledWidth;
                offscreenCanvas.height = scaledHeight;
                offscreenCtx.clearRect(0, 0, scaledWidth, scaledHeight);
                offscreenCtx.drawImage(enemyImage, 0, 0, scaledWidth, scaledHeight);
                offscreenCtx.globalCompositeOperation = 'source-atop';
                offscreenCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                offscreenCtx.fillRect(0, 0, scaledWidth, scaledHeight);
                offscreenCtx.globalCompositeOperation = 'source-over';
                ctx.drawImage(offscreenCanvas, drawX, drawY);
            } else {
                ctx.drawImage(enemyImage, drawX, drawY, scaledWidth, scaledHeight);
            }
        }
        if (e.type === 'macho') {
            drawMachoHpBar(e);
        }
    });
}
function drawRocks() {
    const rockImage = resources.images.rock.asset;
    if (!rockImage || !rockImage.complete) return;

    rocks.forEach(r => {
        ctx.save();
        ctx.translate(r.x + r.width / 2, r.y + r.height / 2);
        ctx.rotate(r.rotation);
        ctx.drawImage(rockImage, -r.width / 2, -r.height / 2, r.width, r.height);
        ctx.restore();
    });
}
function drawMachoHpBar(macho) { const barWidth = macho.width; const barHeight = 5; const barX = macho.x; const barY = macho.y - barHeight - 5; ctx.fillStyle = "gray"; ctx.fillRect(barX, barY, barWidth, barHeight); const hpRatio = macho.hp / macho.maxHp; ctx.fillStyle = hpRatio > 0.5 ? "#28a745" : hpRatio > 0.2 ? "#ffc107" : "#dc3545"; ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight); ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barWidth, barHeight); }
function drawItems() { hearts.forEach(h => ctx.drawImage(resources.images.heartItem.asset, h.x, h.y, h.width, h.height)); powerups.forEach(p => ctx.drawImage(p.image, p.x, p.y, p.width, p.height)); }
function drawEnemyBullets() { const enemyBulletImages = [resources.images.enemyBullet01.asset, resources.images.enemyBullet02.asset, resources.images.enemyBullet03.asset]; enemyBullets.forEach(b => { const currentImage = enemyBulletImages[b.frame]; if (currentImage && currentImage.complete) { ctx.drawImage(currentImage, b.x, b.y, b.width, b.height); } }); }
function drawBoss() {
    if (!isBossActive && !boss.isDefeated) {
        if (gameState === 'bossDefeatAnimation') {} 
        else { return; }
    }
    const bossImg = resources.images.bossStage4.asset.complete && resources.images.bossStage4.asset.naturalWidth > 0 ? resources.images.bossStage4.asset : null;
    const bossDmgImg = resources.images.bossStage4Damaged.asset.complete && resources.images.bossStage4Damaged.asset.naturalWidth > 0 ? resources.images.bossStage4Damaged.asset : bossImg;
    
    ctx.save();
    if (boss.isDefeated) {
        ctx.globalAlpha = boss.defeatAlpha;
        if (bossDmgImg) {
            const defeatWidth = bossDmgImg.naturalWidth * boss.defeatScale;
            const defeatHeight = bossDmgImg.naturalHeight * boss.defeatScale;
            const drawX = boss.x + (boss.width / 2) - (defeatWidth / 2);
            const drawY = boss.y + (boss.height / 2) - (defeatHeight / 2);
            ctx.drawImage(bossDmgImg, drawX, drawY, defeatWidth, defeatHeight);
        }
    } else {
        const shadowImage = resources.images.playerShadow.asset;
        if (shadowImage && shadowImage.complete) {
            let shadowScale = 1.0;
            let shadowY;
            
            let groundY;
            if (boss.state === 'jumping' || boss.state === 'aiming') {
                groundY = boss.jumpTargetY;
            } else {
                groundY = boss.y;
            }
            shadowY = groundY + boss.height - (boss.height * 0.2 * shadowScale) / 2 + 20;

            if (boss.state === 'jumping') {
                shadowScale = 1.0 + 0.5 * Math.sin(boss.jumpProgress * Math.PI);
            }
            
            const shadowWidth = boss.width * 0.8 * shadowScale;
            const shadowHeight = boss.height * 0.2 * shadowScale;
            const shadowX = boss.x + (boss.width - shadowWidth) / 2;
            
            ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight);
        }
        
        const bossImage = boss.isDamagedState ? bossDmgImg : bossImg;
        if (bossImage) {
            const aspectRatio = bossImage.naturalWidth / bossImage.naturalHeight;
            let drawScale = 1.0;
            if (boss.state === 'jumping') {
                drawScale = 1.0 + 0.3 * Math.sin(boss.jumpProgress * Math.PI);
            }
            const finalWidth = boss.width * drawScale;
            const finalHeight = finalWidth / aspectRatio;

            const drawX = boss.x + (boss.width - finalWidth) / 2;
            const drawY = boss.y + (boss.height - finalHeight) / 2;

            if (boss.state === 'aiming' && Math.floor(boss.aimTimer / 100) % 2 === 0) {
                offscreenCanvas.width = finalWidth;
                offscreenCanvas.height = finalHeight;
                offscreenCtx.clearRect(0, 0, finalWidth, finalHeight);
                offscreenCtx.drawImage(bossImage, 0, 0, finalWidth, finalHeight);
                offscreenCtx.globalCompositeOperation = 'source-atop';
                offscreenCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                offscreenCtx.fillRect(0, 0, finalWidth, finalHeight);
                offscreenCtx.globalCompositeOperation = 'source-over';
                ctx.drawImage(offscreenCanvas, drawX, drawY);
            } else {
                ctx.drawImage(bossImage, drawX, drawY, finalWidth, finalHeight);
            }
        }
        
        if(boss.state !== 'jumping'){
            ctx.fillStyle = "gray";
            ctx.fillRect(boss.x, boss.y - 15, boss.width, 10);
            const gradient = ctx.createLinearGradient(boss.x, 0, boss.x + boss.width, 0);
            gradient.addColorStop(0, "#8A2BE2");
            gradient.addColorStop(1, "#DA70D6");
            ctx.fillStyle = gradient;
            ctx.fillRect(boss.x, boss.y - 15, boss.width * (boss.hp / boss.maxHp), 10);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x, boss.y - 15, boss.width, 10);
        }
    }
    ctx.restore();
}
function drawBossExplosionParticles() { for (const p of bossExplosionParticles) { ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
function drawUI() { ctx.fillStyle = '#6A0DAD'; ctx.font = '20px "M PLUS Rounded 1c"'; ctx.textAlign = 'right'; ctx.lineWidth = 4; ctx.strokeStyle = 'white'; const scoreText = `スコア: ${score}`; ctx.strokeText(scoreText, canvas.width - 10, 30); ctx.fillText(scoreText, canvas.width - 10, 30); const heartImage = resources.images.heart.asset; for (let i = 0; i < player.lives; i++) { if (heartImage.complete) { ctx.drawImage(heartImage, 70 + (30 + 5) * i, 20, 30, 30); } } const faceDecorationImage = resources.images.playerFaceDecoration.asset; if (faceDecorationImage && faceDecorationImage.complete) { ctx.drawImage(faceDecorationImage, 10, 20, faceDecorationImage.width, faceDecorationImage.height); } }
function drawLoadingScreen() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Now Loading...', canvas.width / 2, canvas.height / 2); }
function drawReadyScreen() { drawPlayingScreen(0); ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '48px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.fillText('STAGE 4', canvas.width / 2, canvas.height / 2 - 40); ctx.font = '30px "M PLUS Rounded 1c"'; if (Math.floor(Date.now() / 500) % 2 === 0) { ctx.fillText('クリックしてスタート', canvas.width / 2, canvas.height / 2 + 30); } }
function drawBossWarningScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height); if (Math.floor(bossWarningTimer / 300) % 2 === 0) { ctx.save(); ctx.font = 'bold 80px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const text = 'ボスせっきんちゅう！'; const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0); gradient.addColorStop(0, '#FFD700'); gradient.addColorStop(0.5, '#FF69B4'); gradient.addColorStop(1, '#FFD700'); ctx.fillStyle = gradient; ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 15; ctx.fillText(text, canvas.width / 2, canvas.height / 2); ctx.restore(); } }
function drawGameOverScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '48px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50); ctx.font = '30px "M PLUS Rounded 1c"'; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2); clearScreenButtonsContainer.style.display = 'block'; retryButton.style.display = 'block'; if (nextStageButton) { nextStageButton.style.display = 'none'; } retryButton.textContent = "もう一度プレイする"; }
function drawStageClearScreen() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4B0082');
    gradient.addColorStop(1, '#DA70D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTitleParticles();

    ctx.fillStyle = 'white';
    ctx.font = '48px "Yusei Magic"';
    ctx.textAlign = 'center';
    ctx.fillText('ステージ4 クリア！', canvas.width / 2, canvas.height / 2 - 80);
    ctx.font = '30px "M PLUS Rounded 1c"';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);

    soundToggleButton.style.display = 'none';
    clearScreenButtonsContainer.style.display = 'block';
    retryButton.style.display = 'block';
    if (nextStageButton) {
        nextStageButton.style.display = 'block';
    }
}
function createTitleParticle() { titleParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.5, speed: Math.random() * 0.3 + 0.1, direction: Math.random() * Math.PI * 2 }); }
function updateTitleParticles() { for (let i = titleParticles.length - 1; i >= 0; i--) { const p = titleParticles[i]; p.x += Math.cos(p.direction) * p.speed; p.y += Math.sin(p.direction) * p.speed; p.alpha -= 0.005; if (p.alpha <= 0) titleParticles.splice(i, 1); } while (titleParticles.length < MAX_TITLE_PARTICLES) createTitleParticle(); }
function drawTitleParticles() { for (const p of titleParticles) { ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } }

// --- イベントリスナー ---
function handleUserInteraction() { if (!hasUserInteracted) { hasUserInteracted = true; setAllAudioMute(!isSoundOn); } }
document.addEventListener('keydown', (e) => { keys[e.code] = true; handleUserInteraction(); if (gameState === 'ready') { startGame(); } });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
document.addEventListener('click', () => { handleUserInteraction(); if (gameState === 'ready') { startGame(); } });
retryButton.addEventListener('click', () => {
    if (gameState === 'gameover' || gameState === 'stageClear') {
        clearScreenButtonsContainer.style.display = 'none';
        resetGame();
        gameState = 'ready';
    }
});
soundToggleButton.addEventListener('click', () => { isSoundOn = !isSoundOn; setAllAudioMute(!isSoundOn); soundToggleButton.textContent = isSoundOn ? '♪ ON' : '♪ OFF'; if (currentBGM) { if (isSoundOn) currentBGM.play().catch(e => console.error(e.name, e.message)); else currentBGM.pause(); } soundToggleButton.blur(); });

loadResources(() => {
    resetGame();
    gameState = 'ready';
    for (let i = 0; i < MAX_TITLE_PARTICLES; i++) createTitleParticle();
    
    function goToNextStage() {
        window.location.href = 'shooting5.html';
    }

    if (nextStageButton) {
        nextStageButton.addEventListener('click', () => {
            if (gameState === 'stageClear') {
                clearScreenButtonsContainer.style.display = 'none';
                soundToggleButton.style.display = 'none';
                canvas.style.display = 'none';

                if (videoContainer) {
                    finalStageIntroVideo.muted = !isSoundOn;
                    videoContainer.style.display = 'block';
                    finalStageIntroVideo.load();
                    finalStageIntroVideo.play();
                } else {
                    goToNextStage();
                }
            }
        });
    }

    if (finalStageIntroVideo) {
        finalStageIntroVideo.addEventListener('ended', goToNextStage);
    }
    if (skipButton) {
        skipButton.addEventListener('click', () => {
            if (videoContainer && videoContainer.style.display === 'block') {
                finalStageIntroVideo.pause();
                goToNextStage();
            }
        });
    }

    requestAnimationFrame(gameLoop);
});