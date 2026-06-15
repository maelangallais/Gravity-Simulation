
const windowScreen = document.querySelector('#windowScreen');
let widthLimit = Math.floor(window.innerWidth * .5);
let heightLimit = Math.floor(window.innerHeight * .5);

const movingStep = 2;
const G = 6.6743e-11;
const softeningConstant = 5000;
const velocityLimit = 10;

let renderLoop = false;

let collisions = true;
let bounces = false;
let contactThreshold = 0.85;
if (!localStorage.getItem('collisions')) localStorage.setItem('collisions', `${collisions};${bounces};${contactThreshold}`);

const defaultSettings = [0, 0, 0, 0, 1e12, '#00b', false, 0];
let planets = [];
let selectedPlanet = 0;
