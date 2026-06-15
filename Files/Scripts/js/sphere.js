
class Sphere {
    constructor(x = 0, y = 0, vx = 0, vy = 0, mass = 1e14, color = 'black', isStatic = false, radius = 0, isHtmlElement = true) {
        this.x = x;
        this.y = y;
        this.previousPosition = { x: 0, y: 0 };

        this.isStatic = isStatic;

        this.vx = vx;
        this.vy = vy;

        this.mass = mass;
        this.color = getHexColor(color);
        this.radius = radius;
        this.calculateMetrics();

        this.isHtmlElement = isHtmlElement;

        this.isDragging = false;
        this.isMoving = false;

        if (this.isHtmlElement) this.init();
        else this.sphereRadius = this.size * (window.innerHeight > window.innerWidth ? window.innerWidth : window.innerHeight) / 200;
    }

    calculateMetrics() {
        this.attractionForce = G * this.mass;

        //If a radius is defined, then we set the size of the planet to be at this radius
        if (!this.radius) {
            //The mass must be superior to 11 in order for the planet to be visible since I scale the planets relative to their mass
            this.size = Math.log10(this.mass) - 11;
            //otherwise, we put something more visual, the size is defined by the mass.
        } else {
            this.size = this.radius;
        }
    }

    init() {
        this.element = document.createElement("div");
        this.element.className = 'sphere';

        this.updateSphereElement();

        windowScreen.appendChild(this.element);

        this.sphereRadius = this.element.clientHeight * .5;

        this.initEvents();

        this.draw();
    }

    updateSphereElement() {
        this.element.style.height = `${this.size}vmin`;
        this.sphereRadius = this.element.clientHeight * .5;

        this.element.style.backgroundColor = this.color;
    }

    initEvents() {
        this.element.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousPosition = { x: e.clientX, y: e.clientY };
            this.element.classList.add('grabbing');

            selectedPlanet = planets.indexOf(this);
        });

        this.element.addEventListener('mouseup', () => { this.stopGrabbing(); });
        this.element.addEventListener('mouseleave', () => { this.stopGrabbing(); });

        this.element.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.previousPosition.x;
                const deltaY = e.clientY - this.previousPosition.y;

                this.x += deltaX;
                this.y += deltaY;

                this.draw();

                //I update x and y values of the sliders here because it is more efficient
                // to only update it now, and only update this sliders, instead of at it each frame in the updateSliders method
                planets.forEach((planet, index) => {
                    if (planet !== this) return;

                    const currentPlanetContainer = planetContainers[index];
                    const sliders = currentPlanetContainer.querySelectorAll('.planetComponentSlider');
                    const slidersValues = currentPlanetContainer.querySelectorAll('.planetComponentSliderValue');

                    const xSlider = sliders[0];
                    const xSliderValue = slidersValues[0];
                    const ySlider = sliders[1];
                    const ySliderValue = slidersValues[1];

                    xSlider.value = planet.x;
                    xSliderValue.textContent = xSlider.value;

                    ySlider.value = planet.y;
                    ySliderValue.textContent = ySlider.value;
                });

                this.previousPosition = { x: e.clientX, y: e.clientY };

                setSaveMaskDisplay();
            }
        });
    }

    stopGrabbing() {
        if (this.isDragging) {
            this.isDragging = false;
            this.element.classList.remove('grabbing');

            //If when you move the planet by yourself, you want to reset its velocity components it's here
            // this.vx = 0;
            // this.vy = 0;
        }
    }

    draw() {
        //Before, I limited the planet to always stay in the window, I kept in case it could be useful
        // this.x = Math.min(Math.max(this.sphereRadius - widthLimit, this.x), widthLimit - this.sphereRadius - 1);
        // this.y = Math.min(Math.max(this.sphereRadius - heightLimit, this.y), heightLimit - this.sphereRadius - 1);

        this.element.style.transform = `translate(${this.x - this.sphereRadius}px, ${this.y - this.sphereRadius}px)`;
    }

    update(planets) {
        if (this.isStatic) return;

        let totalAx = 0;
        let totalAy = 0;

        const mergingPlanetes = [];

        for (const planet of planets) {
            if (planet === this) continue;

            const dx = planet.x - this.x;
            const dy = planet.y - this.y;

            const distanceSquared = dx * dx + dy * dy;
            const distance = Math.sqrt(distanceSquared);

            if (distance >= 1) {
                const acceleration = planet.attractionForce / (distanceSquared + softeningConstant);

                totalAx += acceleration * (dx / distance);
                totalAy += acceleration * (dy / distance);
            }
        }

        this.vx += totalAx;
        this.vy += totalAy;

        //Here I restrict the velocity to exceed a certain threshold
        this.vx = Math.max(-velocityLimit, Math.min(this.vx, velocityLimit));
        this.vy = Math.max(-velocityLimit, Math.min(this.vy, velocityLimit));

        this.x += this.vx;
        this.y += this.vy;

        //Now I inverse the velocity component of the planet that is out of bond to keep its velocity while staying visible on the screen
        if (this.x > widthLimit + this.sphereRadius && this.vx > 0) this.vx = -this.vx;
        if (this.x < -widthLimit - this.sphereRadius && this.vx < 0) this.vx = -this.vx;
        if (this.y > heightLimit + this.sphereRadius && this.vy > 0) this.vy = -this.vy;
        if (this.y < -heightLimit - this.sphereRadius && this.vy < 0) this.vy = -this.vy;
    }

    clone() {
        return new Sphere(this.x, this.y, this.vx, this.vy, this.mass, this.color, this.isStatic, this.radius, false);
    }
}

function removePlanets(planetsToRemove) {
    const indicesToRemove = [...planetsToRemove].map(planet => planets.indexOf(planet));

    planets = planets.filter(planet => !planetsToRemove.has(planet));

    planetsToRemove.forEach(planet => planet.element.remove());

    for (const index of indicesToRemove) {
        const planetContainer = planetContainers[index];

        planetContainer.remove();
    }

    planetContainers = document.querySelectorAll('#settingsSliders .planetContainer');

    for (let i = 0; i < planetContainers.length; i++) {
        planetContainers[i].querySelector('.planetName').textContent = `Planet n°${i + 1}`;
    }

    //Used to stop the simulation when it only remains one static planet
    //I could check way more like if it only remained static planets but it's a bit useless
    if (planets.length == 1 && render && planets[0].vx == 0 && planets[0].vy == 0) playSimulation();
}
