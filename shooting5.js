'use strict';

// --- グローバル変数と定数 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundToggleButton = document.getElementById('soundToggleButton');
const clearScreenButtonsContainer = document.getElementById('clearScreenButtons');
const retryButton = document.getElementById('retryButton');
const videoContainer = document.getElementById('videoContainer');
const endingVideo = document.getElementById('endingVideo');
const skipButton = document.getElementById('skipButton');

const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// ステージ5用の設定
const PLAYER_SPEED = 3;
const PLAYER_FIRE_RATE = 450;
const BULLET_SPEED = 4;
const HEART_ITEM_SPAWN_INTERVAL = 8000;
const POWERUP_SPAWN_INTERVAL = 12000;
const TILT_ANGLE = 5 * Math.PI / 180;
const MAX_TITLE_PARTICLES = 150;
const ROCK_FALL_SPEED = 8;
const TRANSITION_FADE_SPEED = 0.05;
const BOSS_DEFEAT_DURATION = 2000;
const FINAL_BOSS_DEFEAT_WAIT = 5000;

// ゲームの状態
let gameState = 'loading';
let score = 0;
let lastTime = 0;
let isSoundOn = true;
let hasUserInteracted = false;
let gameStartTime = 0;
let bossRushState = 0;
let intervalTimer = 0;
let bossDefeatTimer = 0;
let warningBlinkTimer = 0;
let finalBossDefeatTimer = 0;
let gameLoopId = null; 

let shakeIntensity = 0;
let shakeDuration = 0;

let transitionAlpha = 0;
let transitionState = 'fadingOut';
let flashAlpha = 0;

// エンティティ
const player = {}; const bullets = []; const enemies = []; const hearts = []; const powerups = []; const enemyBullets = []; const bossExplosionParticles = []; const boss = {}; const effects = [];
const rocks = []; 
const titleParticles = [];
const background = { y1: 0, y2: -canvas.height, speed: 1, currentImage: null };
const keys = {};
let lastHeartSpawnTime = 0, lastPowerupSpawnTime = 0;

// --- リソース管理 ---
const resources = {
    images: {
        backgroundS1: { src: 'images/background/background5_1.png', asset: new Image() },
        backgroundS2: { src: 'images/background/background5_2.png', asset: new Image() },
        backgroundS3: { src: 'images/background/background5_3.png', asset: new Image() },
        backgroundS4: { src: 'images/background/background5_4.png', asset: new Image() },
        backgroundS5: { src: 'images/background/background5_5.png', asset: new Image() },
        backgroundS5_B: { src: 'images/background/background5_5B.png', asset: new Image() },
        player1: { src: 'images/player/player_1.png', asset: new Image() },
        player2: { src: 'images/player/player_2.png', asset: new Image() },
        player3: { src: 'images/player/player_3.png', asset: new Image() },
        playerDamaged: { src: 'images/player/player_damaged.png', asset: new Image() },
        playerShadow: { src: 'images/player/player_shadow.png', asset: new Image() },
        playerFaceDecoration: { src: 'images/player/player_face_decoration.png', asset: new Image() },
        rock: { src: 'images/enemy/rock.png', asset: new Image() },
        bullet01: { src: 'images/bullet/bullet_01.png', asset: new Image() },
        bullet02: { src: 'images/bullet/bullet_02.png', asset: new Image() },
        bullet03: { src: 'images/bullet/bullet_03.png', asset: new Image() },
        bullet_p01: { src: 'images/bullet/bullet_P01.png', asset: new Image() },
        bullet_p02: { src: 'images/bullet/bullet_P02.png', asset: new Image() },
        bullet_p03: { src: 'images/bullet/bullet_P03.png', asset: new Image() },
        enemyBullet01: { src: 'images/bullet/enemy_bullet_01.png', asset: new Image() },
        enemyBullet02: { src: 'images/bullet/enemy_bullet_02.png', asset: new Image() },
        enemyBullet03: { src: 'images/bullet/enemy_bullet_03.png', asset: new Image() },
        heart: { src: 'images/heart.png', asset: new Image() },
        heartItem: { src: 'images/heart_item.png', asset: new Image() },
        powerupThreeWay: { src: 'images/powerup_threeway.png', asset: new Image() },
        powerupSpeed: { src: 'images/powerup_speed.png', asset: new Image() },
        bossS1: { src: 'images/boss/boss.png', asset: new Image() },
        bossS1Damaged: { src: 'images/boss/boss_damaged.png', asset: new Image() },
        bossS2_1: { src: 'images/boss/boss_stage2_1.png', asset: new Image() },
        bossS2_2: { src: 'images/boss/boss_stage2_2.png', asset: new Image() },
        bossS2_damaged_1: { src: 'images/boss/boss_stage2_damaged_1.png', asset: new Image() },
        bossS2_damaged_2: { src: 'images/boss/boss_stage2_damaged_2.png', asset: new Image() },
        bossS2_hide1: { src: 'images/boss/boss_stage2_hide1.png', asset: new Image() },
        bossS2_hide2: { src: 'images/boss/boss_stage2_hide2.png', asset: new Image() },
        bossS3: { src: 'images/boss/boss_stage3.png', asset: new Image() },
        bossS3Damaged: { src: 'images/boss/boss_stage3_damaged.png', asset: new Image() },
        bossS4: { src: 'images/boss/boss_stage4.png', asset: new Image() },
        bossS4Damaged: { src: 'images/boss/boss_stage4_damaged.png', asset: new Image() },
        finalBoss: { src: 'images/boss/final_boss.png', asset: new Image() },
        finalBossDamaged: { src: 'images/boss/final_boss_damaged.png', asset: new Image() },
        sonicBoom1: { src: 'images/bullet/sonic_boom_1.png', asset: new Image() },
        sonicBoom2: { src: 'images/bullet/sonic_boom_2.png', asset: new Image() },
        sonicBoom3: { src: 'images/bullet/sonic_boom_3.png', asset: new Image() },
        electric1: { src: 'images/effect/electric_1.png', asset: new Image() },
        electric2: { src: 'images/effect/electric_2.png', asset: new Image() },
        electric3: { src: 'images/effect/electric_3.png', asset: new Image() },
    },
    sounds: {
        playBGM: { src: 'sounds/stage5_bossrush.mp3', asset: new Audio() },
        finalBossBGM: { src: 'sounds/stage5_finalboss.mp3', asset: new Audio() },
        gameClear: { src: 'sounds/gameclear.mp3', asset: new Audio() },
        gameEnding: { src: 'sounds/game_ending.mp3', asset: new Audio() }, 
        gameoverBGM: { src: 'sounds/gameover.mp3', asset: new Audio() },
        fire: { src: 'sounds/fire.mp3', asset: new Audio() },
        enemyHit: { src: 'sounds/enemy-hit.mp3', asset: new Audio() },
        itemGet: { src: 'sounds/item-get.mp3', asset: new Audio() },
        playerHit: { src: 'sounds/player-hit.mp3', asset: new Audio() },
        gameStart: { src: 'sounds/start.mp3', asset: new Audio() },
        bossLand: { src: 'sounds/enemy-hit.mp3', asset: new Audio() },
        bossDefeat: { src: 'sounds/boss_defeat.mp3', asset: new Audio() },
        sonicBoom: { src: 'sounds/sonic_boom.mp3', asset: new Audio() },
        electric: { src: 'sounds/electric.mp3', asset: new Audio() },
    }
};

// --- 音声制御 ---
let currentBGM = null; let fadeInterval = null; function playAudio(audio, loop = false, isBGM = false, volume = 1.0) { if (!isSoundOn) return; if (isBGM) { if (currentBGM) { if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; } currentBGM.pause(); currentBGM.currentTime = 0; } currentBGM = audio; } audio.loop = loop; if (!loop) { audio.currentTime = 0; } audio.volume = volume; audio.play().catch(e => console.error("Audio play failed.", e.name, e.message)); }
function fadeOutBGM(audio, duration, callback) { if (!audio || audio.paused || !isSoundOn) { if (callback) callback(); return; } const initialVolume = audio.volume; const steps = 50; const stepTime = duration / steps; let currentStep = 0; if (fadeInterval) { clearInterval(fadeInterval); } fadeInterval = setInterval(() => { currentStep++; if (currentStep >= steps) { audio.volume = 0; audio.pause(); audio.currentTime = 0; clearInterval(fadeInterval); fadeInterval = null; if (callback) callback(); } else { audio.volume = initialVolume * (1 - (currentStep / steps)); } }, stepTime); }
function stopBGM() { if (currentBGM) { if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null; } currentBGM.pause(); currentBGM.currentTime = 0; currentBGM = null; } }
function setAllAudioMute(mute) { for (const key in resources.sounds) { resources.sounds[key].asset.muted = mute; } if (currentBGM) { currentBGM.muted = mute; } }

// --- 初期化・開始処理 ---
function resetGame() { const playerImage = resources.images.player1.asset; Object.assign(player, { width: playerImage.width * 0.2, height: playerImage.height * 0.2, x: canvas.width / 2 - (playerImage.width * 0.2) / 2, y: canvas.height - (playerImage.height * 0.2) - 20, speed: PLAYER_SPEED, baseSpeed: PLAYER_SPEED, dx: 0, dy: 0, fireRate: PLAYER_FIRE_RATE, lastBulletTime: 0, lives: 5, shotLevel: 1, speedLevel: 1, isDamaged: false, damageTimer: 0, animationFrame: 0, animationTimer: 0, animationDirection: 1, isSuperShot: false }); player.speed = player.baseSpeed + (player.speedLevel * 0.5); score = 0; bullets.length = 0; enemies.length = 0; hearts.length = 0; powerups.length = 0; enemyBullets.length = 0; 
    rocks.length = 0;
    effects.length = 0;
    bossRushState = 0;
    Object.assign(boss, {});
    bossExplosionParticles.length = 0; background.y1 = 0; background.y2 = -canvas.height; lastTime = 0; 
    shakeIntensity = 0; shakeDuration = 0;
    titleParticles.length = 0;
    transitionAlpha = 0;
    flashAlpha = 0;
    background.currentImage = resources.images.backgroundS1.asset;
}
function startGame() { 
    resetGame(); 
    playAudio(resources.sounds.gameStart.asset); 
    gameState = 'playing'; 
    gameStartTime = performance.now();
    setupNextBoss();
}
function loadResources(callback) { const allRes = [...Object.values(resources.images), ...Object.values(resources.sounds)]; let loadedCount = 0; if (allRes.length === 0) { callback(); return; } function onResourceLoaded(e) { if (e && e.type === 'error') { console.error(`Failed to load resource: ${this.src || e.target.src}`); } loadedCount++; if (loadedCount === allRes.length) { console.log("All resources finished loading."); callback(); } } Object.values(resources.images).forEach(res => { res.asset.onload = onResourceLoaded; res.asset.onerror = onResourceLoaded; res.asset.src = res.src; }); Object.values(resources.sounds).forEach(res => { res.asset.addEventListener('canplaythrough', onResourceLoaded, { once: true }); res.asset.onerror = onResourceLoaded; res.asset.src = res.src; }); }

// --- ボスラッシュ管理 ---
function setupNextBoss() {
    bossRushState++;
    enemyBullets.length = 0;
    effects.length = 0;
    
    const baseBoss = {
        isDefeated: false, isDamagedState: false, defeatAlpha: 1.0, defeatScale: 1.0,
        y: -200, dy: 0.5, state: 'entering', animationFrame: 0, animationTimer: 0
    };

    switch(bossRushState) {
        case 1:
            console.log("Boss 1 Start!");
            background.currentImage = resources.images.backgroundS1.asset;
            playAudio(resources.sounds.playBGM.asset, true, true);
            Object.assign(boss, baseBoss, { type: 'S1', hp: 800, maxHp: 800, width: 200, height: 200, x: canvas.width/2 - 100, targetY: 50, speed: 0.5, dx: 1, lastBulletTime: 0, bulletRate: 6000, currentScale: 1.0, scaleDirection: 1 });
            break;
        case 2:
            console.log("Boss 2 Start!");
            background.currentImage = resources.images.backgroundS2.asset;
            Object.assign(boss, baseBoss, { type: 'S2', hp: 1500, maxHp: 1500, width: 200, height: 200, x: canvas.width/2 - 100, targetY: 50, speed: 0.8, dx: 1, lastBulletTime: 0, bulletRate: 6000, currentScale: 1.0, scaleDirection: 1, 
                hidingState: 'none', hideInterval: 8000, lastHideTime: 0, hidingTimer: 0,
            });
            break;
        case 3:
            console.log("Boss 3 Start!");
            background.currentImage = resources.images.backgroundS3.asset;
            Object.assign(boss, baseBoss, { type: 'S3', hp: 2500, maxHp: 2500, width: 250, height: 250, x: canvas.width/2 - 125, targetY: 50, speed: 1.0, dx: 1, lastBulletTime: 0, bulletRate: 6000,
                dashSpeed: 12, returnSpeed: 1, lastDashTime: 0, dashInterval: 5333, aimTimer: 0, dashTargetX: 0,
            });
            break;
        case 4:
            console.log("Boss 4 Start!");
            background.currentImage = resources.images.backgroundS4.asset;
            Object.assign(boss, baseBoss, { type: 'S4', hp: 3400, maxHp: 3400, width: 250, height: 250, x: canvas.width/2 - 125, targetY: 50, speed: 1.2, dx: 1, lastBulletTime: 0, bulletRate: 4000, jumpHeight: -400, jumpProgress: 0, jumpStartX: 0, jumpStartY: 0, jumpTargetX: 0, jumpTargetY: 0, lastJumpTime: 0, jumpInterval: 4000, aimTimer: 0, });
            break;
        case 5:
            console.log("Interval Start!");
            boss.isDefeated = true;
            intervalTimer = 8000; 
            warningBlinkTimer = intervalTimer;
            fadeOutBGM(currentBGM, 4000); 
            for(let i=0; i<3; i++) hearts.push({ x: canvas.width/2 - 50 + i*50, y: -30, width: 30, height: 30, speed: 1 });
            for(let i=0; i<2; i++) powerups.push({ x: canvas.width/2 - 25 + i*50, y: -80, width: 30, height: 30, speed: 1, type: 'threeWay', image: resources.images.powerupThreeWay.asset });
            break;
        case 6:
             console.log("Final Boss Start!");
             background.currentImage = resources.images.backgroundS5.asset;
             playAudio(resources.sounds.finalBossBGM.asset, true, true);
             Object.assign(boss, baseBoss, { 
                type: 'Final', 
                hp: 24000, maxHp: 24000, 
                width: 560, height: 560, x: canvas.width/2 - 280, 
                targetY: 20, 
                speed: 0, dx: 0, lastBulletTime: 0, bulletRate: 2000,
                attackPattern: 0,
                lastAttackTime: 0,
                attackInterval: 3000,
                aimTimer: 0,
                isAimingWhite: false,
                currentScale: 1.0,
                scaleDirection: 1,
                sonicBoomCount: 0,
                sonicBoomInterval: null,
             });
            break;
        default:
            window.location.href = 'end.html';
            break;
    }
}


// --- メインゲームループ ---
function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = currentTime - lastTime;
    update(deltaTime, currentTime);
    draw(deltaTime);
    lastTime = currentTime;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- 更新処理 ---
function update(deltaTime, currentTime) {
    if (shakeDuration > 0) { shakeDuration -= deltaTime; if (shakeDuration <= 0) shakeIntensity = 0; }

    switch (gameState) {
        case 'playing': updatePlayingState(deltaTime, currentTime); break;
        case 'bossDefeatSequence': updateBossDefeatSequence(deltaTime); break;
        case 'stageTransition': updateStageTransition(deltaTime); break;
        case 'finalBossDefeated': updateFinalBossDefeated(deltaTime); break;
        case 'clear': updateTitleParticles(); break;
        case 'gameover': break;
    }
}

function updatePlayingState(deltaTime, currentTime) { 
    if (bossRushState !== 6) {
        updateBackground(); 
    }
    updatePlayer(currentTime); 
    updateEntities(deltaTime); 
    updateRocks(deltaTime);
    updateBossExplosion();
    
    if (bossRushState === 5) {
        intervalTimer -= deltaTime;
        warningBlinkTimer -= deltaTime;
        if (intervalTimer <= 0) {
            gameState = 'stageTransition';
            transitionState = 'fadingOut';
        }
    } else if (!boss.isDefeated) {
        updateBoss(deltaTime, currentTime);
    }
    spawnItems(currentTime); 
    checkCollisions(); 
}

function updateBossDefeatSequence(deltaTime) {
    if (bossRushState !== 6) updateBackground();
    updatePlayer(deltaTime);
    updateEntities(deltaTime);
    updateRocks(deltaTime);
    updateBossExplosion();
    
    boss.defeatAlpha -= 0.05;
    if(boss.defeatAlpha < 0) boss.defeatAlpha = 0;

    bossDefeatTimer -= deltaTime;
    if (bossDefeatTimer <= 0) {
        bossExplosionParticles.length = 0;
        if (bossRushState >= 6) {
             gameState = 'finalBossDefeated';
             finalBossDefeatTimer = FINAL_BOSS_DEFEAT_WAIT;
        } else {
            gameState = 'stageTransition';
            transitionState = 'fadingOut';
        }
    }
}

function updateFinalBossDefeated(deltaTime) {
    updateBossExplosion(); 
    finalBossDefeatTimer -= deltaTime;
    if (finalBossDefeatTimer <= 0) {
        window.location.href = 'end.html';
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
    }
}


function updateStageTransition(deltaTime) {
    if (transitionState === 'fadingOut') {
        transitionAlpha += TRANSITION_FADE_SPEED;
        if (transitionAlpha >= 1.0) {
            transitionAlpha = 1.0;
            setupNextBoss(); 
            transitionState = 'fadingIn';
        }
    } else if (transitionState === 'fadingIn') {
        transitionAlpha -= TRANSITION_FADE_SPEED;
        if (transitionAlpha <= 0) {
            transitionAlpha = 0;
            gameState = 'playing';
        }
    }
}

function updateBoss(deltaTime, currentTime) {
    if (boss.isDefeated) return;

    if (boss.hp <= 0) {
        boss.isDefeated = true;
        gameState = 'bossDefeatSequence';
        bossDefeatTimer = BOSS_DEFEAT_DURATION;
        score += 5000 * bossRushState;
        
        playAudio(resources.sounds.bossDefeat.asset, false, false, 0.8);

        if (boss.type === 'Final') {
            fadeOutBGM(currentBGM, 1500, () => {
                playAudio(resources.sounds.gameClear.asset, true, true);
            });
            if(boss.sonicBoomInterval) clearInterval(boss.sonicBoomInterval);
        }

        for(let i = 0; i < 50; i++) {
            bossExplosionParticles.push({
                x: boss.x + boss.width / 2, y: boss.y + boss.height / 2,
                size: Math.random() * 10 + 5, alpha: 1.0,
                speed: Math.random() * 4 + 2, direction: Math.random() * Math.PI * 2,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
            });
        }
        return;
    }

    if (boss.hp <= boss.maxHp / 3 && !boss.isDamagedState) boss.isDamagedState = true;
    
    if(boss.state === 'entering') {
        boss.y += boss.dy; 
        if (boss.y >= boss.targetY) { 
            boss.y = boss.targetY; 
            boss.state = 'active'; 
            boss.lastDashTime = currentTime;
            boss.lastJumpTime = currentTime;
            boss.lastHideTime = currentTime;
            boss.lastAttackTime = currentTime;
        }
        return;
    }
    
    switch (boss.type) {
        case 'S1': updateBoss_S1(deltaTime, currentTime); break;
        case 'S2': updateBoss_S2(deltaTime, currentTime); break;
        case 'S3': updateBoss_S3(deltaTime, currentTime); break;
        case 'S4': updateBoss_S4(deltaTime, currentTime); break;
        case 'Final': updateBoss_Final(deltaTime, currentTime); break;
    }
}

function updateBoss_S1(deltaTime, currentTime) {
    boss.x += boss.speed * boss.dx; 
    if (boss.x + boss.width > canvas.width || boss.x < 0) boss.dx *= -1;
    
    const scaleSpeed = 0.0002;
    boss.currentScale += boss.scaleDirection * scaleSpeed * deltaTime;
    if (boss.scaleDirection === 1 && boss.currentScale >= 1.05) {
        boss.currentScale = 1.05; boss.scaleDirection = -1;
    } else if (boss.scaleDirection === -1 && boss.currentScale <= 0.95) {
        boss.currentScale = 0.95; boss.scaleDirection = 1;
    }

    if(currentTime - boss.lastBulletTime > boss.bulletRate) {
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const bulletY = boss.y + boss.height - 40;
        for(let i=0; i<2; i++) {
            const bulletX = boss.x + (boss.width * (i*2+1)/4);
            let angle = Math.atan2(targetY - bulletY, targetX - bulletX);
            enemyBullets.push({ x: bulletX - 15, y: bulletY, width: 30, height: 30, speed: 3, dx: Math.cos(angle) * 3, dy: Math.sin(angle) * 3, frame: 0, animationTimer: 0, });
        }
        boss.lastBulletTime = currentTime;
    }
}

function updateBoss_S2(deltaTime, currentTime) {
    boss.animationTimer += deltaTime;
    if (boss.animationTimer > 200) {
        boss.animationFrame = (boss.animationFrame + 1) % 2;
        boss.animationTimer = 0;
    }
    
    if (boss.hidingState === 'none' && currentTime - boss.lastHideTime > boss.hideInterval) {
        boss.hidingState = 'starting';
        boss.hidingTimer = 400;
        boss.lastHideTime = currentTime;
        const bulletCount = 12; const bulletSpeed = 3.5;
        const bulletX = boss.x + boss.width / 2; const bulletY = boss.y + boss.height / 2 + 40;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            enemyBullets.push({ x: bulletX - 15, y: bulletY - 15, width: 30, height: 30, speed: bulletSpeed, dx: Math.cos(angle) * bulletSpeed, dy: Math.sin(angle) * bulletSpeed, frame: 0, animationTimer: 0 });
        }
    }

    if (boss.hidingState !== 'none' && boss.state === 'active') {
        boss.hidingTimer -= deltaTime;
        switch (boss.hidingState) {
            case 'starting':
                if (boss.hidingTimer <= 0) { boss.hidingState = 'hidden'; boss.hidingTimer = 3000; }
                break;
            case 'hidden':
                if (boss.hidingTimer <= 0) { boss.hidingState = 'ending'; boss.hidingTimer = 400; }
                break;
            case 'ending':
                if (boss.hidingTimer <= 0) { boss.hidingState = 'none'; }
                break;
        }
        return;
    }

    const margin = 100;
    boss.x += boss.speed * boss.dx; 
    
    if (boss.x + boss.width > canvas.width - margin || boss.x < margin) {
        boss.dx *= -1;
    }
    
    if(currentTime - boss.lastBulletTime > boss.bulletRate) {
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const bulletY = boss.y + boss.height * 0.7;
        for(let i=0; i<2; i++) {
            const bulletX = boss.x + (boss.width * (i*2+1)/4);
            let angle = Math.atan2(targetY - bulletY, targetX - bulletX);
            enemyBullets.push({ x: bulletX - 15, y: bulletY, width: 30, height: 30, speed: 4, dx: Math.cos(angle) * 4, dy: Math.sin(angle) * 4, frame: 0, animationTimer: 0, });
        }
        boss.lastBulletTime = currentTime;
    }
}

function updateBoss_S3(deltaTime, currentTime) {
    switch (boss.state) {
        case 'active':
            boss.x += boss.speed * boss.dx; 
            if (boss.x + boss.width > canvas.width || boss.x < 0) boss.dx *= -1; 
            
            if (currentTime - boss.lastBulletTime > boss.bulletRate) {
                const targetX = player.x + player.width / 2;
                const targetY = player.y + player.height / 2;
                const bulletY = boss.y + boss.height - 40;
                for(let i=0; i<2; i++) {
                    const bulletX = boss.x + (boss.width * (i*2+1)/4);
                    let angle = Math.atan2(targetY - bulletY, targetX - bulletX);
                    enemyBullets.push({ x: bulletX - 15, y: bulletY, width: 30, height: 30, speed: 4, dx: Math.cos(angle) * 4, dy: Math.sin(angle) * 4, frame: 0, animationTimer: 0, });
                }
                boss.lastBulletTime = currentTime;
            }

            if (currentTime - boss.lastDashTime > boss.dashInterval) { 
                boss.state = 'aiming'; 
                boss.aimTimer = 1000; 
                boss.dashTargetX = player.x + player.width / 2 - boss.width / 2;
            }
            break;
        case 'aiming': 
            boss.aimTimer -= deltaTime; 
            if (boss.aimTimer <= 0) boss.state = 'dashing'; 
            break;
        case 'dashing': 
            boss.y += boss.dashSpeed; 
            if (boss.y > canvas.height) { 
                boss.state = 'returning'; 
                boss.y = -boss.height; 
                boss.x = Math.random() * (canvas.width - boss.width); 
            } 
            break;
        case 'returning': 
            boss.y += boss.returnSpeed; 
            if (boss.y >= boss.targetY) { 
                boss.y = boss.targetY; 
                boss.state = 'active'; 
                boss.lastDashTime = currentTime; 
            } 
            break;
    }
}

function updateBoss_S4(deltaTime, currentTime) {
     switch (boss.state) {
        case 'active':
            boss.x += boss.speed * boss.dx; 
            if (boss.x + boss.width > canvas.width || boss.x < 0) boss.dx *= -1; 
            if (currentTime - boss.lastBulletTime > boss.bulletRate) { 
                fireBossBulletsS4(); 
                boss.lastBulletTime = currentTime; 
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
            boss.state = 'active'; 
            boss.lastJumpTime = currentTime; 
            break;
    }
}

function updateBoss_Final(deltaTime, currentTime) {
    boss.currentScale += boss.scaleDirection * 0.0001;
    if (boss.currentScale > 1.05) boss.scaleDirection = -1;
    if (boss.currentScale < 0.95) boss.scaleDirection = 1;

    if (boss.state === 'aiming') {
        boss.aimTimer -= deltaTime;
        if (boss.aimTimer <= 0) {
            switch (boss.attackPattern) {
                case 1: 
                    boss.sonicBoomCount = 0;
                    if(boss.sonicBoomInterval) clearInterval(boss.sonicBoomInterval);
                    fireSonicBoom();
                    boss.sonicBoomInterval = setInterval(fireSonicBoom, 500);
                    break;
                case 2: 
                    spawnElectricAttacks(3); 
                    break;
            }
            boss.state = 'active';
            boss.isAimingWhite = false;
        }
        return;
    }

    if (currentTime - boss.lastAttackTime > boss.attackInterval) {
        boss.attackPattern = Math.floor(Math.random() * 4);
        boss.lastAttackTime = currentTime;

        switch(boss.attackPattern) {
            case 0:
                fireBossBulletsS4();
                boss.attackInterval = 1500;
                break;
            case 1:
                boss.state = 'aiming';
                boss.aimTimer = 500;
                boss.attackInterval = 4000;
                boss.isAimingWhite = false;
                break;
            case 2:
                boss.state = 'aiming';
                boss.aimTimer = 800;
                boss.attackInterval = 4000;
                boss.isAimingWhite = true;
                break;
            case 3:
                fireAllDirectionalBullets();
                boss.attackInterval = 2000;
                break;
        }
    }
}

function fireSonicBoom() {
    if (boss.sonicBoomCount >= 3) {
        if (boss.sonicBoomInterval) clearInterval(boss.sonicBoomInterval);
        boss.sonicBoomInterval = null;
        return;
    }
    boss.sonicBoomCount++;
    playAudio(resources.sounds.sonicBoom.asset, false, false, 0.6);
    
    const boom_x = boss.x + boss.width / 2;
    const boom_y = boss.y + boss.height * 0.3;
    const angle = Math.atan2(player.y - boom_y, player.x - boom_x);
    
    effects.push({
        type: 'sonicBoom',
        x: boom_x, y: boom_y,
        dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5,
        scale: 1.0, rotation: angle,
        frame: 0, animationTimer: 0,
    });
}

function spawnElectricAttacks(count) {
    playAudio(resources.sounds.electric.asset, false, false, 0.5);
    flashAlpha = 0.35;
    for(let i = 0; i < count; i++) {
        effects.push({
            type: 'electric',
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height / 3) + (canvas.height * 2 / 3),
            width: 150, height: 150,
            scale: 1.0, alpha: 1.0,
            frame: 0, animationTimer: 0,
            lifetime: 5000,
        });
    }
}

function fireAllDirectionalBullets() {
    const bulletCount = 15;
    const bulletSpeed = 4;
    const bulletX = boss.x + boss.width / 2;
    const bulletY = boss.y + boss.height * 0.4;

    for (let i = 0; i < bulletCount; i++) {
        const angle = (i / bulletCount) * Math.PI * 2 + Math.random() * 0.1;
        enemyBullets.push({
            x: bulletX - 15, y: bulletY - 15, width: 30, height: 30,
            speed: bulletSpeed,
            dx: Math.cos(angle) * bulletSpeed,
            dy: Math.sin(angle) * bulletSpeed,
            frame: 0, animationTimer: 0
        });
    }
}

function fireBossBulletsS4() { 
    const targetX = player.x + player.width / 2; const targetY = player.y + player.height / 2; 
    const bulletY = (boss.type === 'Final') ? (boss.y + boss.height * 0.4) : (boss.y + boss.height - 40);
    const bulletXCenter = boss.x + boss.width / 2;
    let angleCenter = Math.atan2(targetY - bulletY, targetX - bulletXCenter); 
    enemyBullets.push({ x: bulletXCenter - 15, y: bulletY, width: 30, height: 30, speed: 5, dx: Math.cos(angleCenter) * 5, dy: Math.sin(angleCenter) * 5, frame: 0, animationTimer: 0, }); 
    const angleOffset = 20 * Math.PI / 180;
    const bulletXLeft = boss.x + boss.width / 4;
    const bulletXRight = boss.x + boss.width * 3 / 4;
    enemyBullets.push({ x: bulletXLeft - 15, y: bulletY, width: 30, height: 30, speed: 5, dx: Math.cos(angleCenter - angleOffset) * 5, dy: Math.sin(angleCenter - angleOffset) * 5, frame: 0, animationTimer: 0, }); 
    enemyBullets.push({ x: bulletXRight - 15, y: bulletY, width: 30, height: 30, speed: 5, dx: Math.cos(angleCenter + angleOffset) * 5, dy: Math.sin(angleCenter + angleOffset) * 5, frame: 0, animationTimer: 0, }); 
}

function updateBossExplosion() {
    for (let i = bossExplosionParticles.length - 1; i >= 0; i--) {
        const p = bossExplosionParticles[i];
        p.x += Math.cos(p.direction) * p.speed;
        p.y += Math.sin(p.direction) * p.speed;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
            bossExplosionParticles.splice(i, 1);
        }
    }
}

function updateBackground() { background.y1 += background.speed; background.y2 += background.speed; if (background.y1 >= canvas.height) { background.y1 = background.y2 - canvas.height; } if (background.y2 >= canvas.height) { background.y2 = background.y1 - canvas.height; } }
function updatePlayer(currentTime) { if (player.isDamaged) { player.damageTimer -= 16; if (player.damageTimer <= 0) { player.isDamaged = false; } } player.animationTimer += 16; if (player.animationTimer > 150) { player.animationFrame += player.animationDirection; if (player.animationFrame >= 2) player.animationDirection = -1; else if (player.animationFrame <= 0) player.animationDirection = 1; player.animationTimer = 0; } player.dx = 0; player.dy = 0; if (keys.ArrowLeft || keys.KeyA) player.dx = -player.speed; if (keys.ArrowRight || keys.KeyD) player.dx = player.speed; if (keys.ArrowUp || keys.KeyW) player.dy = -player.speed; if (keys.ArrowDown || keys.KeyS) player.dy = player.speed; player.x += player.dx; player.y += player.dy; player.x = Math.max(0, Math.min(player.x, canvas.width - player.width)); player.y = Math.max(0, Math.min(player.y, canvas.height - player.height)); if ((keys.Space || keys.KeyZ) && (currentTime - player.lastBulletTime > player.fireRate)) { fireBullet(); player.lastBulletTime = currentTime; } }

function updateEntities(deltaTime) { 
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.y -= b.speed; if (b.dx) b.x += b.dx; if (b.dy) b.y -= b.dy; if (b.y + b.height < 0 || b.x < -b.width || b.x > canvas.width) { bullets.splice(i, 1); } } 
    for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.y += h.speed; if (h.y > canvas.height) hearts.splice(i, 1); } 
    for (let i = powerups.length - 1; i >= 0; i--) { const p = powerups[i]; p.y += p.speed; if (p.y > canvas.height) powerups.splice(i, 1); } 
    
    const enemyBulletImages = [resources.images.enemyBullet01.asset, resources.images.enemyBullet02.asset, resources.images.enemyBullet03.asset];
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.dx;
        b.y += b.dy;
        b.animationTimer += deltaTime;
        if (b.animationTimer > 100) {
            b.frame = (b.frame + 1) % enemyBulletImages.length;
            b.animationTimer = 0;
        }
        if (b.y > canvas.height || b.x < -b.width || b.x > canvas.width) {
            enemyBullets.splice(i, 1);
        }
    }

    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.animationTimer += deltaTime;

        if (effect.type === 'sonicBoom') {
            effect.x += effect.dx;
            effect.y += effect.dy;
            effect.scale += 0.02;
            
            if (effect.animationTimer > 50) {
                effect.frame = (effect.frame + 1) % 3;
                effect.animationTimer = 0;
            }
            if (effect.y > canvas.height + 50 || effect.x < -50 || effect.x > canvas.width + 50) {
                effects.splice(i, 1);
            }
        } else if (effect.type === 'electric') {
            effect.lifetime -= deltaTime;
            effect.scale = effect.lifetime / 5000;
            effect.width = 150 * effect.scale;
            effect.height = 150 * effect.scale;

            if (effect.animationTimer > 50) {
                effect.frame = (effect.frame + 1) % 3;
                effect.animationTimer = 0;
            }
            if (effect.lifetime <= 0) {
                effects.splice(i, 1);
            }
        }
    }
}
function updateRocks(deltaTime) { for (let i = rocks.length - 1; i >= 0; i--) { const r = rocks[i]; r.y += ROCK_FALL_SPEED; r.rotation += r.rotationSpeed; if (r.y > canvas.height) rocks.splice(i, 1); } }
function spawnItems(currentTime) { if (currentTime - lastHeartSpawnTime > HEART_ITEM_SPAWN_INTERVAL) { hearts.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, }); lastHeartSpawnTime = currentTime; } if (currentTime - lastPowerupSpawnTime > POWERUP_SPAWN_INTERVAL) { const itemType = Math.random() < 0.5 ? 'threeWay' : 'speed'; powerups.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, type: itemType, image: resources.images[itemType === 'threeWay' ? 'powerupThreeWay' : 'powerupSpeed'].asset }); lastPowerupSpawnTime = currentTime; } }
function spawnRocks() { const rockCount = 5; for (let i = 0; i < rockCount; i++) { const rockSize = (Math.random() * 40 + 40) * 0.6; rocks.push({ x: Math.random() * (canvas.width - rockSize), y: -rockSize - Math.random() * 200, width: rockSize, height: rockSize, rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.1 }); } }
function fireBullet() { 
    playAudio(resources.sounds.fire.asset, false, false, 0.25); 
    
    const bulletSize = player.isSuperShot ? 30 * 1.3 : 30;
    const bulletDamage = player.isSuperShot ? 20 : 10;

    const baseBullet = { 
        x: player.x + player.width / 2 - bulletSize / 2, 
        y: player.y, 
        width: bulletSize, 
        height: bulletSize, 
        speed: BULLET_SPEED, 
        frame: 0, 
        animationTimer: 0,
        damage: bulletDamage,
        isSuper: player.isSuperShot,
    }; 
    
    if (player.shotLevel <= 1) {
        bullets.push({ ...baseBullet }); 
        if (player.shotLevel === 1) {
            bullets.push({ ...baseBullet, dx: -2, dy: 0 }); 
            bullets.push({ ...baseBullet, dx: 2, dy: 0 }); 
        }
    } else if (player.shotLevel === 2) {
        bullets.push({ ...baseBullet }); 
        bullets.push({ ...baseBullet, dx: -2.5, dy: 0 }); 
        bullets.push({ ...baseBullet, dx: 2.5, dy: 0 }); 
        bullets.push({ ...baseBullet, dx: -1, dy: 1 }); 
        bullets.push({ ...baseBullet, dx: 1, dy: 1 });
    } else if (player.shotLevel >= 3) {
        bullets.push({ ...baseBullet });
        bullets.push({ ...baseBullet, dx: -3, dy: 0 }); 
        bullets.push({ ...baseBullet, dx: 3, dy: 0 }); 
        bullets.push({ ...baseBullet, dx: -2, dy: 1 }); 
        bullets.push({ ...baseBullet, dx: 2, dy: 1 }); 
        bullets.push({ ...baseBullet, dx: -1, dy: 2 }); 
        bullets.push({ ...baseBullet, dx: 1, dy: 2 });
        if (player.shotLevel >= 4) {
            bullets.push({ ...baseBullet, dx: -4, dy: -1 }); 
            bullets.push({ ...baseBullet, dx: 4, dy: -1 }); 
        }
    }
}
function checkCollisions() {
    if (boss.hp > 0 && !boss.isDefeated && boss.type !== 'S2' && boss.type !== 'Final') {
        if(boss.state === 'landing' && isColliding(player, boss)) handlePlayerHit(2); 
        else if ((boss.state === 'active' || boss.state === 'dashing') && isColliding(player, boss)) handlePlayerHit(1);
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet) continue;
        for (let k = rocks.length - 1; k >= 0; k--) {
            if (isColliding(bullet, rocks[k])) { bullets.splice(i, 1); break; }
        }
        
        if (!bullets[i]) continue;

        const isBossHiding = boss.type === 'S2' && boss.hidingState === 'hidden';
        let isHit = false;

        if (boss.type === 'Final' && boss.hp > 0 && !boss.isDefeated) {
            const hitBox = { x: boss.x, y: boss.y, width: boss.width, height: boss.height / 3 };
            if (isColliding(bullet, hitBox)) {
                isHit = true;
            }
        } else if (boss.hp > 0 && !boss.isDefeated && !isBossHiding && isColliding(bullet, boss)) {
            isHit = true;
        }

        if (isHit) {
            playAudio(resources.sounds.enemyHit.asset);
            boss.hp -= bullet.damage;
            if (boss.hp < 0) boss.hp = 0;
            bullets.splice(i, 1);
        }
    }
    for (let i = rocks.length - 1; i >= 0; i--) if (isColliding(player, rocks[i])) { handlePlayerHit(1); rocks.splice(i, 1); }
    for (let i = enemyBullets.length - 1; i >= 0; i--) if (isColliding(player, enemyBullets[i])) { handlePlayerHit(1); enemyBullets.splice(i, 1); }
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        let effectHitbox;
        if (effect.type === 'sonicBoom') {
            const img = resources.images.sonicBoom1.asset;
            if (img && img.complete && img.naturalWidth > 0) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const drawHeight = 30 * effect.scale;
                const drawWidth = drawHeight * aspectRatio;
                 effectHitbox = {
                    x: effect.x - drawWidth / 2,
                    y: effect.y - drawHeight / 2,
                    width: drawWidth,
                    height: drawHeight
                };
            }
        } else { // electric
            effectHitbox = {
                x: effect.x - effect.width / 2,
                y: effect.y - effect.height / 2,
                width: effect.width,
                height: effect.height
            };
        }
        if (effectHitbox && isColliding(player, effectHitbox)) {
            if (effect.type === 'sonicBoom') {
                handlePlayerHit(2);
                effects.splice(i, 1);
            } else {
                handlePlayerHit(2);
            }
        }
    }
    for (let i = hearts.length - 1; i >= 0; i--) if (isColliding(player, hearts[i])) { playAudio(resources.sounds.itemGet.asset); hearts.splice(i, 1); player.lives++; }
    for (let i = powerups.length - 1; i >= 0; i--) { 
        if (isColliding(player, powerups[i])) { 
            playAudio(resources.sounds.itemGet.asset); 
            const p = powerups[i]; 
            if (p.type === 'threeWay') { 
                player.shotLevel = Math.min(player.shotLevel + 1, 5);
                if (player.shotLevel === 4) {
                    player.isSuperShot = true;
                }
                if (player.shotLevel === 5) {
                    player.fireRate = 250;
                }
            } else if (p.type === 'speed') { 
                if (player.speedLevel < 5) { 
                    player.speedLevel++; 
                    player.speed = player.baseSpeed + (player.speedLevel * 0.5); 
                } 
            } 
            powerups.splice(i, 1); 
        } 
    }
}
function handlePlayerHit(damage) { if (!player.isDamaged) { playAudio(resources.sounds.playerHit.asset); player.lives -= damage; player.isDamaged = true; player.damageTimer = 1000; if (player.lives <= 0) { player.lives = 0; gameState = 'gameover'; stopBGM(); playAudio(resources.sounds.gameoverBGM.asset, true, true); } } }
function isColliding(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }

// --- 描画処理 ---
function draw(deltaTime) {
    ctx.save(); 
    if (shakeIntensity > 0) { const shakeX = (Math.random() - 0.5) * shakeIntensity; const shakeY = (Math.random() - 0.5) * shakeIntensity; ctx.translate(shakeX, shakeY); } 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    switch (gameState) { 
        case 'loading': drawLoadingScreen(); break; 
        case 'ready': drawReadyScreen(); break; 
        case 'playing': 
        case 'bossDefeatSequence': 
        case 'finalBossDefeated':
            drawPlayingScreen(deltaTime); 
            break; 
        case 'stageTransition': 
            drawStageTransition(deltaTime); 
            break;
        case 'clear': 
            drawGameClearScreen(); 
            break; 
        case 'gameover': 
            drawPlayingScreen(deltaTime); 
            drawGameOverScreen(); 
            break; 
    } 

    if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashAlpha -= 0.05; 
        if (flashAlpha < 0) flashAlpha = 0;
    }

    ctx.restore(); 
}

function drawPlayingScreenContent(deltaTime, stage) {
    if (stage === 5) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (Math.floor(warningBlinkTimer / 300) % 2 === 0) {
            ctx.save();
            ctx.font = 'bold 70px "Yusei Magic"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text1 = 'ラスボス';
            const text2 = 'せっきんちゅう！';
            
            const gradient = ctx.createLinearGradient(0, canvas.height/2 - 80, 0, canvas.height/2 + 80);
            gradient.addColorStop(0, '#FFD700'); gradient.addColorStop(0.5, '#FF69B4'); gradient.addColorStop(1, '#FFD700');
            ctx.fillStyle = gradient;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 15; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
            
            ctx.fillText(text1, canvas.width / 2, canvas.height / 2 - 40);
            ctx.fillText(text2, canvas.width / 2, canvas.height / 2 + 40);
            ctx.restore();
        }
        drawItems();
        drawPlayer(); 
        drawUI();
    } else if (stage === 6) {
        const bgImage = resources.images.backgroundS5.asset; 
        const bgImageB = resources.images.backgroundS5_B.asset;
        if (bgImage && bgImage.complete) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height); 
        drawBoss();
        if (bgImageB && bgImageB.complete) ctx.drawImage(bgImageB, 0, 0, canvas.width, canvas.height);
        drawItems(); 
        drawBullets(deltaTime); 
        drawEnemyBullets(); 
        drawEffects();
        drawRocks();
        drawPlayer(); 
        drawBossExplosionParticles(); 
        drawUI();
    } else {
        const bgImage = background.currentImage; 
        if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) { 
            ctx.drawImage(bgImage, 0, Math.floor(background.y1), canvas.width, canvas.height); 
            ctx.drawImage(bgImage, 0, Math.floor(background.y2), canvas.width, canvas.height); 
        } 
        drawItems(); 
        drawBullets(deltaTime); 
        drawEnemyBullets(); 
        drawEffects();
        drawRocks();
        if (bossRushState > 0) {
            drawBoss();
        }
        drawPlayer(); 
        drawBossExplosionParticles(); 
        drawUI();
    }
}

function drawPlayingScreen(deltaTime) {
    drawPlayingScreenContent(deltaTime, bossRushState);
}

function drawStageTransition(deltaTime) {
    if (bossRushState === 6 && transitionState === 'fadingOut') { 
        drawPlayingScreenContent(deltaTime, 5);
        ctx.globalAlpha = transitionAlpha;
        const bgImage = resources.images.backgroundS5.asset;
        if (bgImage && bgImage.complete) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1.0;
    } else {
        drawPlayingScreen(deltaTime);
        ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}
function drawPlayer() { const playerImages = [resources.images.player1.asset, resources.images.player2.asset, resources.images.player3.asset]; let currentImage = playerImages[player.animationFrame]; if (player.isDamaged) { if (Math.floor(player.damageTimer / 100) % 2 === 0) return; currentImage = resources.images.playerDamaged.asset; } if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) return; ctx.save(); const centerX = player.x + player.width / 2; const centerY = player.y + player.height / 2; ctx.translate(centerX, centerY); let tilt = 0; if (player.dx < 0) tilt = -TILT_ANGLE; else if (player.dx > 0) tilt = TILT_ANGLE; ctx.rotate(tilt); const shadowImage = resources.images.playerShadow.asset; if (shadowImage && shadowImage.complete) { const shadowWidth = player.width * 0.8; const shadowHeight = player.height * 0.2; const shadowOffsetX = -shadowWidth / 2; const shadowOffsetY = player.height / 2 - shadowHeight / 2 + 10; ctx.drawImage(shadowImage, shadowOffsetX, shadowOffsetY, shadowWidth, shadowHeight); } ctx.drawImage(currentImage, -player.width / 2, -player.height / 2, player.width, player.height); ctx.restore(); }
function drawBullets(deltaTime) { 
    const normalBulletImages = [resources.images.bullet01.asset, resources.images.bullet02.asset, resources.images.bullet03.asset]; 
    const superBulletImages = [resources.images.bullet_p01.asset, resources.images.bullet_p02.asset, resources.images.bullet_p03.asset]; 

    bullets.forEach(b => { 
        b.animationTimer += deltaTime; 
        
        const imageSet = b.isSuper ? superBulletImages : normalBulletImages;

        if (b.animationTimer > 100) { 
            b.frame = (b.frame + 1) % imageSet.length; 
            b.animationTimer = 0; 
        } 
        
        const currentImage = imageSet[b.frame]; 
        if (currentImage && currentImage.complete) {
            ctx.drawImage(currentImage, b.x, b.y, b.width, b.height); 
        }
    }); 
}
function drawRocks() { const rockImage = resources.images.rock.asset; if (!rockImage || !rockImage.complete) return; rocks.forEach(r => { ctx.save(); ctx.translate(r.x + r.width / 2, r.y + r.height / 2); ctx.rotate(r.rotation); ctx.drawImage(rockImage, -r.width / 2, -r.height / 2, r.width, r.height); ctx.restore(); }); }
function drawItems() { hearts.forEach(h => ctx.drawImage(resources.images.heartItem.asset, h.x, h.y, h.width, h.height)); powerups.forEach(p => ctx.drawImage(p.image, p.x, p.y, p.width, p.height)); }
function drawEnemyBullets() { const enemyBulletImages = [resources.images.enemyBullet01.asset, resources.images.enemyBullet02.asset, resources.images.enemyBullet03.asset]; enemyBullets.forEach(b => { const currentImage = enemyBulletImages[b.frame]; if (currentImage && currentImage.complete) ctx.drawImage(currentImage, b.x, b.y, b.width, b.height); }); }

function drawEffects() {
    effects.forEach(effect => {
        let img;
        ctx.save();
        if (effect.type === 'sonicBoom') {
            const boomImages = [resources.images.sonicBoom1.asset, resources.images.sonicBoom2.asset, resources.images.sonicBoom3.asset];
            img = boomImages[effect.frame];
            ctx.translate(effect.x, effect.y);
            ctx.rotate(effect.rotation - Math.PI / 2);
            if (img && img.complete && img.naturalWidth > 0) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const drawHeight = 30 * effect.scale;
                const drawWidth = drawHeight * aspectRatio;
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            }
        } else if (effect.type === 'electric') {
            const electricImages = [resources.images.electric1.asset, resources.images.electric2.asset, resources.images.electric3.asset];
            img = electricImages[effect.frame];
            if (img && img.complete) {
                ctx.globalAlpha = effect.alpha;
                ctx.drawImage(img, effect.x - effect.width / 2, effect.y - effect.height / 2, effect.width, effect.height);
            }
        }
        ctx.restore();
    });
}

function drawBoss() {
    ctx.save();
    if (boss.isDefeated) {
        ctx.globalAlpha = boss.defeatAlpha;
    }

    let bossImage, bossDmgImage;
    switch(boss.type) { case 'S1': bossImage = resources.images.bossS1.asset; bossDmgImage = resources.images.bossS1Damaged.asset; break; case 'S2': const S2images = [resources.images.bossS2_1.asset, resources.images.bossS2_2.asset]; const S2DmgImages = [resources.images.bossS2_damaged_1.asset, resources.images.bossS2_damaged_2.asset]; bossImage = S2images[boss.animationFrame]; bossDmgImage = S2DmgImages[boss.animationFrame]; break; case 'S3': bossImage = resources.images.bossS3.asset; bossDmgImage = resources.images.bossS3Damaged.asset; break; case 'S4': bossImage = resources.images.bossS4.asset; bossDmgImage = resources.images.bossS4Damaged.asset; break; case 'Final': bossImage = resources.images.finalBoss.asset; bossDmgImage = resources.images.finalBossDamaged.asset; break; } 
    
    let currentImage;
    if (boss.type === 'S2') {
        if (boss.hidingState === 'hidden') {
            ctx.restore();
            return;
        }
        const hideImg1 = resources.images.bossS2_hide1.asset;
        const hideImg2 = resources.images.bossS2_hide2.asset;

        if (boss.hidingState === 'starting') {
            currentImage = boss.hidingTimer > 200 ? hideImg1 : hideImg2;
        } else if (boss.hidingState === 'ending') {
            currentImage = boss.hidingTimer > 200 ? hideImg2 : hideImg1;
        } else {
            currentImage = boss.isDamagedState ? bossDmgImage : bossImage;
        }
    } else {
        currentImage = boss.isDamagedState ? bossDmgImage : bossImage; 
    }
    
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) { ctx.restore(); return; }
    
    const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight; 
    let finalWidth, finalHeight; 
    if(boss.type === 'S1') { 
        finalWidth = boss.width * boss.currentScale; 
        finalHeight = boss.height * boss.currentScale;
    } else {
        finalWidth = boss.width;
        finalHeight = finalWidth / aspectRatio;
        if (boss.type === 'Final') {
            finalWidth *= boss.currentScale;
            finalHeight *= boss.currentScale;
        }
    }
    
    const shadowImage = resources.images.playerShadow.asset; 
    if (shadowImage && shadowImage.complete && boss.type !== 'S2' && boss.type !== 'Final') { 
        let shadowScale = 1.0; 
        let groundY;

        if (boss.type === 'S4' && (boss.state === 'jumping' || boss.state === 'aiming')) {
            groundY = boss.jumpTargetY;
        } else {
            groundY = boss.y;
        }

        let yOffset = 20;
        if (boss.type === 'S3') {
            yOffset = -10;
        } else if (boss.type === 'S4') {
            yOffset = 5; 
        }
        let shadowY = groundY + boss.height - (boss.height * 0.2 * shadowScale) / 2 + yOffset;
        
        if (boss.state === 'jumping') shadowScale = 1.0 + 0.5 * Math.sin(boss.jumpProgress * Math.PI); 
        const shadowWidth = boss.width * 0.8 * shadowScale; 
        const shadowHeight = boss.height * 0.2 * shadowScale; 
        const shadowX = boss.x + (boss.width - shadowWidth) / 2; 
        ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight); 
    } 
    
    let drawScale = 1.0; 
    if (boss.state === 'jumping' && boss.type !== 'Final') {
        drawScale = 1.0 + 0.3 * Math.sin(boss.jumpProgress * Math.PI); 
    }
    const scaledWidth = finalWidth * drawScale; const scaledHeight = finalHeight * drawScale; 
    const drawX = boss.x + (boss.width * drawScale - scaledWidth) / 2; 
    const drawY = boss.y + (boss.height * drawScale - scaledHeight) / 2; 

    if ((boss.type === 'S3' || boss.type === 'S4' || boss.type === 'Final') && boss.state === 'aiming' && Math.floor(boss.aimTimer / 100) % 2 === 0) {
        offscreenCanvas.width = scaledWidth; offscreenCanvas.height = scaledHeight;
        offscreenCtx.clearRect(0, 0, scaledWidth, scaledHeight);
        offscreenCtx.drawImage(currentImage, 0, 0, scaledWidth, scaledHeight);
        offscreenCtx.globalCompositeOperation = 'source-atop';
        const flashColor = boss.isAimingWhite ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 0, 0, 0.5)';
        offscreenCtx.fillStyle = flashColor;
        offscreenCtx.fillRect(0, 0, scaledWidth, scaledHeight);
        offscreenCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(offscreenCanvas, drawX, drawY);
    } else {
        ctx.drawImage(currentImage, drawX, drawY, scaledWidth, scaledHeight);
    }
    
    if (!boss.isDefeated && boss.state !== 'jumping'){ 
        ctx.fillStyle = "gray"; ctx.fillRect(boss.x, boss.y - 15, boss.width, 10); 
        const gradient = ctx.createLinearGradient(boss.x, 0, boss.x + boss.width, 0); gradient.addColorStop(0, "#FF0000"); gradient.addColorStop(1, "#8B0000"); 
        ctx.fillStyle = gradient; 
        ctx.fillRect(boss.x, boss.y - 15, boss.width * (boss.hp / boss.maxHp), 10); 
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; 
        ctx.strokeRect(boss.x, boss.y - 15, boss.width, 10); 
    } 
    ctx.restore();
}
function drawBossExplosionParticles() { for (const p of bossExplosionParticles) { ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
function drawUI() { ctx.fillStyle = '#6A0DAD'; ctx.font = '20px "M PLUS Rounded 1c"'; ctx.textAlign = 'right'; ctx.lineWidth = 4; ctx.strokeStyle = 'white'; const scoreText = `スコア: ${score}`; ctx.strokeText(scoreText, canvas.width - 10, 30); ctx.fillText(scoreText, canvas.width - 10, 30); const heartImage = resources.images.heart.asset; for (let i = 0; i < player.lives; i++) { if (heartImage.complete) ctx.drawImage(heartImage, 70 + (30 + 5) * i, 20, 30, 30); } const faceDecorationImage = resources.images.playerFaceDecoration.asset; if (faceDecorationImage && faceDecorationImage.complete) ctx.drawImage(faceDecorationImage, 10, 20, faceDecorationImage.width, faceDecorationImage.height); }
function drawLoadingScreen() { ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Now Loading...', canvas.width / 2, canvas.height / 2); }
function drawReadyScreen() { drawPlayingScreen(0); ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '48px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.fillText('STAGE 5', canvas.width / 2, canvas.height / 2 - 40); ctx.font = '30px "M PLUS Rounded 1c"'; if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('クリックしてスタート', canvas.width / 2, canvas.height / 2 + 30); }
function drawGameOverScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '48px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50); ctx.font = '30px "M PLUS Rounded 1c"'; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2); if(clearScreenButtonsContainer) clearScreenButtonsContainer.style.display = 'block'; if(retryButton) retryButton.style.display = 'block'; if(retryButton) retryButton.textContent = "もう一度プレイする"; }
function drawGameClearScreen() { const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height); gradient.addColorStop(0, '#FFD700'); gradient.addColorStop(1, '#FF6347'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height); drawTitleParticles(); ctx.fillStyle = 'white'; ctx.font = '48px "Yusei Magic"'; ctx.textAlign = 'center'; ctx.fillText('ゲームクリア！', canvas.width / 2, canvas.height / 2 - 50); ctx.font = '30px "M PLUS Rounded 1c"'; ctx.fillText(`Congratulations! Final Score: ${score}`, canvas.width / 2, canvas.height / 2); if(soundToggleButton) soundToggleButton.style.display = 'none'; if(clearScreenButtonsContainer) clearScreenButtonsContainer.style.display = 'block'; if(retryButton) retryButton.style.display = 'block'; if(retryButton) retryButton.textContent = "タイトルへもどる"; }
function createTitleParticle() { titleParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.5, speed: Math.random() * 0.3 + 0.1, direction: Math.random() * Math.PI * 2 }); }
function updateTitleParticles() { for (let i = titleParticles.length - 1; i >= 0; i--) { const p = titleParticles[i]; p.x += Math.cos(p.direction) * p.speed; p.y += Math.sin(p.direction) * p.speed; p.alpha -= 0.005; if (p.alpha <= 0) titleParticles.splice(i, 1); } while (titleParticles.length < MAX_TITLE_PARTICLES) createTitleParticle(); }
function drawTitleParticles() { for (const p of titleParticles) { ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } }
    
// --- イベントリスナー ---
function handleUserInteraction() { if (!hasUserInteracted) { hasUserInteracted = true; setAllAudioMute(!isSoundOn); } }
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    handleUserInteraction();
    if (gameState === 'ready') {
        startGame();
    }

    if (e.code === 'KeyP' && (gameState === 'playing' || gameState === 'bossDefeatSequence')) {
        if (boss.hp > 0 && !boss.isDefeated) {
            boss.hp = 0;
            console.log(`Debug: Boss defeated with P key.`);
        }
    }
});

document.addEventListener('keyup', (e) => { keys[e.code] = false; });
document.addEventListener('click', () => { handleUserInteraction(); if (gameState === 'ready') startGame(); });
retryButton.addEventListener('click', () => { if (gameState === 'clear') { window.location.href = 'shooting.html'; } else if (gameState === 'gameover') { clearScreenButtonsContainer.style.display = 'none'; resetGame(); gameState = 'ready'; } });
soundToggleButton.addEventListener('click', () => { isSoundOn = !isSoundOn; setAllAudioMute(!isSoundOn); soundToggleButton.textContent = isSoundOn ? '♪ ON' : '♪ OFF'; if (currentBGM) { if (isSoundOn) currentBGM.play().catch(e => console.error(e.name, e.message)); else currentBGM.pause(); } soundToggleButton.blur(); });
    
// --- 実行開始 ---
loadResources(() => {
    resetGame();
    gameState = 'ready';
    for (let i = 0; i < MAX_TITLE_PARTICLES; i++) createTitleParticle();
    
    gameLoopId = requestAnimationFrame(gameLoop);
});