
let keysPressed = new Set();
let eventMoveAnimationId = null;

document.addEventListener('keydown', (event) => {
    const key = event.code;

    if (key == 'Space' && !keysPressed.has('Space')) playSimulation();

    keysPressed.add(key);

    if (eventMoveAnimationId === null) {
        eventMoveAnimationId = requestAnimationFrame(handleEventMovement);

        planets[selectedPlanet].isMoving = true;
    }
});
document.addEventListener('keyup', (event) => {
    keysPressed.delete(event.code);

    if (keysPressed.size === 0) {
        cancelAnimationFrame(eventMoveAnimationId);
        eventMoveAnimationId = null;

        planets[selectedPlanet].isMoving = false;
    }
});
function handleEventMovement() {
    let move = { x: 0, y: 0 };

    if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) move.y -= 1;
    if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) move.x -= 1;
    if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) move.y += 1;
    if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) move.x += 1;

    planets[selectedPlanet].x += move.x * movingStep;
    planets[selectedPlanet].y += move.y * movingStep;

    planets[selectedPlanet].x = Math.max(-widthLimit, Math.min(planets[selectedPlanet].x, widthLimit))
    planets[selectedPlanet].y = Math.max(-heightLimit, Math.min(planets[selectedPlanet].y, heightLimit))

    if (move.x || move.y) {
        updateSliders();

        planets[selectedPlanet].draw();

        setSaveMaskDisplay();
    }

    eventMoveAnimationId = requestAnimationFrame(handleEventMovement);
}


window.addEventListener('resize', () => {
    widthLimit = window.innerWidth / 2;
    heightLimit = window.innerHeight / 2;

    updateSettingsSize();

    simulationCanvas.height = window.innerHeight;
    simulationCanvas.width = window.innerWidth;

    updateSimulation();
});

let simulationFrameCount = 0;
const MAX_SIMULATIONS_FRAMES = 4;

function render(now) {
    planets.forEach(planet => {
        planet.update(planets);
        planet.draw();
    });

    if (collisions) manageCollisions(planets, contactThreshold, bounces);

    updateSliders();

    if (saveSettingsMask.style.display == 'flex') {
        if (generateListForStorage() !== localStorage.getItem('planets')) saveSettingsMask.style.display = 'none';
    }

    requestAnimationFrame(renderSimulation);

    if (renderLoop) requestAnimationFrame(render);
}


function initWindow() {
    collisions = localStorage.getItem('collisions').split(';')[0] == 'true';
    bounces = localStorage.getItem('collisions').split(';')[1] == 'true';
    contactThreshold = parseFloat(localStorage.getItem('collisions').split(';')[2]);
    initCollisionsSettings();

    planets = [];
    selectedPlanet = 0;

    if (!localStorage.getItem('planets')) {
        generatePlanets();
        localStorage.setItem('planets', generateListForStorage());
    } else {
        generatePlanetsFromList(localStorage.getItem('planets'));
    }

    createSliders();

    planetContainers = document.querySelectorAll('#settingsSliders .planetContainer');

    playButton.textContent = 'Launch the simulation';

    simulationCanvas.height = window.innerHeight;
    simulationCanvas.width = window.innerWidth;

    updateSimulation();
}
window.onload = initWindow();
