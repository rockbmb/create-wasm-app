import { Universe, Cell } from "wasm-game-of-life";
// Import the WebAssembly memory at the top of the file.
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, and get its width and height.
//const universe = Universe.hardcoded_64_by_64();
const universe = Universe.new(64, 64);
//const universe = Universe.new_with_spaceship(64, 64);
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

const ticks = document.getElementById("ticks-range");

// Used to keep track of the unique ID of each frame in the animation.
let animationId = null;

// This function is the same as before, except the
// result of `requestAnimationFrame` is assigned to
// `animationId`.
const renderLoop = () => {
  debugger;

  for (let step = 0; step < ticks.value; step++) {
    // The universe's ticks are dictated by the input box.
    universe.tick();
  }

  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
  
    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }
  
    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }
  
    ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

// Used to check whether the n-th bit of array 'arr' is set.
const bitIsSet = (n, arr) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << (n % 8);
  return (arr[byte] & mask) === mask;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      ctx.fillStyle = bitIsSet(idx, cells)
        ? ALIVE_COLOR
        : DEAD_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

// Pausing/unpausing

const isPaused = () => {
  return animationId === null;
};

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
};

playPauseButton.addEventListener("click", event => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

// Pausing/unpausing end.

// Board clearing/reinitialization

const clearButton = document.getElementById("clear");

clearButton.addEventListener("click", event => {
  universe.clear_all_cells();
  drawGrid();
  drawCells();
});

const reinitButton = document.getElementById("reinit");

reinitButton.addEventListener("click", event => {
  universe.reinitialize_rng();
  drawGrid();
  drawCells();
});

// Board clearing/reinitialization end.

// Cell selection

const get_coords = event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  return {row, col};
}

const click = event => {
  let {row, col} = get_coords(event);

  if (event.ctrlKey) {
    universe.new_glider_at(row, col);
  } else if (event.shiftKey) {
    universe.new_pre_pulsar_at(row, col);
  } else {
    universe.toggle_cell(row, col);
  }

  drawGrid();
  drawCells();
}

canvas.addEventListener("click", click);

// Cell selection end.

// The grid and its cells must be drawn first, before the first iteration of
// the `requestAnimationFrame` callback, to prevent the second generation of the board
// from being drawn first, instead of the first generatino, which is what we want.
drawGrid();
drawCells();

// This draws a new iteration of the board per frame as detected by the browser.
// On high framerate screens it may be better to manually lower it via OS as
// JS-based solutions tend to lead to desynchronization:
// https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
//requestAnimationFrame(renderLoop);
play();