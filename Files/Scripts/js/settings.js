
const settings = document.querySelector('#settings');
const settingsButton = document.querySelector('#settingsButton');
let settingsState = 0;
settingsButton.addEventListener('click', () => {
    settingsState = 1 - settingsState;

    pauseButton.style.display = settingsState ? 'none' : 'block';

    updateSettingsSize();
});

const settingsScreen = document.querySelector('#settingsScreen');
const settingsWidth = 35;
const settingsHeight = 90;
const maxSettingsWidthInPx = 350;
settingsScreen.style.width = `${settingsWidth}vw`;
settingsScreen.style.height = `${settingsHeight}vh`;

function updateSettingsSize() {
    const intervalDelay = 10; //In ms

    const smallestComponent = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;

    const previousHeight = (settingsState ? settings.clientHeight / window.innerHeight : settings.clientHeight / smallestComponent) * 100;
    const targetHeight = settingsState ? settingsHeight : 5;

    const previousWidth = (settingsState ? settings.clientWidth / window.innerWidth : settings.clientWidth / smallestComponent) * 100;
    let targetWidth = settingsState ? settingsWidth : 5;

    if (settingsState) {
        let targetWidthPx = window.innerWidth * (settingsWidth / 100);
        targetWidthPx = Math.min(targetWidthPx, maxSettingsWidthInPx);
        targetWidth = targetWidthPx / window.innerWidth * 100;
        settingsScreen.style.width = `${targetWidth}vw`;
    }

    settings.style.transition = 'none';

    const dimValue = intervalDelay / 500;
    let t = 0;
    const interval = setInterval(() => {
        height = previousHeight + (targetHeight - previousHeight) * t;
        settings.style.height = `${height}` + (settingsState ? 'vh' : 'vmin');

        width = previousWidth + (targetWidth - previousWidth) * t;
        settings.style.width = `${width}` + (settingsState ? 'vw' : 'vmin');

        if (t > 1) {
            clearInterval(interval);

            if (!settingsState) settings.style.aspectRatio = '1 / 1';
            setTimeout(() => { settings.style.transition = '.5s ease-in-out'; }, intervalDelay * 2);
        }
        t += dimValue;
    }, intervalDelay);

    if (settingsState) settings.style.aspectRatio = 'auto';
}


const playButton = document.querySelector('#playButton');
playButton.addEventListener('click', playSimulation);
function playSimulation() {
    if (renderLoop) {
        renderLoop = false;

        playButton.textContent = 'Resume the simulation';
        pauseButton.textContent = '▶️';
    } else {
        renderLoop = true;
        render();

        playButton.textContent = 'Stop the simulation';
        pauseButton.textContent = '⏸️';
    }
}
const pauseButton = document.querySelector('#pauseButton');
pauseButton.addEventListener('click', playSimulation);

const stepForwardButton = document.querySelector('#stepForward');
stepForwardButton.addEventListener('click', () => {
    if (!renderLoop) render();
});

const resetButton = document.querySelector('#resetButton');
resetButton.addEventListener('click', () => {
    if (renderLoop) playSimulation();

    windowScreen.innerHTML = '';
    initWindow();

    setSaveMaskDisplay();
});

const addPlanetButton = document.querySelector('#addPlanet');
addPlanetButton.addEventListener('click', () => {
    planets.push(new Sphere(...defaultSettings));

    createSliders(planets.length - 1);

    planetContainers = document.querySelectorAll('#settingsSliders .planetContainer');

    setSaveMaskDisplay();
});

const bouncesMask = document.querySelector('#bouncesMask');
const contactThresholdMask = document.querySelector('#contactThresholdMask');

const collisionsButton = document.querySelector('#collisionsButton');
const bouncesButton = document.querySelector('#bouncesButton');
const contactThresholdSlider = document.querySelector('#contactThresholdSlider');
const contactThresholdValue = document.querySelector('#contactThresholdBox .buttonValue');

collisionsButton.addEventListener('input', () => {
    collisions = !collisions;
    bouncesMask.style.display = collisions ? 'none' : 'flex';
    contactThresholdMask.style.display = collisions && !bounces ? 'none' : 'flex';

    setSaveMaskDisplay();
});
bouncesButton.addEventListener('input', () => {
    bounces = !bounces;
    contactThresholdMask.style.display = collisions && !bounces ? 'none' : 'flex';

    setSaveMaskDisplay();
});
contactThresholdSlider.addEventListener('input', () => {
    contactThreshold = parseFloat(contactThresholdSlider.value);
    contactThresholdValue.textContent = `${contactThreshold}s`;

    setSaveMaskDisplay();
});

function initCollisionsSettings() {
    collisionsButton.checked = collisions;

    bouncesButton.checked = bounces;
    bouncesMask.style.display = collisions ? 'none' : 'flex';

    contactThresholdSlider.min = 0;
    contactThresholdSlider.max = 1;
    contactThresholdSlider.step = 0.01;
    contactThresholdSlider.value = contactThreshold;
    contactThresholdValue.textContent = `${contactThreshold}s`;
    contactThresholdMask.style.display = collisions && !bounces ? 'none' : 'flex';
}

const saveSettingsButton = document.querySelector('#saveSettings');
const saveSettingsMask = document.querySelector('#saveMask');
saveSettingsButton.addEventListener('click', () => {
    localStorage.setItem('collisions', `${collisions};${bounces};${contactThreshold}`);
    localStorage.setItem('planets', generateListForStorage());

    saveSettingsMask.style.display = 'flex';
});
saveSettingsMask.style.display = 'flex';


const settingsSliders = document.querySelector('#settingsSliders');
function createSliders(fromIndex = 0) {
    if (!fromIndex) settingsSliders.innerHTML = '';

    planets.forEach((planet, index) => {
        if (index < fromIndex) return;

        const container = document.createElement('div');
        container.className = 'planetContainer';

        const planetName = document.createElement('div');
        planetName.className = 'planetName';
        planetName.textContent = `Planet n°${index + 1}`;

        container.appendChild(planetName);

        const components = ['Is static ?', 'x', 'y', 'vx', 'vy', 'mass', 'color', 'radius', 'remove'];
        for (let i = 0; i < 9; i++) {
            const cc = components[i]; //Current Component

            const component = document.createElement('div');
            component.className = 'planetComponent';

            const name = document.createElement('div');
            name.className = 'planetComponentName';
            name.textContent = cc;

            if (!i) {
                const staticBoxContainer = document.createElement('div');
                staticBoxContainer.className = 'planetComponentStaticBoxContainer';

                const staticBox = document.createElement('input');
                staticBox.className = 'planetComponentStaticBox';
                staticBox.type = 'checkbox';
                staticBox.checked = planet.isStatic;
                staticBox.addEventListener('input', () => {
                    planet.isStatic = staticBox.checked;

                    setSaveMaskDisplay();
                });

                staticBoxContainer.appendChild(staticBox);

                component.appendChild(name);
                component.appendChild(staticBoxContainer);

                component.style.flexDirection = 'row';
                component.style.width = 'fit-content';
                component.style.left = '50%';
                component.style.transform = 'translateX(-50%)';

                container.appendChild(component);

                continue;
            }
            else if (i == 6) {
                const colorContainer = document.createElement('div');
                colorContainer.className = 'planetComponentColorContainer';

                const colorPicker = document.createElement('input');
                colorPicker.className = 'planetComponentColorPicker';
                colorPicker.type = 'color';
                colorPicker.value = planet.color;
                colorPicker.addEventListener('input', () => {
                    planet.color = colorPicker.value;

                    planet.updateSphereElement();

                    setSaveMaskDisplay();
                });

                colorContainer.appendChild(colorPicker);

                component.appendChild(name);
                component.appendChild(colorContainer);

                container.appendChild(component);

                continue;
            } else if (i == 8) {
                const removePlanetButton = document.createElement('button');
                removePlanetButton.className = 'planetComponentRemovePlanet';
                removePlanetButton.textContent = 'Remove planet';

                removePlanetButton.addEventListener('click', () => {
                    removePlanets((new Set()).add(planet));

                    createSliders();

                    setSaveMaskDisplay();
                });

                component.appendChild(removePlanetButton);

                component.style.flexDirection = 'row';
                component.style.width = 'fit-content';
                component.style.left = '50%';
                component.style.transform = 'translateX(-50%)';
                component.style.alignItems = 'center';
                component.style.height = '5vh';

                container.appendChild(component);

                continue;
            }

            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'planetComponentSliderContainer';

            const sliderDecrease = document.createElement('div');
            sliderDecrease.className = 'planetComponentSliderDecrease';
            sliderDecrease.textContent = '<';
            sliderDecrease.addEventListener('click', () => {
                slider.value = parseFloat(slider.value) - parseFloat(slider.step);

                updateSlider();
            });

            const slider = document.createElement('input');
            slider.className = 'planetComponentSlider';
            slider.type = 'range';
            if (i < 3) {
                slider.min = -widthLimit;
                slider.max = widthLimit;
                slider.step = 1;
                slider.value = i == 1 ? planet.x : planet.y;
            } else if (i < 5) {
                slider.min = -velocityLimit;
                slider.max = velocityLimit;
                slider.step = velocityLimit / 100;
                slider.value = i == 3 ? planet.vx : planet.vy;
            } else if (i == 5) {
                slider.min = 11.1;
                slider.max = 15;
                slider.step = 0.01;
                slider.value = Math.log10(planet.mass);
            } else if (i == 7) {
                slider.min = 0;
                slider.max = 20;
                slider.step = 0.1;
                slider.value = planet.radius;
            }
            slider.addEventListener('input', updateSlider);

            const sliderIncrease = document.createElement('div');
            sliderIncrease.className = 'planetComponentSliderIncrease';
            sliderIncrease.textContent = '>';
            sliderIncrease.addEventListener('click', () => {
                slider.value = parseFloat(slider.value) + parseFloat(slider.step);

                updateSlider();
            });

            const sliderValue = document.createElement('div');
            sliderValue.className = 'planetComponentSliderValue';
            updateSliderValue();

            function updateSlider() {
                if (i == 1) planet.x = parseFloat(slider.value);
                else if (i == 2) planet.y = parseFloat(slider.value);
                else if (i == 3) planet.vx = parseFloat(slider.value);
                else if (i == 4) planet.vy = parseFloat(slider.value);
                else if (i == 5) planet.mass = Math.pow(10, parseFloat(slider.value));
                else planet.radius = parseFloat(slider.value);

                updateSliderValue();

                planet.draw();
                if (i > 4) {
                    planet.calculateMetrics();
                    planet.updateSphereElement();
                }

                setSaveMaskDisplay();
            }

            function updateSliderValue() {
                if (i == 5) {
                    const rawValue = parseFloat(slider.value);
                    const power = Math.floor(rawValue);
                    const value = Math.pow(10, rawValue - power).toFixed(2);

                    sliderValue.textContent = `${value}e${power}`;
                } else {
                    sliderValue.textContent = slider.value;
                }
            }

            sliderContainer.appendChild(sliderDecrease);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(sliderIncrease);
            sliderContainer.appendChild(sliderValue);

            component.appendChild(name);
            component.appendChild(sliderContainer);

            container.appendChild(component);
        }

        settingsSliders.appendChild(container);
    });
}

let planetContainers;
function updateSliders() {
    planets.forEach((planet, index) => {
        const currentPlanetContainer = planetContainers[index];
        const sliders = currentPlanetContainer.querySelectorAll('.planetComponentSlider');
        const slidersValues = currentPlanetContainer.querySelectorAll('.planetComponentSliderValue');

        for (let j = 0; j < 4; j++) {
            const slider = sliders[j];
            const sliderValue = slidersValues[j];

            if (j < 2) {
                slider.value = j ? planet.y : planet.x;
                sliderValue.textContent = slider.value;
            } else {
                slider.value = j == 2 ? planet.vx : planet.vy;
                sliderValue.textContent = slider.value;
            }
        }
    });
}

function setSaveMaskDisplay() {
    updateSimulation();

    if (generateListForStorage() !== localStorage.getItem('planets') ||
        `${collisions};${bounces};${contactThreshold}` !== localStorage.getItem('collisions')) {
        saveSettingsMask.style.display = 'none';
    } else {
        saveSettingsMask.style.display = 'flex';
    }
}


//It's in order to prevent the sliders from being focused when the user clicks on them. So they can use the arrows to move anything else
settingsSliders.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('mouseup', () => {
        slider.blur();
    });
    slider.addEventListener('touchend', () => {
        slider.blur();
    });
});
