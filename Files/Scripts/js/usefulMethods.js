
function getHexColor(color) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    return ctx.fillStyle;
}
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    }
}


function generatePlanets() {
    //Values are strange but they are the ones we can reach via the slider
    //Like this when you raise and decrease the value, it comes back to its original value
    //It allows my saveButtonMask to re-appear because you didn't change any value
    planets = [
        // new Sphere(),
        new Sphere(76, 123, 0.1, 0, 1e12, 'blanchedalmond'),
        new Sphere(176, -123, 0.1, 0.5, 6025595860743.568, 'blanchedalmond', true),
        new Sphere(-76, -212, 0, 0, 50118723362727.15, '#fe5b07')
    ];
}


function generateListForStorage() {
    const list = [];

    planets.forEach(planet => {
        list.push([planet.x, planet.y, planet.vx, planet.vy, planet.mass, planet.color, planet.isStatic, planet.radius]);
    });

    return JSON.stringify(list);
}
function generatePlanetsFromList(storageList) {
    const list = JSON.parse(storageList);

    planets = [];

    list.forEach(planet => {
        planets.push(new Sphere(...planet));
    });
}


let lastFpsTime = performance.now();
let frameCount = 0;
//To call at the end of a loop method like render() in this case
function calculateFPS() {
    const currentTime = performance.now();

    frameCount++;

    if (currentTime - lastFpsTime >= 1000) {
        console.log(`FPS : ${frameCount}`);

        frameCount = 0;
        lastFpsTime = currentTime;
    }
}
