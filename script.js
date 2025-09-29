const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');

// Game variables
let score = 0;
let gameOver = false;
let fruits = [];
let nextFruit;

const fruitTypes = [
    { rank: 0, radius: 15, color: '#8A2BE2', name: 'Cherry', score: 1 },
    { rank: 1, radius: 20, color: '#B11D97', name: 'Strawberry', score: 2 },
    { rank: 2, radius: 28, color: '#D80E4B', name: 'Grape', score: 3 },
    { rank: 3, radius: 35, color: '#FF0000', name: 'Dekopon', score: 4 },
    { rank: 4, radius: 45, color: '#FF5500', name: 'Persimmon', score: 5 },
    { rank: 5, radius: 55, color: '#FFAA00', name: 'Apple', score: 6 },
    { rank: 6, radius: 65, color: '#FFFF00', name: 'Pear', score: 7 },
    { rank: 7, radius: 75, color: '#C8E208', name: 'Peach', score: 8 },
    { rank: 8, radius: 85, color: '#90C511', name: 'Pineapple', score: 9 },
    { rank: 9, radius: 100, color: '#59A819', name: 'Melon', score: 10 },
    { rank: 10, radius: 120, color: '#228B22', name: 'Watermelon', score: 11 }
];

let mousePos = { x: 0, y: 0 };

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousemove', (evt) => {
    mousePos = getMousePos(canvas, evt);
});

canvas.addEventListener('mousedown', () => {
    if (nextFruit) {
        const dx = mousePos.x - nextFruit.x;
        const dy = mousePos.y - nextFruit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.min(distance * 0.1, 30); // Proportional to distance, max speed of 30
        const angle = Math.atan2(dy, dx);
        nextFruit.vx = Math.cos(angle) * speed;
        nextFruit.vy = Math.sin(angle) * speed;
        fruits.push(nextFruit);
        nextFruit = null; // Prevent launching another fruit
        setTimeout(() => {
            spawnNextFruit();
        }, 1000);
    }
});

function init() {
    score = 0;
    gameOver = false;
    fruits = [];
    scoreEl.textContent = score;
    gameOverScreen.style.display = 'none';
    spawnNextFruit();
    gameLoop();
}

function spawnNextFruit() {
    const typeIndex = Math.floor(Math.random() * 5);
    nextFruit = { ...fruitTypes[typeIndex], x: canvas.width / 2, y: canvas.height - 50, vx: 0, vy: 0, typeIndex, angle: 0 };
}

function gameLoop() {
    if (gameOver) return;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    fruits.forEach(fruit => {
        // Apply friction
        fruit.vx *= 0.98;
        fruit.vy *= 0.98;

        fruit.x += fruit.vx;
        fruit.y += fruit.vy;

        fruit.angle += fruit.vx * 0.05; // Rotate based on horizontal velocity

        // Wall collisions (all 4 walls)
        if (fruit.x - fruit.radius < 0) {
            fruit.x = fruit.radius;
            fruit.vx *= -0.7;
        } else if (fruit.x + fruit.radius > canvas.width) {
            fruit.x = canvas.width - fruit.radius;
            fruit.vx *= -0.7;
        }
        if (fruit.y - fruit.radius < 0) { // Top wall
            fruit.y = fruit.radius;
            fruit.vy *= -0.7;
        } else if (fruit.y + fruit.radius > canvas.height) { // Bottom wall
            fruit.y = canvas.height - fruit.radius;
            fruit.vy *= -0.7;
        }
    });


    // Fruit collisions
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            const f1 = fruits[i];
            const f2 = fruits[j];
            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = f1.radius + f2.radius;

            if (distance < minDistance) {
                // Collision response
                const angle = Math.atan2(dy, dx);
                const overlap = minDistance - distance;
                const tx = Math.cos(angle) * overlap;
                const ty = Math.sin(angle) * overlap;

                f1.x -= tx / 2;
                f1.y -= ty / 2;
                f2.x += tx / 2;
                f2.y += ty / 2;

                // Elastic collision
                const v1 = { x: f1.vx, y: f1.vy };
                const v2 = { x: f2.vx, y: f2.vy };

                const m1 = f1.radius;
                const m2 = f2.radius;

                const v1_new_x = (v1.x * (m1 - m2) + 2 * m2 * v2.x) / (m1 + m2);
                const v1_new_y = (v1.y * (m1 - m2) + 2 * m2 * v2.y) / (m1 + m2);
                const v2_new_x = (v2.x * (m2 - m1) + 2 * m1 * v1.x) / (m1 + m2);
                const v2_new_y = (v2.y * (m2 - m1) + 2 * m1 * v1.y) / (m1 + m2);

                f1.vx = v1_new_x * 0.95;
                f1.vy = v1_new_y * 0.95;
                f2.vx = v2_new_x * 0.95;
                f2.vy = v2_new_y * 0.95;


                // Merging
                if (f1.typeIndex === f2.typeIndex && f1.typeIndex < fruitTypes.length - 1) {
                    const newTypeIndex = f1.typeIndex + 1;
                                            const newFruit = {
                                                ...fruitTypes[newTypeIndex],
                                                x: (f1.x + f2.x) / 2,
                                                y: (f1.y + f2.y) / 2,
                                                vx: 0,
                                                vy: -2, // A little pop upwards
                                                typeIndex: newTypeIndex,
                                                angle: 0
                                            };                    fruits.splice(j, 1);
                    fruits.splice(i, 1);
                    fruits.push(newFruit);
                    score += fruitTypes[newTypeIndex].score;
                    scoreEl.textContent = score;
                    break;
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw fruits
    fruits.forEach(fruit => {
        // Draw shadow
        ctx.beginPath();
        ctx.arc(fruit.x + 7, fruit.y + 7, fruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = fruit.color;
        ctx.fill();
        ctx.closePath();

        // Draw Face
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.angle);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(1, fruit.radius * 0.05);

        // Eyes
        const eyeX = fruit.radius * 0.35;
        const eyeY = -fruit.radius * 0.2;
        const eyeRadius = fruit.radius * 0.1;
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Mouth
        const mouthY = fruit.radius * 0.1;
        const mouthRadius = fruit.radius * 0.5;
        ctx.beginPath();
        ctx.arc(0, mouthY, mouthRadius, 0, Math.PI, false); // Smiling mouth
        ctx.stroke();

        ctx.restore();
    });

    // Draw aiming line
    if (nextFruit) {
        ctx.beginPath();
        ctx.moveTo(nextFruit.x, nextFruit.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = '#999';
        ctx.stroke();
        ctx.closePath();
    }

    // Draw next fruit (cue ball)
    if (nextFruit) {
        // Draw shadow
        ctx.beginPath();
        ctx.arc(nextFruit.x + 7, nextFruit.y + 7, nextFruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(nextFruit.x, nextFruit.y, nextFruit.radius, 0, Math.PI * 2);
        ctx.fillStyle = nextFruit.color;
        ctx.fill();
        ctx.closePath();

        // Draw Face
        ctx.save();
        ctx.translate(nextFruit.x, nextFruit.y);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(1, nextFruit.radius * 0.05);

        // Eyes
        const eyeX = nextFruit.radius * 0.35;
        const eyeY = -nextFruit.radius * 0.2;
        const eyeRadius = nextFruit.radius * 0.1;
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Mouth
        const mouthY = nextFruit.radius * 0.1;
        const mouthRadius = nextFruit.radius * 0.5;
        ctx.beginPath();
        ctx.arc(0, mouthY, mouthRadius, 0, Math.PI, false); // Smiling mouth
        ctx.stroke();

        ctx.restore();
    }

    // Draw next fruit in UI
    const nextFruitContainer = document.getElementById('next-fruit-container');
    const nextFruitName = document.getElementById('next-fruit-name');
    nextFruitContainer.innerHTML = '';
    if (nextFruit) {
        const fruitCanvas = document.createElement('canvas');
        const fruitCtx = fruitCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const radius = nextFruit.radius;
        fruitCanvas.width = radius * 2 * dpr;
        fruitCanvas.height = radius * 2 * dpr;
        fruitCanvas.style.width = radius * 2 + 'px';
        fruitCanvas.style.height = radius * 2 + 'px';
        fruitCtx.scale(dpr, dpr);

        // Draw fruit
        fruitCtx.beginPath();
        fruitCtx.arc(radius, radius, radius, 0, Math.PI * 2);
        fruitCtx.fillStyle = nextFruit.color;
        fruitCtx.fill();
        fruitCtx.closePath();

        // Draw Face
        fruitCtx.save();
        fruitCtx.translate(radius, radius);
        fruitCtx.fillStyle = 'black';
        fruitCtx.strokeStyle = 'black';
        fruitCtx.lineWidth = Math.max(1, radius * 0.05);

        // Eyes
        const eyeX = radius * 0.35;
        const eyeY = -radius * 0.2;
        const eyeRadius = radius * 0.1;
        fruitCtx.beginPath();
        fruitCtx.arc(-eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        fruitCtx.fill();
        fruitCtx.beginPath();
        fruitCtx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        fruitCtx.fill();

        // Mouth
        const mouthY = radius * 0.1;
        const mouthRadius = radius * 0.5;
        fruitCtx.beginPath();
        fruitCtx.arc(0, mouthY, mouthRadius, 0, Math.PI, false); // Smiling mouth
        fruitCtx.stroke();

        fruitCtx.restore();

        nextFruitContainer.appendChild(fruitCanvas);
        nextFruitName.textContent = nextFruit.name;
    } else {
        nextFruitName.textContent = '';
    }
}

restartButton.addEventListener('click', init);

init();