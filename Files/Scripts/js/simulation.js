
const simulationCanvas = document.querySelector('#simulationCanvas');

const ctx = simulationCanvas.getContext('2d');
ctx.translate(simulationCanvas.width / 2, simulationCanvas.height / 2);


let futurePaths = [];
let ghostUniverse = [];

function renderSimulation() {
    ctx.resetTransform();
    ctx.clearRect(0, 0, simulationCanvas.width, simulationCanvas.height);

    ctx.translate(simulationCanvas.width * 0.5, simulationCanvas.height * 0.5);

    updatePredictions();

    planets.forEach((planet, index) => {
        const path = futurePaths[index];
        if (!path || path.length === 0) return;

        ctx.beginPath();
        ctx.moveTo(planet.x, planet.y);

        path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });

        ctx.strokeStyle = planet.color;
        ctx.stroke();
    });
}

function calculateTrajectories(start = 0, steps = 600) {
    if (ghostUniverse.length != planets.length) start = 0;

    if (!start) {
        futurePaths = planets.map(() => []);

        ghostUniverse = planets.map((planet, index) => {
            const clone = planet.clone();
            clone.originalIndex = index;
            return clone;
        });
    }

    for (let i = start; i < steps; i++) {
        ghostUniverse.forEach((ghost) => {
            ghost.update(ghostUniverse);

            if (start) futurePaths[ghost.originalIndex].shift();
            futurePaths[ghost.originalIndex].push({ x: ghost.x, y: ghost.y });
        });

        if (collisions) manageCollisions(ghostUniverse, contactThreshold, bounces, true);
    }
}

function updateSimulation() {
    calculateTrajectories();
    renderSimulation();
}

let syncCounter = 0;
const SYNC_INTERVAL = 60;

function updatePredictions() {
    syncCounter++;

    if (syncCounter >= SYNC_INTERVAL) {
        calculateTrajectories(0);
        syncCounter = 0;
    } else {
        calculateTrajectories(599);
    }
}
