(function () {
  "use strict";

  function Matrix(cols, rows, randomFill = false) {
    const matrix = Array(cols);

    for (let y = 0; y < cols; y++) {
      matrix[y] = Array(rows);

      if (randomFill) {
        for (let x = 0; x < rows; x++) {
          matrix[y][x] = Math.round(Math.random());
        }
      }
    }

    return matrix;
  }

  class World {
    constructor(canvas, cellSize = 20, interval = 250) {
      this.canvas = canvas;
      this.context = this.canvas.getContext("2d");
      this.cellSize = cellSize;
      this.cols = Math.ceil(canvas.height / this.cellSize);
      this.rows = Math.ceil(canvas.width / this.cellSize);
      this.data = Matrix(this.cols, this.rows, true);

      canvas.addEventListener("mousemove", (e) => {
        this.data[Math.floor((e.pageY - canvas.offsetTop) / this.cellSize)][
          Math.floor((e.pageX - canvas.offsetLeft) / this.cellSize)
        ] = 1;
      });

      this.step();
      setInterval(this.step.bind(this), interval);
    }

    isCellAlive(y, x) {
      let n = y > 0 ? y - 1 : this.cols - 1,
        s = y < this.cols - 1 ? y + 1 : 0,
        w = x > 0 ? x - 1 : this.rows - 1,
        e = x < this.rows - 1 ? x + 1 : 0;

      let total =
        this.data[n][w] +
        this.data[n][x] +
        this.data[n][e] +
        this.data[y][w] +
        this.data[y][e] +
        this.data[s][w] +
        this.data[s][x] +
        this.data[s][e];

      return total === 3 || (total === 2 && this.data[y][x]);
    }

    step() {
      const next = Matrix(this.cols, this.rows);

      for (let y = 0; y < this.cols; y++) {
        for (let x = 0; x < this.rows; x++) {
          next[y][x] = this.isCellAlive(y, x);
        }
      }

      this.data = next;

      // clear canvas
      this.context.fillStyle = "white";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

      for (let y = 0; y < this.cols; y++) {
        for (let x = 0; x < this.rows; x++) {
          // draw the cell if it is alive
          if (this.data[y][x]) {
            this.context.fillStyle = ["pink", "cyan", "yellow"][
              Math.round(Math.random() * 2)
            ];

            this.context.fillRect(
              x * this.cellSize,
              y * this.cellSize,
              this.cellSize,
              this.cellSize,
            );
          }
        }
      }
    }
  }

  const canvas = document.querySelector("canvas");
  canvas.height = innerHeight;
  canvas.width = innerWidth;

  const world = new World(canvas);
})();
