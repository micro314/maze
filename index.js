const { Engine, Render, Runner, World, Bodies } = Matter;

const mazeWidth = 500;
const mazeHeight = 500;
const cells = 5;

const unitLength = mazeWidth / cells;
const wallDepth = 4;

const engine = Engine.create();
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
            { isStatic: true },
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
            { isStatic: true }
        );
        World.add(world, wall);
    });
});

const goal = Bodies.rectangle(
    mazeWidth - 0.5 * unitLength,
    mazeHeight - 0.5 * unitLength,
    unitLength * 0.7,
    unitLength * 0.7,
    { isStatic: true }
);
World.add(world, goal);

const ball = Bodies.circle(
    0.5 * unitLength,
    0.5 * unitLength,
    unitLength * 0.25
)
World.add(world, ball);