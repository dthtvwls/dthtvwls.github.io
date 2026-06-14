"use strict";

function wrap(value, max) {
  return (value + max) % max;
}

function Matrix(cols, rows, randomFill = false) {
  const matrix = Array(cols);

  for (let y = 0; y < cols; y++) {
    matrix[y] = Array(rows);

    if (randomFill) {
      for (let x = 0; x < rows; x++) {
        matrix[y][x] = Math.floor(Math.random() * 5) === 0 ? 1 : 0;
      }
    }
  }

  return matrix;
}

const CELL_COLORS = ["#fde", "#8ff", "#ff8"];

class World {
  constructor(canvas, cellSize = 20, interval = 500) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Could not get 2D rendering context from canvas");
    }
    this.cellSize = cellSize;
    this.cols = Math.ceil(canvas.height / this.cellSize);
    this.rows = Math.ceil(canvas.width / this.cellSize);
    this.data = Matrix(this.cols, this.rows, true);

    canvas.addEventListener("mousemove", (e) => {
      const y = Math.floor((e.pageY - canvas.offsetTop) / this.cellSize);
      const x = Math.floor((e.pageX - canvas.offsetLeft) / this.cellSize);
      if (y >= 0 && y < this.cols && x >= 0 && x < this.rows && this.data[y]) {
        this.data[y][x] = 1;
      }
    });

    this.step();
    setInterval(this.step.bind(this), interval);
  }

  forEachCell(callback) {
    for (let y = 0; y < this.cols; y++) {
      for (let x = 0; x < this.rows; x++) {
        callback(y, x);
      }
    }
  }

  countNeighbors(y, x) {
    const n = wrap(y - 1, this.cols),
      s = wrap(y + 1, this.cols),
      w = wrap(x - 1, this.rows),
      e = wrap(x + 1, this.rows);

    return (
      this.data[n][w] +
      this.data[n][x] +
      this.data[n][e] +
      this.data[y][w] +
      this.data[y][e] +
      this.data[s][w] +
      this.data[s][x] +
      this.data[s][e]
    );
  }

  isCellAlive(y, x) {
    const total = this.countNeighbors(y, x);
    return total === 3 || (total === 2 && this.data[y][x]) ? 1 : 0;
  }

  drawCell(y, x) {
    this.context.fillStyle =
      CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)];
    this.context.fillRect(
      x * this.cellSize,
      y * this.cellSize,
      this.cellSize,
      this.cellSize,
    );
  }

  step() {
    const next = Matrix(this.cols, this.rows);

    this.forEachCell((y, x) => {
      next[y][x] = this.isCellAlive(y, x);
    });

    this.data = next;

    // clear canvas
    this.context.fillStyle = "#fafafa";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.forEachCell((y, x) => {
      if (this.data[y][x]) {
        this.drawCell(y, x);
      }
    });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Matrix, World, wrap, CELL_COLORS };
} else {
  (function () {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        throw new Error("No <canvas> element found in the document");
      }
      canvas.height = document.documentElement.scrollHeight;
      canvas.width = document.documentElement.scrollWidth;

      const world = new World(canvas);
    } catch (e) {
      console.error(e);
    }
  })();
}
