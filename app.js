const app = new PIXI.Application();
const meteoriteList = [];

const gameContainer = document.getElementById('game-container');
if (gameContainer) {
    gameContainer.appendChild(app.view);
} else {
    document.body.appendChild(app.view);
}

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const background = PIXI.Sprite.from('assets/background.png');
background.width = app.renderer.width;
background.height = app.renderer.height;
app.stage.addChild(background);

let score = 0;
const scoreText = new PIXI.Text('Score: 0', {
    fontFamily: 'Pixelify Sans',
    fontSize: 24,
    fill: 0xffffff,
    align: 'left'
});
scoreText.x = 20;
scoreText.y = 20;
app.stage.addChild(scoreText);

let lives = 3;

const livesText = new PIXI.Text('Lives: ❤️❤️❤️', {
    fontFamily: 'Pixelify Sans',
    fontSize: 24,
    fill: 0xff4757,
    fontWeight: 'bold'
});
livesText.x = 20;
livesText.y = 50;
app.stage.addChild(livesText);

function updateLivesDisplay() {
    let hearts = '';
    for (let i = 0; i < lives; i++) {
        hearts += '❤️';
    }
    livesText.text = 'Lives: ' + (hearts || '💀');
}

const backgroundMusic = new Audio('assets/music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;
backgroundMusic.play().catch(error => {
    console.log("Autoplay blockiert – Musik startet beim ersten Tastendruck.");
});

const laserSound = new Audio('assets/laser.mp3');
laserSound.volume = 0.3;

let isGameOver = false;
let isInvulnerable = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

let rocket = PIXI.Sprite.from('assets/rocket.png');
rocket.scale.set(0.09);

function positionRocket() {
    const rocketWidth = rocket.width || 40;
    const rocketHeight = rocket.height || 50;

    rocket.x = (app.renderer.width - rocketWidth) / 2;
    rocket.y = app.renderer.height - rocketHeight - 20;
    rocket.visible = true;
    rocket.alpha = 1;
}

positionRocket();
app.stage.addChild(rocket);

if (rocket.texture && rocket.texture.baseTexture) {
    if (rocket.texture.baseTexture.valid) {
        positionRocket();
    } else {
        rocket.texture.baseTexture.once('loaded', positionRocket);
    }
}

function showGameOver() {
    if (isGameOver) return;
    isGameOver = true;

    const existingText = app.stage.children.find(
        (child) => child && typeof child.text === 'string' && child.text.toUpperCase().includes('GAME OVER')
    );

    if (!existingText) {
        const gameOverText = new PIXI.Text('GAME OVER', {
            fontFamily: 'Pixelify Sans',
            fontSize: 48,
            fill: 0xff0000,
            fontWeight: 'bold'
        });
        gameOverText.anchor.set(0.5);
        gameOverText.x = app.renderer.width / 2;
        gameOverText.y = app.renderer.height / 2;
        app.stage.addChild(gameOverText);
    }

    if (typeof app !== 'undefined' && app.renderer) {
        app.renderer.render(app.stage);
    }

    if (typeof stopGame === 'function') {
        stopGame();
    }

    if (typeof app !== 'undefined' && app.ticker) {
        app.ticker.stop();
    }
}

gameInterval(function () {
    const meteorite = PIXI.Sprite.from('assets/meteorite' + random(1, 2) + '.png');
    meteorite.x = random(0, 700);
    meteorite.y = -25;
    meteorite.scale.x = 0.13;
    meteorite.scale.y = 0.13;
    app.stage.addChild(meteorite);
    meteoriteList.push(meteorite);
    flyDown(meteorite, 1);

    waitForCollision(meteorite, rocket).then(function () {
        app.stage.removeChild(meteorite);
        const index = meteoriteList.indexOf(meteorite);
        if (index > -1) {
            meteoriteList.splice(index, 1);
        }

        if (isInvulnerable || isGameOver) return;

        lives -= 1;
        updateLivesDisplay();

        if (lives <= 0) {
            if (rocket && rocket.parent) {
                app.stage.removeChild(rocket);
            }
            if (typeof backgroundMusic !== 'undefined') {
                backgroundMusic.pause();
            }
            showGameOver();
        } else {
            isInvulnerable = true;

            let blinkCount = 0;
            const blinkInterval = setInterval(function () {
                rocket.alpha = (rocket.alpha === 1) ? 0.3 : 1;
                blinkCount++;

                if (blinkCount >= 10) {
                    clearInterval(blinkInterval);
                    rocket.alpha = 1;
                    isInvulnerable = false;
                }
            }, 150);
        }
    });
}, 1000);

const rocketMargin = 10;

function leftKeyPressed() {
    if (rocket.x > rocketMargin) {
        rocket.x -= 5;
    }
}

function rightKeyPressed() {
    const maxX = app.renderer.width - rocket.width - rocketMargin;
    if (rocket.x < maxX) {
        rocket.x += 5;
    }
}

function upKeyPressed() {
    if (rocket.y > rocketMargin) {
        rocket.y -= 5;
    }
}

function downKeyPressed() {
    const maxY = app.renderer.height - rocket.height - rocketMargin;
    if (rocket.y < maxY) {
        rocket.y += 5;
    }
}

app.ticker.add(() => {
    if (isGameOver) return;

    if (moveLeft && typeof leftKeyPressed === 'function') {
        leftKeyPressed();
    }
    if (moveRight && typeof rightKeyPressed === 'function') {
        rightKeyPressed();
    }
    if (moveUp && typeof upKeyPressed === 'function') {
        upKeyPressed();
    }
    if (moveDown && typeof downKeyPressed === 'function') {
        downKeyPressed();
    }
});

function spaceKeyPressed() {
    backgroundMusic.play().catch(() => {});

    laserSound.currentTime = 0;
    laserSound.play().catch(() => {});

    const bulletLeft = PIXI.Sprite.from('assets/bullet.png');
    bulletLeft.x = rocket.x + 5;
    bulletLeft.y = rocket.y;
    bulletLeft.scale.x = 0.02;
    bulletLeft.scale.y = 0.02;
    app.stage.addChild(bulletLeft);
    flyUp(bulletLeft);

    waitForCollision(bulletLeft, meteoriteList).then(function ([bullet, meteorite]) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(meteorite);

        const index = meteoriteList.indexOf(meteorite);
        if (index > -1) {
            meteoriteList.splice(index, 1);
        }

        score += 1;
        scoreText.text = 'Score: ' + score;
    });

    const bulletRight = PIXI.Sprite.from('assets/bullet.png');
    bulletRight.x = rocket.x + 45;
    bulletRight.y = rocket.y;
    bulletRight.scale.x = 0.02;
    bulletRight.scale.y = 0.02;
    app.stage.addChild(bulletRight);
    flyUp(bulletRight);

    waitForCollision(bulletRight, meteoriteList).then(function ([bullet, meteorite]) {
        app.stage.removeChild(bullet);
        app.stage.removeChild(meteorite);

        const index = meteoriteList.indexOf(meteorite);
        if (index > -1) {
            meteoriteList.splice(index, 1);
        }

        score += 1;
        scoreText.text = 'Score: ' + score;
    });
}

/* ========================================================== */
/* TOUCH- & POINTER-STEUERUNG FÜR MOBILGERÄTE & HYBRID-LAPTOPS */
/* ========================================================== */

window.addEventListener('DOMContentLoaded', () => {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnFire = document.getElementById('btn-fire');

    function handleStart(e, action) {
        if (e.cancelable) e.preventDefault();
        action();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }

    function handleEnd(e, action) {
        if (e.cancelable) e.preventDefault();
        action();
    }

    function bindHoldButton(btn, setMoving) {
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => handleStart(e, () => setMoving(true)), { passive: false });
        btn.addEventListener('touchend', (e) => handleEnd(e, () => setMoving(false)), { passive: false });
        btn.addEventListener('touchcancel', (e) => handleEnd(e, () => setMoving(false)), { passive: false });

        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setMoving(true); });
        btn.addEventListener('pointerup', (e) => { e.preventDefault(); setMoving(false); });
        btn.addEventListener('pointercancel', () => setMoving(false));

        btn.addEventListener('mousedown', (e) => { e.preventDefault(); setMoving(true); });
        btn.addEventListener('mouseup', (e) => { e.preventDefault(); setMoving(false); });
        btn.addEventListener('mouseleave', () => setMoving(false));
    }

    bindHoldButton(btnLeft, (val) => { moveLeft = val; });
    bindHoldButton(btnRight, (val) => { moveRight = val; });
    bindHoldButton(btnUp, (val) => { moveUp = val; });
    bindHoldButton(btnDown, (val) => { moveDown = val; });

    if (btnFire) {
        btnFire.addEventListener('touchstart', (e) => {
            handleStart(e, () => {
                if (typeof spaceKeyPressed === 'function') spaceKeyPressed();
            });
        }, { passive: false });

        btnFire.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (typeof spaceKeyPressed === 'function') spaceKeyPressed();
            if (document.activeElement) document.activeElement.blur();
        });

        btnFire.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (typeof spaceKeyPressed === 'function') spaceKeyPressed();
            if (document.activeElement) document.activeElement.blur();
        });
    }
});