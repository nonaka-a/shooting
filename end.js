'use strict';

// HTML要素の取得
const videoContainer = document.getElementById('videoContainer');
const endingVideo = document.getElementById('endingVideo');
const clearScreenContainer = document.getElementById('clearScreenContainer'); // テキストとボタンのコンテナ
const skipButton = document.getElementById('skipButton');
const backToTitleButton = document.getElementById('backToTitleButton');
const startMessage = document.getElementById('startMessage');
const particleCanvas = document.getElementById('particleCanvas'); // パーティクル用キャンバス
const particleCtx = particleCanvas.getContext('2d');
const particles = [];
const MAX_PARTICLES = 150;
let particleAnimationId = null;

// パーティクルを生成する関数
function createParticle() {
    particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        direction: Math.random() * Math.PI * 2
    });
}

// パーティクルを更新・描画する関数
function animateParticles() {
    // 背景グラデーションを描画
    const gradient = particleCtx.createLinearGradient(0, 0, 0, particleCanvas.height);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FF6347');
    particleCtx.fillStyle = gradient;
    particleCtx.fillRect(0, 0, particleCanvas.width, particleCanvas.height);

    // パーティクルを描画
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += Math.cos(p.direction) * p.speed;
        p.y += Math.sin(p.direction) * p.speed;
        p.alpha -= 0.005;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            particleCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            particleCtx.beginPath();
            particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            particleCtx.fill();
        }
    }

    while (particles.length < MAX_PARTICLES) {
        createParticle();
    }

    particleAnimationId = requestAnimationFrame(animateParticles);
}

// クリア画面を表示する関数
function showClearScreen() {
    // ビデオコンテナを非表示にする
    videoContainer.style.display = 'none';

    // パーティクル用キャンバスを表示
    particleCanvas.style.display = 'block';

    // テキストとボタンのコンテナを表示
    clearScreenContainer.style.display = 'block'; 
    
    // BGMを再生
    const clearBGM = new Audio('sounds/gameclear.mp3');
    clearBGM.loop = true;
    clearBGM.play().catch(e => console.error("クリアBGMの再生に失敗:", e));

    // パーティクルアニメーションを開始
    for (let i = 0; i < MAX_PARTICLES; i++) {
        createParticle();
    }
    animateParticles();
}

// ビデオが終了したときの処理
endingVideo.addEventListener('ended', () => {
    console.log('ビデオが終了しました。');
    showClearScreen();
});

// スキップボタンが押されたときの処理
skipButton.addEventListener('click', (event) => {
    event.stopPropagation();
    
    console.log('ビデオをスキップしました。');
    if (!endingVideo.paused) {
        endingVideo.pause();
    }
    showClearScreen();
});

// タイトルへもどるボタンが押されたときの処理
backToTitleButton.addEventListener('click', () => {
    if (particleAnimationId) {
        cancelAnimationFrame(particleAnimationId);
    }
    window.location.href = 'shooting.html';
});

// 画面全体がクリックされたら、ビデオを再生開始する関数
function startVideo() {
    if (startMessage) {
        startMessage.style.display = 'none';
    }

    endingVideo.play().then(() => {
        console.log('ビデオ再生を開始しました。');
    }).catch(error => {
        console.error('ビデオの再生に失敗しました:', error);
        alert('ビデオの再生に失敗しました。クリア画面を表示します。');
        showClearScreen();
    });
}

document.body.addEventListener('click', startVideo, { once: true });