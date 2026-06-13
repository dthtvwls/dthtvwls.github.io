/**
 * @jest-environment jsdom
 */

const { Matrix, World, wrap, CELL_COLORS } = require("./app");

// Helper: create a World without auto-stepping or intervals
function createWorld(cols, rows, cellSize = 20) {
  const canvas = document.createElement("canvas");
  canvas.width = rows * cellSize;
  canvas.height = cols * cellSize;
  canvas.getContext = () => ({
    fillStyle: "",
    fillRect: jest.fn(),
  });

  // Prevent constructor from calling step() and setInterval()
  const origStep = World.prototype.step;
  World.prototype.step = function () {};
  const origSetInterval = global.setInterval;
  global.setInterval = jest.fn();

  const world = new World(canvas, cellSize);

  World.prototype.step = origStep;
  global.setInterval = origSetInterval;

  return world;
}

// ──────────────────────────────────────────────
// Matrix
// ──────────────────────────────────────────────
describe("Matrix", () => {
  test("creates an array with correct dimensions", () => {
    const m = Matrix(3, 5);
    expect(m.length).toBe(3);
    m.forEach((row) => expect(row.length).toBe(5));
  });

  test("creates an empty matrix when randomFill is false", () => {
    const m = Matrix(2, 2, false);
    expect(m[0][0]).toBeUndefined();
    expect(m[1][1]).toBeUndefined();
  });

  test("fills every cell with 0 or 1 when randomFill is true", () => {
    const m = Matrix(10, 10, true);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        expect([0, 1]).toContain(m[y][x]);
      }
    }
  });

  test("handles a 1×1 matrix", () => {
    const m = Matrix(1, 1, true);
    expect(m.length).toBe(1);
    expect(m[0].length).toBe(1);
    expect([0, 1]).toContain(m[0][0]);
  });

  test("handles a 0-row matrix", () => {
    const m = Matrix(0, 5);
    expect(m.length).toBe(0);
  });
});

// ──────────────────────────────────────────────
// World.isCellAlive  (Conway's Game of Life rules)
// ──────────────────────────────────────────────
describe("World.isCellAlive", () => {
  let world;

  beforeEach(() => {
    world = createWorld(5, 5);
    // Start with all dead cells
    world.data = Matrix(5, 5);
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) world.data[y][x] = 0;
  });

  test("dead cell with exactly 3 neighbors becomes alive", () => {
    world.data[0][1] = 1;
    world.data[1][0] = 1;
    world.data[1][1] = 1;
    // cell (0,0) has 3 neighbors → birth
    expect(world.isCellAlive(0, 0)).toBeTruthy();
  });

  test("dead cell with 2 neighbors stays dead", () => {
    world.data[0][1] = 1;
    world.data[1][0] = 1;
    expect(world.isCellAlive(0, 0)).toBeFalsy();
  });

  test("dead cell with 4 neighbors stays dead (overpopulation)", () => {
    world.data[0][1] = 1;
    world.data[1][0] = 1;
    world.data[1][1] = 1;
    world.data[4][0] = 1; // wraps north
    expect(world.isCellAlive(0, 0)).toBeFalsy();
  });

  test("live cell with 2 neighbors survives", () => {
    world.data[1][1] = 1; // the cell itself
    world.data[0][1] = 1;
    world.data[1][0] = 1;
    expect(world.isCellAlive(1, 1)).toBeTruthy();
  });

  test("live cell with 3 neighbors survives", () => {
    world.data[1][1] = 1;
    world.data[0][0] = 1;
    world.data[0][1] = 1;
    world.data[1][0] = 1;
    expect(world.isCellAlive(1, 1)).toBeTruthy();
  });

  test("live cell with 1 neighbor dies (underpopulation)", () => {
    world.data[1][1] = 1;
    world.data[0][1] = 1;
    expect(world.isCellAlive(1, 1)).toBeFalsy();
  });

  test("live cell with 0 neighbors dies", () => {
    world.data[2][2] = 1;
    expect(world.isCellAlive(2, 2)).toBeFalsy();
  });

  test("live cell with 4+ neighbors dies (overpopulation)", () => {
    world.data[1][1] = 1;
    world.data[0][0] = 1;
    world.data[0][1] = 1;
    world.data[0][2] = 1;
    world.data[1][0] = 1;
    expect(world.isCellAlive(1, 1)).toBeFalsy();
  });

  test("wraps around on the top edge", () => {
    // cell (0,2) — its north neighbor wraps to row 4
    world.data[4][1] = 1;
    world.data[4][2] = 1;
    world.data[4][3] = 1;
    expect(world.isCellAlive(0, 2)).toBeTruthy();
  });

  test("wraps around on the left edge", () => {
    // cell (2,0) — its west neighbor wraps to col 4
    world.data[1][4] = 1;
    world.data[2][4] = 1;
    world.data[3][4] = 1;
    expect(world.isCellAlive(2, 0)).toBeTruthy();
  });

  test("wraps around on the bottom edge", () => {
    // cell (4,2) — its south neighbor wraps to row 0
    world.data[0][1] = 1;
    world.data[0][2] = 1;
    world.data[0][3] = 1;
    expect(world.isCellAlive(4, 2)).toBeTruthy();
  });

  test("wraps around on the right edge", () => {
    // cell (2,4) — its east neighbor wraps to col 0
    world.data[1][0] = 1;
    world.data[2][0] = 1;
    world.data[3][0] = 1;
    expect(world.isCellAlive(2, 4)).toBeTruthy();
  });

  test("corner cell wraps in both directions", () => {
    // cell (0,0) — neighbors include (4,4), (4,0), (0,4)
    world.data[4][4] = 1;
    world.data[4][0] = 1;
    world.data[0][4] = 1;
    expect(world.isCellAlive(0, 0)).toBeTruthy();
  });
});

// ──────────────────────────────────────────────
// World.step  (known Game of Life patterns)
// ──────────────────────────────────────────────
describe("World.step", () => {
  let world;

  beforeEach(() => {
    world = createWorld(6, 6);
  });

  function clearGrid() {
    world.data = Matrix(world.cols, world.rows);
    for (let y = 0; y < world.cols; y++)
      for (let x = 0; x < world.rows; x++) world.data[y][x] = 0;
  }

  function getAlive() {
    const alive = [];
    for (let y = 0; y < world.cols; y++)
      for (let x = 0; x < world.rows; x++)
        if (world.data[y][x]) alive.push([y, x]);
    return alive;
  }

  test("block (2×2 still life) is stable", () => {
    clearGrid();
    world.data[1][1] = 1;
    world.data[1][2] = 1;
    world.data[2][1] = 1;
    world.data[2][2] = 1;

    world.step();
    expect(getAlive()).toEqual(
      expect.arrayContaining([
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ]),
    );
    expect(getAlive().length).toBe(4);
  });

  test("blinker oscillates (period 2)", () => {
    clearGrid();
    // Horizontal blinker at row 2
    world.data[2][1] = 1;
    world.data[2][2] = 1;
    world.data[2][3] = 1;

    // After one step → vertical
    world.step();
    expect(world.data[1][2]).toBeTruthy();
    expect(world.data[2][2]).toBeTruthy();
    expect(world.data[3][2]).toBeTruthy();
    expect(world.data[2][1]).toBeFalsy();
    expect(world.data[2][3]).toBeFalsy();

    // After two steps → back to horizontal
    world.step();
    expect(world.data[2][1]).toBeTruthy();
    expect(world.data[2][2]).toBeTruthy();
    expect(world.data[2][3]).toBeTruthy();
    expect(world.data[1][2]).toBeFalsy();
    expect(world.data[3][2]).toBeFalsy();
  });

  test("all-dead grid stays dead", () => {
    clearGrid();
    world.step();
    expect(getAlive().length).toBe(0);
  });

  test("single live cell dies", () => {
    clearGrid();
    world.data[3][3] = 1;
    world.step();
    expect(getAlive().length).toBe(0);
  });

  test("two adjacent cells die", () => {
    clearGrid();
    world.data[2][2] = 1;
    world.data[2][3] = 1;
    world.step();
    expect(getAlive().length).toBe(0);
  });

  test("step calls canvas rendering methods", () => {
    clearGrid();
    world.data[1][1] = 1;
    world.data[1][2] = 1;
    world.data[2][1] = 1;
    world.data[2][2] = 1;

    world.step();
    expect(world.context.fillRect).toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────
// World constructor
// ──────────────────────────────────────────────
describe("World constructor", () => {
  test("computes cols and rows from canvas dimensions", () => {
    const world = createWorld(10, 8, 20);
    expect(world.cols).toBe(10);
    expect(world.rows).toBe(8);
  });

  test("initialises data grid matching cols × rows", () => {
    const world = createWorld(4, 6, 10);
    expect(world.data.length).toBe(4);
    world.data.forEach((row) => expect(row.length).toBe(6));
  });
});

// ──────────────────────────────────────────────
// wrap helper
// ──────────────────────────────────────────────
describe("wrap", () => {
  test("returns value mod max for positive values", () => {
    expect(wrap(3, 5)).toBe(3);
    expect(wrap(7, 5)).toBe(2);
  });

  test("wraps -1 to max - 1", () => {
    expect(wrap(-1, 5)).toBe(4);
  });

  test("wraps 0 to 0", () => {
    expect(wrap(0, 5)).toBe(0);
  });

  test("wraps value equal to max to 0", () => {
    expect(wrap(5, 5)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// World.countNeighbors
// ──────────────────────────────────────────────
describe("World.countNeighbors", () => {
  let world;

  beforeEach(() => {
    world = createWorld(5, 5);
    world.data = Matrix(5, 5);
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) world.data[y][x] = 0;
  });

  test("returns 0 for a cell with no neighbors", () => {
    world.data[2][2] = 1;
    expect(world.countNeighbors(2, 2)).toBe(0);
  });

  test("counts all 8 neighbors", () => {
    world.data[0][0] = 1;
    world.data[0][1] = 1;
    world.data[0][2] = 1;
    world.data[1][0] = 1;
    world.data[1][2] = 1;
    world.data[2][0] = 1;
    world.data[2][1] = 1;
    world.data[2][2] = 1;
    expect(world.countNeighbors(1, 1)).toBe(8);
  });

  test("wraps around edges when counting", () => {
    world.data[4][4] = 1;
    world.data[4][0] = 1;
    world.data[0][4] = 1;
    expect(world.countNeighbors(0, 0)).toBe(3);
  });
});

// ──────────────────────────────────────────────
// World.forEachCell
// ──────────────────────────────────────────────
describe("World.forEachCell", () => {
  test("visits every cell exactly once", () => {
    const world = createWorld(3, 4);
    const visited = [];
    world.forEachCell((y, x) => visited.push([y, x]));
    expect(visited.length).toBe(12);
    expect(visited[0]).toEqual([0, 0]);
    expect(visited[visited.length - 1]).toEqual([2, 3]);
  });
});

// ──────────────────────────────────────────────
// World.drawCell
// ──────────────────────────────────────────────
describe("World.drawCell", () => {
  test("calls fillRect with correct position and size", () => {
    const world = createWorld(5, 5, 10);
    world.drawCell(2, 3);
    expect(world.context.fillRect).toHaveBeenCalledWith(30, 20, 10, 10);
  });

  test("sets fillStyle to one of the CELL_COLORS", () => {
    const world = createWorld(5, 5);
    world.drawCell(0, 0);
    expect(CELL_COLORS).toContain(world.context.fillStyle);
  });
});
