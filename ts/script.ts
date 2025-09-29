interface FruitType {
    rank: number;
    radius: number;
    color: string;
    name: string;
    score: number;
}

interface GameFruit extends FruitType {
    x: number;
    y: number;
    vx: number;
    vy: number;
    typeIndex: number;
    angle: number;
}

interface QueuedFruit extends FruitType {
    typeIndex: number;
}

interface Position {
    x: number;
    y: number;
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const scoreEl = document.getElementById('score') as HTMLElement;
const finalScoreEl = document.getElementById('final-score') as HTMLElement;
const gameOverScreen = document.getElementById('game-over-screen') as HTMLElement;
const restartButton = document.getElementById('restart-button') as HTMLElement;
const fillGaugeCanvas = document.getElementById('fill-gauge') as HTMLCanvasElement;
const fillPercentageEl = document.getElementById('fill-percentage') as HTMLElement;

// Game variables
let score: number = 0;
let gameOver: boolean = false;
let fruits: GameFruit[] = [];
let fruitToLaunch: GameFruit | null;
let fruitInQueue: QueuedFruit;

const fruitTypes: FruitType[] = [
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

let mousePos: Position = { x: 0, y: 0 };

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Position {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('mousemove', (evt: MouseEvent) => {
    mousePos = getMousePos(canvas, evt);
});

canvas.addEventListener('mousedown', () => {
    if (fruitToLaunch) {
        const dx = mousePos.x - fruitToLaunch.x;
        const dy = mousePos.y - fruitToLaunch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.min(distance * 0.1, 30); // Proportional to distance, max speed of 30
        const angle = Math.atan2(dy, dx);
        fruitToLaunch.vx = Math.cos(angle) * speed;
        fruitToLaunch.vy = Math.sin(angle) * speed;
        fruits.push(fruitToLaunch);
        fruitToLaunch = null; // Prevent launching another fruit
        setTimeout(() => {
            prepareNextFruit();
        }, 1000);
    }
});

function init(): void {
    score = 0;
    gameOver = false;
    fruits = [];
    scoreEl.textContent = score.toString();
    gameOverScreen.style.display = 'none';
    fruitInQueue = generateRandomFruit();
    prepareNextFruit();
    gameLoop();
}

function isOverlapping(x: number, y: number, radius: number): boolean {
    for (let i = 0; i < fruits.length; i++) {
        const fruit = fruits[i];
        const dx = x - fruit.x;
        const dy = y - fruit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius + fruit.radius) {
            return true;
        }
    }
    return false;
}

function generateRandomFruit(): QueuedFruit {
    const typeIndex = Math.floor(Math.random() * 5);
    return { ...fruitTypes[typeIndex], typeIndex: typeIndex };
}

function calculateFillPercentage(): number {
    const totalCanvasArea = canvas.width * canvas.height;
    let occupiedArea = 0;

    fruits.forEach((fruit: GameFruit) => {
        // Calculate the area occupied by each fruit (circle area)
        occupiedArea += Math.PI * fruit.radius * fruit.radius;
    });

    // Return percentage, capped at 100%
    return Math.min((occupiedArea / totalCanvasArea) * 100, 100);
}

function drawFillGauge(): void {
    const gaugeCtx = fillGaugeCanvas.getContext('2d') as CanvasRenderingContext2D;
    const gaugeWidth = fillGaugeCanvas.width;
    const gaugeHeight = fillGaugeCanvas.height;
    const fillPercentage = calculateFillPercentage();

    // Clear the canvas
    gaugeCtx.clearRect(0, 0, gaugeWidth, gaugeHeight);

    // Draw gauge background
    gaugeCtx.fillStyle = '#e0e0e0';
    gaugeCtx.fillRect(0, 0, gaugeWidth, gaugeHeight);

    // Draw 90% threshold line
    const thresholdY = gaugeHeight * 0.1; // 90% from bottom = 10% from top
    gaugeCtx.strokeStyle = '#000';
    gaugeCtx.lineWidth = 2;
    gaugeCtx.setLineDash([5, 5]); // Dashed line
    gaugeCtx.beginPath();
    gaugeCtx.moveTo(0, thresholdY);
    gaugeCtx.lineTo(gaugeWidth, thresholdY);
    gaugeCtx.stroke();
    gaugeCtx.setLineDash([]); // Reset line dash

    // Draw fill level (from bottom up)
    const fillHeight = (fillPercentage / 100) * gaugeHeight;

    // Interpolate colors: dark green (0%) -> yellow (50%) -> red (100%)
    let color: string;
    if (fillPercentage <= 50) {
        // Interpolate from dark green to yellow (0% to 50%)
        const ratio = fillPercentage / 50;
        const r = Math.round(255 * ratio); // 0 to 255
        const g = Math.round(128 + 127 * ratio); // 128 to 255 (dark green to bright green)
        const b = 0; // Always 0
        color = `rgb(${r}, ${g}, ${b})`;
    } else {
        // Interpolate from yellow to red (50% to 100%)
        const ratio = (fillPercentage - 50) / 50;
        const r = 255; // Always 255
        const g = Math.round(255 * (1 - ratio)); // 255 to 0
        const b = 0; // Always 0
        color = `rgb(${r}, ${g}, ${b})`;
    }

    gaugeCtx.fillStyle = color;
    gaugeCtx.fillRect(0, gaugeHeight - fillHeight, gaugeWidth, fillHeight);

    // Draw gauge border
    gaugeCtx.strokeStyle = '#333';
    gaugeCtx.lineWidth = 2;
    gaugeCtx.strokeRect(0, 0, gaugeWidth, gaugeHeight);

    // Update percentage text
    fillPercentageEl.textContent = `${Math.round(fillPercentage)}%`;

    // Check for game over condition
    if (fillPercentage >= 90 && !gameOver) {
        gameOver = true;
        finalScoreEl.textContent = score.toString();
        gameOverScreen.style.display = 'block';
    }
}

function prepareNextFruit(): void {
    const newFruitType: QueuedFruit = fruitInQueue;
    fruitInQueue = generateRandomFruit();

    const radius = newFruitType.radius;
    const y = canvas.height - 50;
    let x = canvas.width / 2;

    if (isOverlapping(x, y, radius)) {
        let searchOffset = 5; // Start searching 5px away
        while (true) {
            // Check right
            let rightX = x + searchOffset;
            if (rightX + radius < canvas.width && !isOverlapping(rightX, y, radius)) {
                x = rightX;
                break;
            }
            // Check left
            let leftX = x - searchOffset;
            if (leftX - radius > 0 && !isOverlapping(leftX, y, radius)) {
                x = leftX;
                break;
            }
            searchOffset += 5; // search in 5px steps
            if (x - searchOffset < 0 && x + searchOffset > canvas.width) {
                // No space found, just spawn in the middle and let it overlap
                break;
            }
        }
    }

    fruitToLaunch = {
        ...newFruitType,
        x,
        y,
        vx: 0,
        vy: 0,
        angle: 0
    };
}

function gameLoop(): void {
    if (gameOver) return;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update(): void {
    fruits.forEach((fruit: GameFruit) => {
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
                    const newFruitType = fruitTypes[newTypeIndex];

                    // Conserve momentum for the new fruit's velocity
                    const m1 = f1.radius;
                    const m2 = f2.radius;
                    const newMass = newFruitType.radius;
                    const newVx = ((m1 * f1.vx + m2 * f2.vx) / newMass) * 0.5;
                    const newVy = ((m1 * f1.vy + m2 * f2.vy) / newMass) * 0.5;

                    const newFruit: GameFruit = {
                        ...newFruitType,
                        x: (f1.x + f2.x) / 2,
                        y: (f1.y + f2.y) / 2,
                        vx: newVx,
                        vy: newVy,
                        typeIndex: newTypeIndex,
                        angle: 0
                    };
                    fruits.splice(j, 1);
                    fruits.splice(i, 1);
                    fruits.push(newFruit);
                    score += fruitTypes[newTypeIndex].score;
                    scoreEl.textContent = score.toString();
                    break;
                }
            }
        }
    }
}

function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw fruits
    fruits.forEach((fruit: GameFruit) => {
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
    if (fruitToLaunch) {
        const dx = mousePos.x - fruitToLaunch.x;
        const dy = mousePos.y - fruitToLaunch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxLength = canvas.width * 0.25; // Quarter of the canvas width

        let endX, endY;
        if (distance > maxLength) {
            // Limit the line length to quarter of the canvas width
            const angle = Math.atan2(dy, dx);
            endX = fruitToLaunch.x + Math.cos(angle) * maxLength;
            endY = fruitToLaunch.y + Math.sin(angle) * maxLength;
        } else {
            endX = mousePos.x;
            endY = mousePos.y;
        }

        ctx.beginPath();
        ctx.moveTo(fruitToLaunch.x, fruitToLaunch.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 3; // Thicker line
        ctx.setLineDash([10, 5]); // Dotted line pattern: 10px dash, 5px gap
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]); // Reset line dash for other drawings
    }

    // Draw next fruit (cue ball)
    if (fruitToLaunch) {
        // Draw shadow
        ctx.beginPath();
        ctx.arc(fruitToLaunch.x + 7, fruitToLaunch.y + 7, fruitToLaunch.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(fruitToLaunch.x, fruitToLaunch.y, fruitToLaunch.radius, 0, Math.PI * 2);
        ctx.fillStyle = fruitToLaunch.color;
        ctx.fill();
        ctx.closePath();

        // Draw Face
        ctx.save();
        ctx.translate(fruitToLaunch.x, fruitToLaunch.y);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(1, fruitToLaunch.radius * 0.05);

        // Eyes
        const eyeX = fruitToLaunch.radius * 0.35;
        const eyeY = -fruitToLaunch.radius * 0.2;
        const eyeRadius = fruitToLaunch.radius * 0.1;
        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Mouth
        const mouthY = fruitToLaunch.radius * 0.1;
        const mouthRadius = fruitToLaunch.radius * 0.5;
        ctx.beginPath();
        ctx.arc(0, mouthY, mouthRadius, 0, Math.PI, false); // Smiling mouth
        ctx.stroke();

        ctx.restore();
    }

    // Draw next fruit in UI
    const nextFruitContainer = document.getElementById('next-fruit-container') as HTMLElement;
    const nextFruitName = document.getElementById('next-fruit-name') as HTMLElement;
    nextFruitContainer.innerHTML = '';
    if (fruitInQueue) {
        const fruitCanvas = document.createElement('canvas');
        const fruitCtx = fruitCanvas.getContext('2d') as CanvasRenderingContext2D;
        const dpr = window.devicePixelRatio || 1;
        const radius = fruitInQueue.radius;
        fruitCanvas.width = radius * 2 * dpr;
        fruitCanvas.height = radius * 2 * dpr;
        fruitCanvas.style.width = radius * 2 + 'px';
        fruitCanvas.style.height = radius * 2 + 'px';
        fruitCtx.scale(dpr, dpr);

        // Draw fruit
        fruitCtx.beginPath();
        fruitCtx.arc(radius, radius, radius, 0, Math.PI * 2);
        fruitCtx.fillStyle = fruitInQueue.color;
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
        nextFruitName.textContent = fruitInQueue.name;
    } else {
        nextFruitName.textContent = '';
    }

    // Update fill gauge
    drawFillGauge();
}

restartButton.addEventListener('click', init);

init();
