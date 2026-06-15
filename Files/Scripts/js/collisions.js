
function manageCollisions(universe, contactThreshold = .85, bounce = false, isSimulation = false) {
    contactThreshold = bounce ? 1 : contactThreshold;

    let planetsToRemove = new Set();

    for (let i = 0; i < universe.length; i++) {
        for (let j = i + 1; j < universe.length; j++) {
            const planet1 = universe[i];
            const planet2 = universe[j];

            if (planetsToRemove.has(planet1) || planetsToRemove.has(planet2)) continue;

            const dx = planet2.x - planet1.x;
            const dy = planet2.y - planet1.y;

            const distanceSquared = dx * dx + dy * dy;
            let cumulativeRadius = planet1.sphereRadius + planet2.sphereRadius;
            cumulativeRadius *= contactThreshold; //Arbitrary value in order for the merging to appear in more obvious collisions

            if (distanceSquared < cumulativeRadius * cumulativeRadius) {
                const m1 = planet1.mass;
                const m2 = planet2.mass;
                const vx1 = planet1.vx;
                const vy1 = planet1.vy;
                const vx2 = planet2.vx;
                const vy2 = planet2.vy;

                const totalMass = m1 + m2;

                if (bounce) {
                    const distance = Math.sqrt(distanceSquared);

                    const nx = dx / distance;
                    const ny = dy / distance;

                    const overlap = cumulativeRadius - distance;
                    let moveRatio1 = m2 / totalMass;
                    let moveRatio2 = m1 / totalMass;

                    if (planet1.isStatic) {
                        moveRatio1 = 0;
                        moveRatio2 = 1;
                    } else if (planet2.isStatic) {
                        moveRatio1 = 1;
                        moveRatio2 = 0;
                    }

                    planet1.x -= nx * (overlap * moveRatio1);
                    planet1.y -= ny * (overlap * moveRatio1);
                    planet2.x += nx * (overlap * moveRatio2);
                    planet2.y += ny * (overlap * moveRatio2);

                    if (planet1.isStatic && planet2.isStatic) continue;

                    const dvx = vx2 - vx1;
                    const dvy = vy2 - vy1;
                    const speedOnNormal = dvx * nx + dvy * ny;

                    if (speedOnNormal > 0) continue;

                    const invM1 = planet1.isStatic ? 0 : 1 / m1;
                    const invM2 = planet2.isStatic ? 0 : 1 / m2;

                    const restitution = 1;
                    const impulse = (-(1 + restitution) * speedOnNormal) / (invM1 + invM2);

                    const impulseX = nx * impulse;
                    const impulseY = ny * impulse;

                    if (!planet1.isStatic) {
                        planet1.vx -= impulseX * invM1;
                        planet1.vy -= impulseY * invM1;
                    }
                    if (!planet2.isStatic) {
                        planet2.vx += impulseX * invM2;
                        planet2.vy += impulseY * invM2;
                    }

                    continue;
                }

                let [bigP, smallP] = m1 > m2 ? [planet1, planet2] : [planet2, planet1];


                const mergeValues = (value1, value2) => {
                    return Math.round((value1 * m1 + value2 * m2) / totalMass);
                };

                bigP.isStatic = bigP.isStatic || smallP.isStatic;

                if (smallP.isStatic) {
                    bigP.x = smallP.x;
                    bigP.y = smallP.y;
                }

                bigP.vx = mergeValues(vx1, vx2);
                bigP.vy = mergeValues(vy1, vy2);

                {
                    const rgb1 = hexToRgb(planet1.color);
                    const rgb2 = hexToRgb(planet2.color);

                    const newR = mergeValues(rgb1.r, rgb2.r);
                    const newG = mergeValues(rgb1.g, rgb2.g);
                    const newB = mergeValues(rgb1.b, rgb2.b);

                    bigP.color = getHexColor(`rgb(${newR}, ${newG}, ${newB})`);
                }

                bigP.mass = totalMass;

                //I update all the new values that change because of the merging here because it is much more efficient
                // to only update it at the merging instead of at it each frame in the updateSliders method
                if (!isSimulation) {
                    universe.forEach((planet, index) => {
                        if (planet !== bigP) return;

                        const currentPlanetContainer = planetContainers[index];
                        const staticBox = currentPlanetContainer.querySelector('.planetComponentStaticBox');
                        const sliders = currentPlanetContainer.querySelectorAll('.planetComponentSlider');
                        const slidersValues = currentPlanetContainer.querySelectorAll('.planetComponentSliderValue');
                        const colorPicker = currentPlanetContainer.querySelector('.planetComponentColorPicker');

                        staticBox.checked = planet.isStatic;

                        const massSlider = sliders[4];
                        const massSliderValue = slidersValues[4];
                        const radiusSlider = sliders[5];
                        const radiusSliderValue = slidersValues[5];

                        massSlider.value = Math.log10(planet.mass);
                        const rawValue = parseFloat(massSlider.value);
                        const power = Math.floor(rawValue);
                        const value = Math.pow(10, rawValue - power).toFixed(2);
                        massSliderValue.textContent = `${value}e${power}`;

                        colorPicker.value = planet.color;

                        radiusSlider.value = planet.radius;
                        radiusSliderValue.textContent = radiusSlider.value;
                    });
                }

                bigP.radius = !bigP.radius ? Math.hypot(planet1.radius, planet2.radius) : 0;
                bigP.calculateMetrics();

                if (!isSimulation) bigP.updateSphereElement();

                planetsToRemove.add(smallP);
            }
        }
    }

    if (isSimulation) {
        ghostUniverse = ghostUniverse.filter(planet => !planetsToRemove.has(planet));
    } else
    if (planetsToRemove.size > 0) removePlanets(planetsToRemove);
}
