const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const mazeWidth = window.innerWidth;
const mazeHeight = window.innerHeight;
const cells = 10;

const unitLength = mazeWidth / cells;
const wallDepth = 4;
const speedLimit = unitLength / 10;
const acceleration = unitLength / 30;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: mazeWidth,
        height: mazeHeight,
        wireframes: true
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

const grid = Array(cells).fill(null)
    .map(() => Array(cells).fill(false));
const verticals = Array(cells).fill(null).map(() => Array(cells - 1).fill(false));
const horizontals = Array(cells - 1).fill(null).map(() => Array(cells).fill(false));

const walls = [
    Bodies.rectangle(mazeWidth / 2, 0, mazeWidth, wallDepth * 2, { isStatic: true }),
    Bodies.rectangle(mazeWidth / 2, mazeHeight, mazeWidth, wallDepth * 2, { isStatic: true }),
    Bodies.rectangle(0, mazeHeight / 2, wallDepth * 2, mazeHeight, { isStatic: true }),
    Bodies.rectangle(mazeWidth, mazeHeight / 2, wallDepth * 2, mazeHeight, { isStatic: true })
];
World.add(world, walls);

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
    if (grid[row][column]) {
        return;
    }
    grid[row][column] = true;

    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) {
            continue;
        }
        if (grid[nextRow][nextColumn]) {
            continue;
        }

        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }
        stepThroughCell(nextRow, nextColumn);
    }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            (colIndex + 0.5) * unitLength,
            (rowIndex + 1) * unitLength,
            unitLength,
            wallDepth,
            {
                label: 'wall',
                isStatic: true
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            (colIndex + 1) * unitLength,
            (rowIndex + 0.5) * unitLength,
            wallDepth,
            unitLength,
            {
                label: 'wall',
                isStatic: true
            }
        );
        World.add(world, wall);
    });
});

const goal = Bodies.rectangle(
    mazeWidth - 0.5 * unitLength,
    mazeHeight - 0.5 * unitLength,
    unitLength * 0.7,
    unitLength * 0.7,
    {
        label: 'goal',
        isStatic: true
    }
);
World.add(world, goal);

const ball = Bodies.circle(
    0.5 * unitLength,
    0.5 * unitLength,
    unitLength * 0.25,
    {
        label: 'ball',
    }
)
World.add(world, ball);

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    const newVelocity = { x, y };

    if (event.code === 'KeyW') {
        newVelocity.y -= acceleration;
    }
    if (event.code === 'KeyA') {
        newVelocity.x -= acceleration;
    }
    if (event.code === 'KeyS') {
        newVelocity.y += acceleration;
    }
    if (event.code === 'KeyD') {
        newVelocity.x += acceleration;
    }

    const limitedNewVelocity = applySpeedLimit(newVelocity, speedLimit);
    Body.setVelocity(ball, limitedNewVelocity);
});

const applySpeedLimit = (oldVelocity, speed) => {
    const limitedVelocity = oldVelocity;
    limitedVelocity.x = Math.max(-speed, limitedVelocity.x);
    limitedVelocity.x = Math.min(speed, limitedVelocity.x);
    limitedVelocity.y = Math.max(-speed, limitedVelocity.y);
    limitedVelocity.y = Math.min(speed, limitedVelocity.y);

    return limitedVelocity;
};

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            // User wins
            world.gravity.y = 0.2;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                    Body.setVelocity(body, { x: Math.random() * 10 - 5, y: Math.random() * -10 });
                }
            })
        }
    })
});