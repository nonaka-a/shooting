'use strict';

// --- グローバル変数と定数 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const soundToggleButton = document.getElementById('soundToggleButton');
const introVideo = document.getElementById('introVideo');
const skipButton = document.getElementById('skipButton');
const videoContainer = document.getElementById('videoContainer');
const video1 = document.getElementById('video1');
const skipButton2 = document.getElementById('skipButton2');
const videoContainer2 = document.getElementById('videoContainer2');
const clearScreenButtonsContainer = document.getElementById('clearScreenButtons');
const retryButton = document.getElementById('retryButton');
const nextStageButton = document.getElementById('nextStageButton');

// ★★★ ここから追加 ★★★
const howToPlayModal = document.getElementById('howToPlayModal');
const closeModalButton = document.getElementById('closeModalButton');
// ★★★ ここまで追加 ★★★


// ゲーム設定
const PLAYER_SPEED = 2;
const PLAYER_FIRE_RATE = 667; // ms (プレイヤーの弾の発射間隔)
const BULLET_SPEED = 3; // プレイヤーの弾の速度
const ENEMY_SPAWN_INTERVAL = 1000; // ms (敵の出現間隔)
const HEART_ITEM_SPAWN_INTERVAL = 7500; // ms (ハートアイテムの出現間隔)
const POWERUP_SPAWN_INTERVAL = 20000; // ms (パワーアップアイテムの出現間隔)
const BOSS_HEART_ITEM_SPAWN_INTERVAL = 10000; // ms (ボス戦中のハートアイテム出現間隔)
const BOSS_POWERUP_SPAWN_INTERVAL = 10000; // ms (ボス戦中のパワーアップアイテム出現間隔)
const ENEMY_BULLET_SPEED = 3; // 敵の弾の速度
const ENEMY_FIRE_RATE = 8000; // ms (敵の弾の発射間隔)
const BOSS_BULLET_SPEED = 4; // ボスの弾の速度
const BOSS_FIRE_RATE = 6000; // ms (ボスの弾の発射間隔)
const MAX_TITLE_PARTICLES = 150; // タイトル画面のパーティクル最大数
const TILT_ANGLE = 5 * Math.PI / 180; // プレイヤーの傾き角度 (ラジアン、5度)

// ゲームの状態
let gameState = 'loading'; // 'loading', 'title', 'playing', 'gameover', 'bossWarning', 'bossDefeatAnimation', 'clear', 'stageClear'
let currentStage = 1; // 現在のステージ番号
let score = 0;
let lastTime = 0;
let isSoundOn = true; // 音のオンオフ状態
let hasUserInteracted = false; // ユーザーが操作したかどうかのフラグ
let nextStageToStart = 1; // 動画再生後に開始するステージ番号
let clearScreenTimer = 0; // クリア画面表示までのタイマー
let dropped1000ScoreItems = false; // スコア1000でアイテムをドロップしたか
let dropped3000ScoreItems = false; // スコア3000でアイテムをドロップしたか
let bossWarningTimer = 0; // ボス警告演出のタイマー
let itemsDroppedDuringWarning = 0; // ボス警告中に出現したアイテム数
let gameStartTime = 0; // ゲーム開始時間
let stage2CrabSpawnSchedule = []; // ステージ2のカニの出現スケジュール
let crabsSpawned = 0; // スポーンしたカニの数

// エンティティ（ゲーム内の要素）
const player = {};
const bullets = []; // プレイヤーの弾
const enemies = [];
const hearts = []; // ハートアイテム
const powerups = []; // パワーアップアイテム
const titleParticles = []; // タイトル画面のパーティクル
const enemyBullets = []; // 敵の弾
const bossExplosionParticles = []; // ボス撃破時のパーティクル

// ボス
const boss = {};
let isBossActive = false; // ボスが出現しているか
let hasBossAppeared = false; // ボスが一度でも出現したか

// 背景
const background = {
    y1: 0,
    y2: -canvas.height,
    speed: 1,
    currentBackgroundIndex: 0, // 現在の背景画像のインデックス
    backgrounds: [], // ステージ2の背景画像配列
    isLoopingLastBackground: false, // 最後の背景画像をループ中か
};

// 入力状態
const keys = {};

// --- リソース管理 ---
const resources = {
    images: {
        background: { src: 'images/background/background.png', asset: new Image() },
        background2_1: { src: 'images/background/background2_1.png', asset: new Image() },
        background2_2: { src: 'images/background/background2_2.png', asset: new Image() },
        background2_3: { src: 'images/background/background2_3.png', asset: new Image() },
        background2_4: { src: 'images/background/background2_4.png', asset: new Image() },
        background2_5: { src: 'images/background/background2_5.png', asset: new Image() },
        player1: { src: 'images/player/player_1.png', asset: new Image() },
        player2: { src: 'images/player/player_2.png', asset: new Image() },
        player3: { src: 'images/player/player_3.png', asset: new Image() },
        playerDamaged: { src: 'images/player/player_damaged.png', asset: new Image() },
        playerShadow: { src: 'images/player/player_shadow.png', asset: new Image() },
        playerFaceDecoration: { src: 'images/player/player_face_decoration.png', asset: new Image() },
        enemy: { src: 'images/enemy/enemy.png', asset: new Image() },
        enemyCrab: { src: 'images/enemy/enemy_crab.png', asset: new Image() },
        titleLogo: { src: 'images/title_logo.png', asset: new Image() },
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
        boss: { src: 'images/boss/boss.png', asset: new Image() },
        bossDamaged: { src: 'images/boss/boss_damaged.png', asset: new Image() },
        bossStage2_1: { src: 'images/boss/boss_stage2_1.png', asset: new Image() },
        bossStage2_2: { src: 'images/boss/boss_stage2_2.png', asset: new Image() },
        bossStage2_damaged_1: { src: 'images/boss/boss_stage2_damaged_1.png', asset: new Image() },
        bossStage2_damaged_2: { src: 'images/boss/boss_stage2_damaged_2.png', asset: new Image() },
        bossStage2_hide1: { src: 'images/boss/boss_stage2_hide1.png', asset: new Image() },
        bossStage2_hide2: { src: 'images/boss/boss_stage2_hide2.png', asset: new Image() },
    },
    sounds: {
        titleBGM: { src: 'sounds/title.mp3', asset: new Audio() },
        playBGM: { src: 'sounds/play.mp3', asset: new Audio() },
        gameoverBGM: { src: 'sounds/gameover.mp3', asset: new Audio() },
        fire: { src: 'sounds/fire.mp3', asset: new Audio() },
        enemyHit: { src: 'sounds/enemy-hit.mp3', asset: new Audio() },
        itemGet: { src: 'sounds/item-get.mp3', asset: new Audio() },
        playerHit: { src: 'sounds/player-hit.mp3', asset: new Audio() },
        gameStart: { src: 'sounds/start.mp3', asset: new Audio() },
        gameClear: { src: 'sounds/gameclear.mp3', asset: new Audio() },
        bossBGM: { src: 'sounds/boss.mp3', asset: new Audio() },
    }
};

// --- 音声制御 ---
let currentBGM = null;
let fadeInterval = null; 
function playAudio(audio, loop = false, isBGM = false, volume = 1.0) {
    if (!isSoundOn) return; 
    if (isBGM) {
        if (currentBGM) {
            if (fadeInterval) {
                clearInterval(fadeInterval);
                fadeInterval = null;
            }
            currentBGM.pause();
            currentBGM.currentTime = 0;
        }
        currentBGM = audio;
    }
    audio.loop = loop;
    if (!loop) {
        audio.currentTime = 0;
    }
    audio.volume = volume;
    audio.play().catch(e => console.error("Audio play failed. User interaction might be required.", e));
}
function fadeOutBGM(audio, duration, callback) {
    if (!audio || audio.paused || !isSoundOn) {
        if (callback) callback();
        return;
    }
    const initialVolume = audio.volume;
    const steps = 50; 
    const stepTime = duration / steps;
    let currentStep = 0;
    if (fadeInterval) {
        clearInterval(fadeInterval);
    }
    fadeInterval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
            audio.volume = 0;
            audio.pause();
            audio.currentTime = 0;
            clearInterval(fadeInterval);
            fadeInterval = null;
            if (callback) callback();
        } else {
            audio.volume = initialVolume * (1 - (currentStep / steps));
        }
    }, stepTime);
}
function stopBGM() {
    if (currentBGM) {
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }
        currentBGM.pause();
        currentBGM.currentTime = 0;
        currentBGM = null;
    }
}
function setAllAudioMute(mute) {
    for (const key in resources.sounds) {
        const audio = resources.sounds[key].asset;
        audio.muted = mute;
    }
    if (currentBGM) {
        currentBGM.muted = mute;
    }
}
// --- 初期化処理 ---
function resetGame(stageNum = 1) {
    currentStage = stageNum;
    const playerImage = resources.images.player1.asset;
    Object.assign(player, {
        width: playerImage.width * 0.2,
        height: playerImage.height * 0.2,
        x: canvas.width / 2 - (playerImage.width * 0.2) / 2,
        y: canvas.height - (playerImage.height * 0.2) - 20,
        speed: PLAYER_SPEED,
        dx: 0,
        dy: 0,
        fireRate: PLAYER_FIRE_RATE,
        lastBulletTime: 0,
        lives: 5,
        shotLevel: 0,
        baseSpeed: PLAYER_SPEED,
        speedLevel: 0,
        animationFrame: 0,
        animationTimer: 0,
        animationDirection: 1,
        isDamaged: false,
        damageTimer: 0,
    });
    score = 0;
    bullets.length = 0;
    enemies.length = 0;
    hearts.length = 0;
    powerups.length = 0;
    enemyBullets.length = 0;
    Object.assign(boss, {
        x: canvas.width / 2 - 100,
        y: -200,
        width: 200,
        height: 200,
        hp: 500,
        maxHp: 500,
        speed: 0.5,
        dx: 1,
        isDefeated: false,
        defeatAlpha: 1.0,
        defeatScale: 1.0,
        lastBossBulletTime: 0,
        baseWidth: 200,
        baseHeight: 200,
        currentScale: 1.0,
        scaleDirection: 1,
        targetY: 50,
        dy: 0,
        isDamagedState: false,
        animationFrame: 0,
        animationTimer: 0,
        hidingState: 'none',
        hideInterval: 10000,
        lastHideTime: 0,
        hidingTimer: 0,
    });
    isBossActive = false;
    hasBossAppeared = false;
    bossExplosionParticles.length = 0;
    dropped1000ScoreItems = false;
    dropped3000ScoreItems = false;
    background.y1 = 0;
    background.y2 = -canvas.height;
    background.speed = 1;
    background.currentBackgroundIndex = 0;
    background.backgrounds = [];
    background.isLoopingLastBackground = false;
    background.currentImage = null;
    background.nextImage = null;
    background.y = 0;
    background.sequenceIndex = 0;
    background.isSequenceFinished = false;
    background.scoreThresholdReached = false;
    background.playedExtra2_3 = false;
    lastEnemySpawnTime = 0;
    lastHeartSpawnTime = 0;
    lastPowerupSpawnTime = 0;
    if (stageNum === 2) {
        stage2CrabSpawnSchedule = [12000, 15000, 16000, 18000, 21000, 22000, 24000, 27000, 28000, 29000, 33000, 40000];
        crabsSpawned = 0;
    }
    else if (stageNum === 3) {
        // ステージ3用のリセット処理
    }
    lastTime = 0;
}

function startGame(stageNum = 1) {
    resetGame(stageNum);
    if (currentStage === 1) {
        boss.maxHp = 500;
        boss.hp = 500;
        background.speed = 1;
        background.currentImage = resources.images.background.asset;
    } else if (currentStage === 2) {
        boss.maxHp = 1000;
        boss.hp = 1000;
        background.speed = 1;
        background.backgrounds = [
            resources.images.background2_1.asset,
            resources.images.background2_2.asset,
            resources.images.background2_3.asset,
            resources.images.background2_4.asset,
            resources.images.background2_5.asset,
        ];
        background.sequenceIndex = 0;
        background.currentImage = background.backgrounds[background.sequenceIndex];
        background.nextImage = background.backgrounds[background.sequenceIndex + 1] || background.currentImage;
        background.y = 0;
        background.isSequenceFinished = false;
    } else if (currentStage === 3) {
        // ステージ3用の設定を追加
        boss.maxHp = 1500; // 例: ボスHPを増やす
        boss.hp = 1500;
        background.speed = 1.2; // 例: 背景スクロールを速くする
        // ステージ3用の背景画像。なければステージ1のものを再利用
        background.currentImage = resources.images.background.asset;
    }
    stopBGM();
    playAudio(resources.sounds.gameStart.asset);
    gameState = 'playing';
    gameStartTime = performance.now();
    console.log(`Game started. Stage: ${currentStage}`);
}

function loadResources(callback) {
    const imageRes = Object.values(resources.images);
    const soundRes = Object.values(resources.sounds);
    const totalResources = imageRes.length + soundRes.length;
    let loadedCount = 0;
    console.log(`Loading ${totalResources} resources...`);
    if (totalResources === 0) {
        callback();
        return;
    }
    function onResourceLoaded(e) {
        if (e.type !== 'error') {
            console.log(`Loaded: ${this.src}`);
        }
        loadedCount++;
        if (loadedCount === totalResources) {
            console.log("All resources finished loading.");
            callback();
        }
    }
    imageRes.forEach(res => {
        res.asset.onload = onResourceLoaded;
        res.asset.onerror = (e) => { console.error(`Failed to load image: ${res.src}`); onResourceLoaded.call(res.asset, e); };
        res.asset.src = res.src;
    });
    soundRes.forEach(res => {
        res.asset.addEventListener('canplaythrough', onResourceLoaded, { once: true });
        res.asset.onerror = (e) => { console.error(`Failed to load audio: ${res.src}`); onResourceLoaded.call(res.asset, e); };
        res.asset.src = res.src;
    });
}
function handleVideoEnd() {
    if (videoContainer) videoContainer.style.display = 'none';
    if (canvas) canvas.style.display = 'block';
    
    // ゲーム中は音ボタンを表示
    if (soundToggleButton) soundToggleButton.style.display = 'block';
    
    startGame(nextStageToStart);
}

function handleVideo1End() {
    window.location.href = 'shooting3.html';
}
// --- メインゲームループ ---
function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = currentTime - lastTime;
    update(deltaTime, currentTime);
    draw(deltaTime);
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
}
// --- 更新処理 (Update) ---
function update(deltaTime, currentTime) {
    switch (gameState) {
        case 'playing':
            updatePlayingState(deltaTime, currentTime);
            break;
        case 'bossWarning':
            updateBossWarning(deltaTime, currentTime);
            break;
        case 'title':
            updateTitleParticles();
            break;
        case 'bossDefeatAnimation':
            updateBossDefeatAnimation(deltaTime, currentTime);
            break;
        case 'clear':
        case 'stageClear':
            updateTitleParticles();
            break;
    }
}
function updatePlayingState(deltaTime, currentTime) {
    updateBackground();
    updatePlayer(currentTime);
    updateEntities(deltaTime);
    updateEnemyScaling(deltaTime);
    updateEnemyBullets(deltaTime);
    if (!isBossActive && currentTime - gameStartTime >= 2000 && currentBGM !== resources.sounds.playBGM.asset) {
        playAudio(resources.sounds.playBGM.asset, true, true);
    }
    let bossAppearScore = 6000;
    if (currentStage === 3) {
        bossAppearScore = 8000;
    }
    if (score >= bossAppearScore && !hasBossAppeared) {
        gameState = 'bossWarning';
        bossWarningTimer = 8000;
        itemsDroppedDuringWarning = 0;
        enemyBullets.length = 0;
        fadeOutBGM(currentBGM, 1000);
        console.log("Boss warning initiated!");
    }
    if (isBossActive) {
        updateBoss(deltaTime, currentTime);
    } else {
        spawnEntities(currentTime);
        fireEnemyBullets(currentTime);
    }
    spawnItems(currentTime);
    if (score >= 1000 && !dropped1000ScoreItems) {
        for (let i = 0; i < 2; i++) {
            const itemType = Math.random() < 0.5 ? 'threeWay' : 'speed';
            let itemImage = null;
            if (itemType === 'threeWay') {
                itemImage = resources.images.powerupThreeWay.asset;
            } else if (itemType === 'speed') {
                itemImage = resources.images.powerupSpeed.asset;
            }
            if (itemImage) {
                powerups.push({
                    x: canvas.width / 2 - 15 + (i * 30),
                    y: -30,
                    width: 30, height: 30,
                    speed: 1,
                    type: itemType,
                    image: itemImage,
                });
            }
        }
        dropped1000ScoreItems = true;
    }
    if (score >= 2500 && !dropped3000ScoreItems) {
        background.scoreThresholdReached = true;
        for (let i = 0; i < 2; i++) {
            const itemType = Math.random() < 0.5 ? 'threeWay' : 'speed';
            let itemImage = null;
            if (itemType === 'threeWay') {
                itemImage = resources.images.powerupThreeWay.asset;
            } else if (itemType === 'speed') {
                itemImage = resources.images.powerupSpeed.asset;
            }
            if (itemImage) {
                powerups.push({
                    x: canvas.width / 2 - 15 + (i * 30),
                    y: -30,
                    width: 30, height: 30,
                    speed: 1,
                    type: itemType,
                    image: itemImage,
                });
            }
        }
        dropped3000ScoreItems = true;
    }
    checkCollisions();
}
function updateBackground() {
    if (currentStage === 2) {
        background.y += background.speed;
        if (background.y >= canvas.height) {
            background.y -= canvas.height;
            background.currentImage = background.nextImage;
            const currentIndex = background.backgrounds.indexOf(background.currentImage);
            if (currentIndex !== -1) {
                background.sequenceIndex = currentIndex;
            }
            let nextImage;
            switch (background.sequenceIndex) {
                case 0: nextImage = background.backgrounds[1]; break;
                case 1: nextImage = background.backgrounds[2]; break;
                case 2:
                    if (score >= 2000 && !background.playedExtra2_3) {
                        nextImage = background.backgrounds[2];
                        background.playedExtra2_3 = true;
                    } else if (score >= 2000 && background.playedExtra2_3) {
                        nextImage = background.backgrounds[3];
                    } else {
                        nextImage = background.backgrounds[2];
                    }
                    break;
                case 3: nextImage = background.backgrounds[4]; break;
                case 4: nextImage = background.backgrounds[4]; break;
                default: nextImage = background.currentImage;
            }
            background.nextImage = nextImage;
        }
    } else {
        background.y1 += background.speed;
        background.y2 += background.speed;
        if (background.y1 >= canvas.height) background.y1 = -canvas.height + background.speed;
        if (background.y2 >= canvas.height) background.y2 = -canvas.height + background.speed;
    }
}
function updatePlayer(currentTime) {
    if (player.isDamaged) {
        player.damageTimer -= 16;
        if (player.damageTimer <= 0) {
            player.isDamaged = false;
        }
    }
    player.animationTimer += 16;
    if (player.animationTimer > 150) {
        player.animationFrame += player.animationDirection;
        if (player.animationFrame >= 2) {
            player.animationDirection = -1;
        } else if (player.animationFrame <= 0) {
            player.animationDirection = 1;
        }
        player.animationTimer = 0;
    }
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowLeft || keys.KeyA) player.dx = -player.speed;
    if (keys.ArrowRight || keys.KeyD) player.dx = player.speed;
    if (keys.ArrowUp || keys.KeyW) player.dy = -player.speed;
    if (keys.ArrowDown || keys.KeyS) player.dy = player.speed;
    player.x += player.dx;
    player.y += player.dy;
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
    if ((keys.Space || keys.KeyZ) && (currentTime - player.lastBulletTime > player.fireRate)) {
        fireBullet();
        player.lastBulletTime = currentTime;
    }
}
function updateEntities(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        if(b.dx) b.x += b.dx;
        if(b.dy) b.y -= b.dy;
        if (b.y + b.height < 0 || b.x < -b.width || b.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.type === 'crab') {
            e.x += e.speed * e.dx;
            e.tilt += e.tiltDirection * e.tiltSpeed * deltaTime;
            if (Math.abs(e.tilt) > e.maxTilt) {
                e.tiltDirection *= -1;
            }
            if (e.x + e.width < 0) {
                enemies.splice(i, 1);
            }
        } else {
            e.y += e.speed;
            if (e.y > canvas.height) enemies.splice(i, 1);
        }
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
        const h = hearts[i];
        h.y += h.speed;
        if (h.y > canvas.height) hearts.splice(i, 1);
    }
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed;
        if (p.y > canvas.height) powerups.splice(i, 1);
    }
}
function updateEnemyScaling(deltaTime) {
    const scaleSpeed = 0.0005;
    enemies.forEach(e => {
        if (e.type === 'crab') return;
        e.currentScale += e.scaleDirection * scaleSpeed * deltaTime;
        if (e.scaleDirection === 1 && e.currentScale >= 1.1) {
            e.currentScale = 1.1;
            e.scaleDirection = -1;
        } else if (e.scaleDirection === -1 && e.currentScale <= 0.9) {
            e.currentScale = 0.9;
            e.scaleDirection = 1;
        }
    });
}
function updateEnemyBullets(deltaTime) {
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
}
function updateBoss(deltaTime, currentTime) {
    boss.animationTimer += deltaTime;
    if (boss.animationTimer > 200) {
        boss.animationFrame = (boss.animationFrame + 1) % 2;
        boss.animationTimer = 0;
    }
    if (boss.isDefeated) {
        boss.defeatAlpha -= 0.01;
        boss.defeatScale += 0.01;
        if (boss.defeatAlpha > 0 && Math.random() < 0.5) {
            bossExplosionParticles.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height / 2,
                size: Math.random() * 10 + 5,
                alpha: 1.0,
                speed: Math.random() * 3 + 1,
                direction: Math.random() * Math.PI * 2,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
            });
        }
        if (boss.defeatAlpha <= 0) {
            boss.defeatAlpha = 0;
            gameState = 'stageClear';
            clearScreenTimer = 6000;
            stopBGM();
            playAudio(resources.sounds.gameClear.asset);
        }
        return;
    }
    if (currentStage === 2) {
        boss.hidingTimer -= deltaTime;
        if (boss.hidingState === 'none' && currentTime - boss.lastHideTime > boss.hideInterval) {
            boss.hidingState = 'starting';
            boss.hidingTimer = 400;
            boss.lastHideTime = currentTime;
            const bulletCount = 12;
            const bulletSpeed = BOSS_BULLET_SPEED / 2;
            const bulletX = boss.x + boss.width / 2;
            const bulletY = boss.y + boss.height / 2 + 40;
            for (let i = 0; i < bulletCount; i++) {
                const angle = (i / bulletCount) * Math.PI * 2;
                enemyBullets.push({
                    x: bulletX - 15,
                    y: bulletY - 15,
                    width: 30,
                    height: 30,
                    speed: bulletSpeed,
                    dx: Math.cos(angle) * bulletSpeed,
                    dy: Math.sin(angle) * bulletSpeed,
                    frame: 0,
                    animationTimer: 0,
                });
            }
        }
        switch (boss.hidingState) {
            case 'starting':
                if (boss.hidingTimer <= 0) {
                    boss.hidingState = 'hidden';
                    boss.hidingTimer = 5000;
                }
                return;
            case 'hidden':
                if (boss.hidingTimer <= 0) {
                    boss.hidingState = 'ending';
                    boss.hidingTimer = 400;
                }
                return;
            case 'ending':
                if (boss.hidingTimer <= 0) {
                    boss.hidingState = 'none';
                }
                return;
        }
    }
    boss.animationTimer += deltaTime;
    if (boss.animationTimer > 200) {
        boss.animationFrame = (boss.animationFrame + 1) % 2;
        boss.animationTimer = 0;
    }
    if (boss.y < boss.targetY) {
        boss.y += boss.dy;
        if (boss.y >= boss.targetY) {
            boss.y = boss.targetY;
            boss.dy = 0;
        }
    }
    if (boss.hp <= boss.maxHp / 3 && !boss.isDamagedState) {
        boss.isDamagedState = true;
        console.log("Boss entered damaged state!");
    }
    boss.x += boss.speed * boss.dx;
    if (boss.x + boss.width > canvas.width || boss.x < 0) {
        boss.dx *= -1;
        if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;
        if (boss.x < 0) boss.x = 0;
    }
    const scaleSpeed = 0.0002;
    boss.currentScale += boss.scaleDirection * scaleSpeed * deltaTime;
    if (boss.scaleDirection === 1 && boss.currentScale >= 1.05) {
        boss.currentScale = 1.05;
        boss.scaleDirection = -1;
    } else if (boss.scaleDirection === -1 && boss.currentScale <= 0.95) {
        boss.currentScale = 0.95;
        boss.scaleDirection = 1;
    }
    if (currentTime - boss.lastBossBulletTime > BOSS_FIRE_RATE) {
        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const bulletX1 = boss.x + boss.width / 4;
        const bulletX2 = boss.x + boss.width * 3 / 4;
        const bulletY = boss.y + boss.height - 40;
        let angle1 = Math.atan2(targetY - bulletY, targetX - bulletX1);
        enemyBullets.push({
            x: bulletX1 - 15, y: bulletY, width: 30, height: 30,
            speed: BOSS_BULLET_SPEED, dx: Math.cos(angle1) * BOSS_BULLET_SPEED,
            dy: Math.sin(angle1) * BOSS_BULLET_SPEED, frame: 0, animationTimer: 0,
        });
        let angle2 = Math.atan2(targetY - bulletY, targetX - bulletX2);
        enemyBullets.push({
            x: bulletX2 - 15, y: bulletY, width: 30, height: 30,
            speed: BOSS_BULLET_SPEED, dx: Math.cos(angle2) * BOSS_BULLET_SPEED,
            dy: Math.sin(angle2) * BOSS_BULLET_SPEED, frame: 0, animationTimer: 0,
        });
        boss.lastBossBulletTime = currentTime;
    }
}
function updateBossWarning(deltaTime, currentTime) {
    bossWarningTimer -= deltaTime;
    updateBackground();
    if (itemsDroppedDuringWarning < 10) {
        let itemType;
        if (itemsDroppedDuringWarning < 3) {
            itemType = 'heart';
        } else {
            itemType = Math.random() < 0.5 ? 'threeWay' : 'speed';
        }
        
        let itemImage = null;
        if (itemType === 'threeWay') itemImage = resources.images.powerupThreeWay.asset;
        else if (itemType === 'speed') itemImage = resources.images.powerupSpeed.asset;
        else if (itemType === 'heart') itemImage = resources.images.heartItem.asset;

        if (itemImage) {
            if (itemType === 'heart') {
                hearts.push({
                    x: Math.random() * (canvas.width - 30),
                    y: Math.random() * -100,
                    width: 30, height: 30,
                    speed: 1 + Math.random() * 0.5,
                });
            } else {
                powerups.push({
                    x: Math.random() * (canvas.width - 30),
                    y: Math.random() * -100,
                    width: 30, height: 30,
                    speed: 1 + Math.random() * 0.5,
                    type: itemType,
                    image: itemImage,
                });
            }
            itemsDroppedDuringWarning++;
        }
    }
    if (bossWarningTimer <= 0) {
        isBossActive = true;
        hasBossAppeared = true;
        boss.y = -boss.height; 
        boss.targetY = 50;
        boss.dy = 0.5;
        gameState = 'playing';
        playAudio(resources.sounds.bossBGM.asset, true, true);
        console.log("Boss appeared!");
    }
    updateEntities(deltaTime);
    updatePlayer(currentTime);
    spawnItems(currentTime);
    checkCollisions();
}
function updateBossDefeatAnimation(deltaTime, currentTime) {
    updateBoss(deltaTime, currentTime);
    for (let i = bossExplosionParticles.length - 1; i >= 0; i--) {
        const p = bossExplosionParticles[i];
        p.x += Math.cos(p.direction) * p.speed;
        p.y += Math.sin(p.direction) * p.speed;
        p.alpha -= 0.02;
        p.size += 0.5;
        if (p.alpha <= 0) {
            bossExplosionParticles.splice(i, 1);
        }
    }
    clearScreenTimer -= deltaTime;
}
// --- 生成処理 (Spawn & Fire) ---
let lastEnemySpawnTime = 0, lastHeartSpawnTime = 0, lastPowerupSpawnTime = 0;
function spawnEntities(currentTime) {
    if (currentTime - gameStartTime < 2000) return;
    const elapsedTime = currentTime - gameStartTime;
    if (currentStage === 2 && crabsSpawned < stage2CrabSpawnSchedule.length && elapsedTime >= stage2CrabSpawnSchedule[crabsSpawned]) {
        const spawnTime = stage2CrabSpawnSchedule[crabsSpawned];
        const isSwarm = (spawnTime === 33000 || spawnTime === 40000);
        const spawnCount = isSwarm ? 5 : 1;
        for (let i = 0; i < spawnCount; i++) {
            const enemyBaseWidth = 48;
            const enemyBaseHeight = 32;
            let spawnY = (crabsSpawned === 0) ? Math.random() * 80 + 20 : Math.random() * (canvas.height - 100) + 50;
            enemies.push({
                x: canvas.width,
                y: spawnY,
                width: enemyBaseWidth,
                height: enemyBaseHeight,
                baseWidth: enemyBaseWidth,
                baseHeight: enemyBaseHeight,
                speed: Math.random() * 3 + 4,
                dx: -1,
                dy: 0,
                type: 'crab',
                currentScale: 1.0,
                scaleDirection: 1,
                canShoot: false,
                tilt: 0,
                maxTilt: 7 * Math.PI / 180,
                tiltSpeed: 0.005,
                tiltDirection: 1,
            });
        }
        crabsSpawned++;
    }
    if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
        const enemyBaseWidth = 50;
        const enemyBaseHeight = 50;
        enemies.push({
            x: Math.random() * (canvas.width - enemyBaseWidth),
            y: -enemyBaseHeight,
            width: enemyBaseWidth, 
            height: enemyBaseHeight,
            baseWidth: enemyBaseWidth,
            baseHeight: enemyBaseHeight,
            currentScale: 1.0,
            scaleDirection: Math.random() < 0.5 ? 1 : -1,
            speed: Math.random() * 2 + 1,
            dx: 0,
            dy: 1,
            type: 'normal',
            lastEnemyBulletTime: 0,
            canShoot: Math.random() < 0.5,
        });
        lastEnemySpawnTime = currentTime;
    }
}
function spawnItems(currentTime) {
    const heartInterval = isBossActive ? BOSS_HEART_ITEM_SPAWN_INTERVAL : HEART_ITEM_SPAWN_INTERVAL;
    const powerupInterval = isBossActive ? BOSS_POWERUP_SPAWN_INTERVAL : POWERUP_SPAWN_INTERVAL;
    if (currentTime - lastHeartSpawnTime > heartInterval) {
        hearts.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1 });
        lastHeartSpawnTime = currentTime;
    }
    if (currentTime - lastPowerupSpawnTime > powerupInterval) {
        const itemType = Math.random() < 0.5 ? 'threeWay' : 'speed';
        let itemImage = (itemType === 'threeWay') ? resources.images.powerupThreeWay.asset : resources.images.powerupSpeed.asset;
        if (itemImage) {
            powerups.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30, speed: 1, type: itemType, image: itemImage });
        }
        lastPowerupSpawnTime = currentTime;
    }
}
function fireBullet() {
    playAudio(resources.sounds.fire.asset, false, false, 0.25);
    const baseBullet = { x: player.x + player.width / 2 - 15, y: player.y, width: 30, height: 30, speed: BULLET_SPEED, frame: 0, animationTimer: 0 };
    if (player.shotLevel === 0) bullets.push({ ...baseBullet });
    else if (player.shotLevel === 1) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -2, dy: 0 }); bullets.push({ ...baseBullet, dx: 2, dy: 0 }); }
    else if (player.shotLevel === 2) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -2.5, dy: 0 }); bullets.push({ ...baseBullet, dx: 2.5, dy: 0 }); bullets.push({ ...baseBullet, dx: -1, dy: 1 }); bullets.push({ ...baseBullet, dx: 1, dy: 1 }); }
    else if (player.shotLevel >= 3) { bullets.push({ ...baseBullet }); bullets.push({ ...baseBullet, dx: -3, dy: 0 }); bullets.push({ ...baseBullet, dx: 3, dy: 0 }); bullets.push({ ...baseBullet, dx: -2, dy: 1 }); bullets.push({ ...baseBullet, dx: 2, dy: 1 }); bullets.push({ ...baseBullet, dx: -1, dy: 2 }); bullets.push({ ...baseBullet, dx: 1, dy: 2 }); }
}
function fireEnemyBullets(currentTime) {
    if (score >= 2500) {
        enemies.forEach(e => {
            if (e.canShoot && currentTime - e.lastEnemyBulletTime > ENEMY_FIRE_RATE) {
                const targetX = player.x + player.width / 2;
                const targetY = player.y + player.height / 2;
                const bulletX = e.x + e.width / 2;
                const bulletY = e.y + e.height;
                const angle = Math.atan2(targetY - bulletY, targetX - bulletX);
                enemyBullets.push({
                    x: bulletX - 15, y: bulletY, width: 30, height: 30, speed: ENEMY_BULLET_SPEED,
                    dx: Math.cos(angle) * ENEMY_BULLET_SPEED, dy: Math.sin(angle) * ENEMY_BULLET_SPEED, frame: 0, animationTimer: 0,
                });
                e.lastEnemyBulletTime = currentTime;
            }
        });
    }
}
// --- 衝突判定 (Collision) ---
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                playAudio(resources.sounds.enemyHit.asset);
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 100;
                break;
            }
        }
    }
    if (isBossActive) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (isColliding(bullets[i], boss) && !(currentStage === 2 && boss.hidingState === 'hidden')) {
                playAudio(resources.sounds.enemyHit.asset);
                boss.hp -= 10;
                bullets.splice(i, 1);
                if (boss.hp <= 0) {
                    boss.isDefeated = true;
                    isBossActive = false;
                    score += 5000;
                    console.log("Boss defeated!");
                    gameState = 'bossDefeatAnimation';
                    clearScreenTimer = 6000;
                    stopBGM();
                }
                break;
            }
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {
            playAudio(resources.sounds.playerHit.asset);
            enemies.splice(i, 1);
            if (!player.isDamaged) {
                player.lives--;
                player.isDamaged = true;
                player.damageTimer = 1000;
            }
            if (player.lives <= 0) {
                 player.lives = 0;
                 gameState = 'gameover';
                 stopBGM();
                 playAudio(resources.sounds.gameoverBGM.asset, true, true);
            }
        }
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (isColliding(player, enemyBullets[i])) {
            playAudio(resources.sounds.playerHit.asset);
            enemyBullets.splice(i, 1);
            if (!player.isDamaged) {
                player.lives--;
                player.isDamaged = true;
                player.damageTimer = 1000;
            }
            if (player.lives <= 0) {
                 player.lives = 0;
                 gameState = 'gameover';
                 stopBGM();
                 playAudio(resources.sounds.gameoverBGM.asset, true, true);
            }
        }
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
        if (isColliding(player, hearts[i])) {
            playAudio(resources.sounds.itemGet.asset);
            hearts.splice(i, 1);
            player.lives++;
        }
    }
    for (let i = powerups.length - 1; i >= 0; i--) {
        if (isColliding(player, powerups[i])) {
            playAudio(resources.sounds.itemGet.asset);
            if (powerups[i].type === 'threeWay') {
                player.shotLevel = Math.min(player.shotLevel + 1, 3);
            } else if (powerups[i].type === 'speed') {
                if (player.speedLevel < 5) {
                    player.speedLevel++;
                    player.speed = player.baseSpeed + (player.speedLevel * 0.5);
                }
            }
            powerups.splice(i, 1);
        }
    }
}
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
// --- 描画処理 (Draw) ---
function draw(deltaTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch (gameState) {
        case 'loading': drawLoadingScreen(); break;
        case 'title': drawTitleScreen(); break;
        case 'playing': drawPlayingScreen(deltaTime); break;
        case 'bossWarning': drawBossWarningScreen(deltaTime); break;
        case 'gameover': drawPlayingScreen(deltaTime); drawGameOverScreen(); break;
        case 'bossDefeatAnimation': drawPlayingScreen(deltaTime); drawBoss(); break;
        case 'clear': drawGameClearScreen(); break;
        case 'stageClear': drawStageClearScreen(); break;
    }
}
function drawPlayingScreen(deltaTime) {
    if (currentStage === 2) {
        if (background.currentImage) {
            ctx.drawImage(background.currentImage, 0, background.y, canvas.width, canvas.height);
            ctx.drawImage(background.nextImage, 0, background.y - canvas.height, canvas.width, canvas.height);
        }
    } else {
        ctx.drawImage(resources.images.background.asset, 0, background.y1, canvas.width, canvas.height);
        ctx.drawImage(resources.images.background.asset, 0, background.y2, canvas.width, canvas.height);
    }
    drawEnemies();
    drawItems();
    drawBullets(deltaTime);
    drawEnemyBullets();
    if (isBossActive || boss.isDefeated) {
        drawBoss();
    }
    drawPlayer();
    drawUI();
}
function drawPlayer() {
    const playerImages = [resources.images.player1.asset, resources.images.player2.asset, resources.images.player3.asset];
    let currentImage = playerImages[player.animationFrame];
    if (player.isDamaged) {
        if (Math.floor(player.damageTimer / 100) % 2 === 0) return;
        currentImage = resources.images.playerDamaged.asset;
    }
    if (!currentImage || !currentImage.complete) return;
    ctx.save();
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    ctx.translate(centerX, centerY);
    let tilt = 0;
    if (player.dx < 0) tilt = -TILT_ANGLE;
    else if (player.dx > 0) tilt = TILT_ANGLE;
    ctx.rotate(tilt);
    const shadowImage = resources.images.playerShadow.asset;
    if (shadowImage && shadowImage.complete) {
        const shadowWidth = player.width * 0.8;
        const shadowHeight = player.height * 0.2;
        const shadowOffsetX = -shadowWidth / 2;
        const shadowOffsetY = player.height / 2 - shadowHeight / 2 + 10;
        ctx.drawImage(shadowImage, shadowOffsetX, shadowOffsetY, shadowWidth, shadowHeight);
    }
    ctx.drawImage(currentImage, -player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}
function drawBullets(deltaTime) {
    const bulletImages = [resources.images.bullet01.asset, resources.images.bullet02.asset, resources.images.bullet03.asset];
    bullets.forEach(b => {
        b.animationTimer += deltaTime;
        if (b.animationTimer > 100) {
            b.frame = (b.frame + 1) % bulletImages.length;
            b.animationTimer = 0;
        }
        const currentImage = bulletImages[b.frame];
        if (currentImage && currentImage.complete) {
             ctx.drawImage(currentImage, b.x, b.y, b.width, b.height);
        }
    });
}
function drawEnemies() {
    const shadowImage = resources.images.playerShadow.asset;
    enemies.forEach(e => {
        if (shadowImage && shadowImage.complete) {
            const shadowWidth = e.baseWidth * e.currentScale * 0.8;
            const shadowHeight = e.baseHeight * e.currentScale * 0.2;
            const shadowX = e.x + (e.baseWidth * e.currentScale - shadowWidth) / 2;
            const shadowYOffset = e.type === 'crab' ? 0 : 10;
            const shadowY = e.y + e.baseHeight * e.currentScale - shadowHeight / 2 + shadowYOffset;
            ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight);
        }
        const scaledWidth = e.baseWidth * e.currentScale;
        const scaledHeight = e.baseHeight * e.currentScale;
        const drawX = e.x - (scaledWidth - e.baseWidth) / 2;
        const drawY = e.y - (scaledHeight - e.baseHeight) / 2;
        
        let enemyImage;
        if (e.type === 'crab') {
            enemyImage = resources.images.enemyCrab.asset;
            ctx.save();
            const centerX = drawX + scaledWidth / 2;
            const centerY = drawY + scaledHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(e.tilt);
            ctx.drawImage(enemyImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
            ctx.restore();
        } else {
            enemyImage = resources.images.enemy.asset;
            ctx.drawImage(enemyImage, drawX, drawY, scaledWidth, scaledHeight);
        }
    });
}
function drawItems() {
    hearts.forEach(h => ctx.drawImage(resources.images.heartItem.asset, h.x, h.y, h.width, h.height));
    powerups.forEach(p => ctx.drawImage(p.image, p.x, p.y, p.width, p.height));
}
function drawEnemyBullets() {
    const enemyBulletImages = [resources.images.enemyBullet01.asset, resources.images.enemyBullet02.asset, resources.images.enemyBullet03.asset];
    enemyBullets.forEach(b => {
        const currentImage = enemyBulletImages[b.frame];
        if (currentImage && currentImage.complete) {
            ctx.drawImage(currentImage, b.x, b.y, b.width, b.height);
        }
    });
}
function drawBossExplosionParticles() {
    for (const p of bossExplosionParticles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
function drawBoss() {
    ctx.save();
    if (currentStage === 1) {
        const shadowImage = resources.images.playerShadow.asset;
        if (shadowImage && shadowImage.complete) {
            const shadowWidth = boss.width * boss.currentScale * 0.8;
            const shadowHeight = boss.height * boss.currentScale * 0.2;
            const shadowX = boss.x + (boss.width * boss.currentScale - shadowWidth) / 2;
            const shadowY = boss.y + boss.height * boss.currentScale - shadowHeight / 2 + 10;
            ctx.drawImage(shadowImage, shadowX, shadowY, shadowWidth, shadowHeight);
        }
    }
    if (boss.isDefeated) {
        ctx.globalAlpha = boss.defeatAlpha;
        let defeatedImage = (currentStage === 2) ? resources.images.bossStage2_damaged_1.asset : resources.images.bossDamaged.asset;
        if (defeatedImage && defeatedImage.complete) {
            const naturalWidth = (currentStage === 2) ? defeatedImage.naturalWidth : boss.baseWidth;
            const naturalHeight = (currentStage === 2) ? defeatedImage.naturalHeight : boss.baseHeight;
            const scaledWidth = naturalWidth * boss.defeatScale;
            const scaledHeight = naturalHeight * boss.defeatScale;
            const drawX = boss.x + (boss.width / 2) - (scaledWidth / 2);
            const drawY = boss.y + (boss.height / 2) - (scaledHeight / 2);
            ctx.drawImage(defeatedImage, drawX, drawY, scaledWidth, scaledHeight);
        }
        ctx.restore();
        return;
    }
    if (currentStage === 2 && boss.hidingState === 'hidden') {
        ctx.restore();
        return;
    }
    let bossImage, finalWidth, finalHeight, drawX, drawY;
    if (currentStage === 2) {
        const hideImg1 = resources.images.bossStage2_hide1.asset;
        const hideImg2 = resources.images.bossStage2_hide2.asset;
        switch (boss.hidingState) {
            case 'starting': bossImage = boss.hidingTimer > 200 ? hideImg1 : hideImg2; break;
            case 'ending': bossImage = boss.hidingTimer > 200 ? hideImg2 : hideImg1; break;
            case 'none':
            default:
                if (boss.isDamagedState) {
                    const damagedImages = [resources.images.bossStage2_damaged_1.asset, resources.images.bossStage2_damaged_2.asset];
                    bossImage = damagedImages[boss.animationFrame];
                } else {
                    const regularImages = [resources.images.bossStage2_1.asset, resources.images.bossStage2_2.asset];
                    bossImage = regularImages[boss.animationFrame];
                }
                break;
        }
        if (bossImage && bossImage.complete) {
            finalWidth = bossImage.naturalWidth * boss.currentScale;
            finalHeight = bossImage.naturalHeight * boss.currentScale;
            drawX = boss.x + (boss.width / 2) - (finalWidth / 2);
            drawY = boss.y + (boss.height / 2) - (finalHeight / 2);
        }
    } else {
        bossImage = boss.isDamagedState ? resources.images.bossDamaged.asset : resources.images.boss.asset;
        finalWidth = boss.baseWidth * boss.currentScale;
        finalHeight = boss.baseHeight * boss.currentScale;
        drawX = boss.x - (finalWidth - boss.baseWidth) / 2;
        drawY = boss.y - (finalHeight - boss.baseHeight) / 2;
    }
    if (bossImage && bossImage.complete) ctx.drawImage(bossImage, drawX, drawY, finalWidth, finalHeight);
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
    ctx.restore();
}
function drawUI() {
    ctx.fillStyle = '#6A0DAD';
    ctx.font = '20px "M PLUS Rounded 1c"';
    ctx.textAlign = 'right';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'white';
    const scoreText = `スコア: ${score}`;
    ctx.strokeText(scoreText, canvas.width - 10, 30);
    ctx.fillText(scoreText, canvas.width - 10, 30);
    const heartImage = resources.images.heart.asset;
    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(heartImage, 70 + (30 + 5) * i, 20, 30, 30);
    }
    const faceDecorationImage = resources.images.playerFaceDecoration.asset;
    if (faceDecorationImage && faceDecorationImage.complete) {
        const decorationWidth = faceDecorationImage.width;
        const decorationHeight = faceDecorationImage.height;
        ctx.drawImage(faceDecorationImage, 10, 20, decorationWidth, decorationHeight);
    }
}
function drawLoadingScreen() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Now Loading...', canvas.width / 2, canvas.height / 2);
}

function drawTitleScreen() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4B0082');
    gradient.addColorStop(1, '#DA70D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTitleParticles();
    const logo = resources.images.titleLogo.asset;
    const logoWidth = logo.width * 0.96;
    const logoHeight = logo.height * 0.96;
    ctx.drawImage(logo, canvas.width / 2 - logoWidth / 2, 50, logoWidth, logoHeight);
    
    // ボタンのY座標を計算
    const btnX = canvas.width / 2 - 150;
    const btnY1 = canvas.height / 2 + 150;
    const btnY2 = btnY1 + 60 + 20; // 2つ目のボタンのY座標
    const btnW = 300;
    const btnH = 60;
    
    // 「ぼうけんにでかける」ボタン
    ctx.fillStyle = '#9370DB'; ctx.strokeStyle = '#6A5ACD'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(btnX, btnY1, btnW, btnH, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = '24px "M PLUS Rounded 1c"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ぼうけんに でかける', btnX + btnW / 2, btnY1 + btnH / 2);
    
    // 「あそびかた」ボタン
    ctx.fillStyle = '#9370DB'; ctx.strokeStyle = '#6A5ACD'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(btnX, btnY2, btnW, btnH, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = '24px "M PLUS Rounded 1c"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('あそびかた', btnX + btnW / 2, btnY2 + btnH / 2);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px "Yusei Magic"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '30px "M PLUS Rounded 1c"';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    
    const btnX = canvas.width / 2 - 150;
    const btnY = canvas.height / 2 + 40;
    const btnW = 300;
    const btnH = 60;
    
    ctx.fillStyle = '#9370DB'; 
    ctx.strokeStyle = '#6A5ACD'; 
    ctx.lineWidth = 3;
    ctx.beginPath(); 
    ctx.roundRect(btnX, btnY, btnW, btnH, 15); 
    ctx.fill(); 
    ctx.stroke();
    
    ctx.fillStyle = 'white'; 
    ctx.font = '24px "M PLUS Rounded 1c"'; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText('もう一度プレイする', btnX + btnW / 2, btnY + btnH / 2);
}
function drawBossWarningScreen(deltaTime) {
    drawPlayingScreen(deltaTime);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (Math.floor(bossWarningTimer / 300) % 2 === 0) {
        ctx.save();
        ctx.font = 'bold 80px "Yusei Magic"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = 'ボスせっきんちゅう！';
        const textWidth = ctx.measureText(text).width;
        const gradient = ctx.createLinearGradient(canvas.width / 2 - textWidth / 2, 0, canvas.width / 2 + textWidth / 2, 0);
        gradient.addColorStop(0, '#FFD700'); gradient.addColorStop(0.5, '#FF69B4'); gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 15; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 5;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}
function drawStageClearScreen() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4B0082'); gradient.addColorStop(1, '#DA70D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTitleParticles();
    ctx.fillStyle = 'white';
    ctx.font = '48px "Yusei Magic"';
    ctx.textAlign = 'center';
    ctx.fillText(`ステージ ${currentStage} クリア!`, canvas.width / 2, canvas.height / 2 - 80);
    ctx.font = '30px "M PLUS Rounded 1c"';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
    
    // クリア画面では音ボタンを非表示
    soundToggleButton.style.display = 'none';
    
    clearScreenButtonsContainer.style.display = 'block';
    retryButton.style.display = 'block';
    nextStageButton.style.display = 'block';
    
    if (currentStage === 1) {
        nextStageButton.textContent = 'ステージ2へ';
    } else if (currentStage === 2) {
        nextStageButton.textContent = 'ステージ3へ';
    } else {
        nextStageButton.textContent = 'つぎのステージへ';
    }
}
function drawGameClearScreen() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4B0082'); gradient.addColorStop(1, '#DA70D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTitleParticles();
    ctx.fillStyle = 'white';
    ctx.font = '48px "Yusei Magic"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME CLEAR!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '30px "M PLUS Rounded 1c"';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    soundToggleButton.style.display = 'none';
    clearScreenButtonsContainer.style.display = 'block';
    retryButton.style.display = 'block';
    nextStageButton.style.display = 'none';
}
function createTitleParticle() {
    titleParticles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.5, speed: Math.random() * 0.3 + 0.1, direction: Math.random() * Math.PI * 2 });
}
function updateTitleParticles() {
    for (let i = titleParticles.length - 1; i >= 0; i--) {
        const p = titleParticles[i];
        p.x += Math.cos(p.direction) * p.speed;
        p.y += Math.sin(p.direction) * p.speed;
        p.alpha -= 0.005;
        if (p.alpha <= 0) titleParticles.splice(i, 1);
    }
    while (titleParticles.length < MAX_TITLE_PARTICLES) createTitleParticle();
}
function drawTitleParticles() {
    for (const p of titleParticles) {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
// --- イベントリスナー ---
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (gameState === 'title' && e.code === 'Space') startGame(1);
    if (e.code === 'KeyQ' && (gameState === 'playing' || gameState === 'bossWarning')) score += 1000;
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });
function unlockAudioContext() {
    if (!hasUserInteracted) {
        if (isSoundOn && gameState === 'title' && resources.sounds.titleBGM.asset.readyState >= 2 && resources.sounds.titleBGM.asset.paused) {
            playAudio(resources.sounds.titleBGM.asset, true, true);
        }
        hasUserInteracted = true;
        document.removeEventListener('mousedown', unlockAudioContext);
        document.removeEventListener('keydown', unlockAudioContext);
    }
}
document.addEventListener('mousedown', unlockAudioContext, { once: true });
document.addEventListener('keydown', unlockAudioContext, { once: true });

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickPoint = { x: mouseX, y: mouseY, width: 1, height: 1 };
    
    if (gameState === 'title') {
        const startButton = { x: canvas.width / 2 - 150, y: canvas.height / 2 + 150, width: 300, height: 60 };
        const howToPlayButton = { x: canvas.width / 2 - 150, y: startButton.y + startButton.height + 20, width: 300, height: 60 };
        
        if (isColliding(clickPoint, startButton)) {
            nextStageToStart = 1;
            introVideo.src = 'video/intro.mp4';
            canvas.style.display = 'none';
            soundToggleButton.style.display = 'none';
            videoContainer.style.display = 'block';
            introVideo.load();
            introVideo.play();
        } else if (isColliding(clickPoint, howToPlayButton)) {
            // 操作方法モーダルを表示
            howToPlayModal.style.display = 'block';
        }

    } else if (gameState === 'gameover') {
        const retryButtonCanvas = { x: canvas.width / 2 - 150, y: canvas.height / 2 + 40, width: 300, height: 60 };
        
        if (isColliding(clickPoint, retryButtonCanvas)) {
            startGame(currentStage);
        }
    }
});

retryButton.addEventListener('click', () => {
    clearScreenButtonsContainer.style.display = 'none';
    soundToggleButton.style.display = 'block';
    startGame(currentStage);
});

nextStageButton.addEventListener('click', () => {
    const nextStage = currentStage + 1;

    if (nextStage === 2) { // ステージ1クリア後
        clearScreenButtonsContainer.style.display = 'none';
        soundToggleButton.style.display = 'block';
        startGame(nextStage);
    } else if (nextStage === 3) { // ステージ2クリア後
        clearScreenButtonsContainer.style.display = 'none';
        soundToggleButton.style.display = 'none';
        canvas.style.display = 'none';
        video1.muted = !isSoundOn;
        videoContainer2.style.display = 'block';
        video1.load();
        video1.play();
    }
});
soundToggleButton.addEventListener('click', () => {
    isSoundOn = !isSoundOn;
    setAllAudioMute(!isSoundOn);
    soundToggleButton.textContent = isSoundOn ? '♪ ON' : '♪ OFF';
    if (currentBGM) {
        if (isSoundOn) {
            currentBGM.play().catch(e => console.error("Audio play failed after toggle.", e));
        } else {
            currentBGM.pause();
        }
    }
    soundToggleButton.blur();
});

// モーダルを閉じるボタンのイベントリスナー
if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        howToPlayModal.style.display = 'none';
    });
}


// --- 実行開始 ---
console.log("Script setup complete. Initializing...");
for (let i = 0; i < MAX_TITLE_PARTICLES; i++) createTitleParticle();
loadResources(() => {
    console.log("Resource loading complete. Setting up game.");
    resetGame();
    gameState = 'title';
    
    // タイトル画面で音ボタンを表示
    soundToggleButton.style.display = 'block';

    if (introVideo) {
        introVideo.addEventListener('ended', handleVideoEnd);
    }
    if (skipButton) {
        skipButton.addEventListener('click', () => {
            if (videoContainer && videoContainer.style.display === 'block') {
                introVideo.pause();
                handleVideoEnd();
            }
        });
    }

    if (video1) {
        video1.addEventListener('ended', handleVideo1End);
    }
    if (skipButton2) {
        skipButton2.addEventListener('click', () => {
            if (videoContainer2 && videoContainer2.style.display === 'block') {
                video1.pause();
                handleVideo1End();
            }
        });
    }

    playAudio(resources.sounds.titleBGM.asset, true, true);
    requestAnimationFrame(gameLoop);
});