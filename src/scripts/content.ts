import { selectors, spritesheets, AnimationTypes } from "./enums";
import { AnimationMap } from "./types";

const DEBUG = false;
let enableAnimation: boolean;
let interval: number;
let pet: Pet;

chrome.storage.sync.get(
  {
    enableAnimation: true,
    interval: 500,
  },
  function (items) {
    enableAnimation = items.enableAnimation || true;
    interval = items.interval || 500;
    DEBUG && console.log({ enableAnimation, interval });
  }
);

const animations: AnimationMap = new Map([
  [AnimationTypes.Blink, { frames: 2, minCycles: 1, maxCycles: 2 }],
  [AnimationTypes.Breathe, { frames: 4, minCycles: 4, maxCycles: 8 }],
  [AnimationTypes.Walk, { frames: 4, minCycles: 4, maxCycles: 8 }],
  [AnimationTypes.Jump, { frames: 3, minCycles: 1, maxCycles: 1 }],
  [AnimationTypes.Stand, { frames: 4, minCycles: 1, maxCycles: 1 }],
  [AnimationTypes.Sleep, { frames: 2, minCycles: 20, maxCycles: 40 }],
  [AnimationTypes.Smell, { frames: 8, minCycles: 2, maxCycles: 3 }],
  [AnimationTypes.Eat, { frames: 4, minCycles: 2, maxCycles: 4 }],
  [AnimationTypes.Love, { frames: 6, minCycles: 1, maxCycles: 1 }],
]);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "updateSettings") {
    DEBUG && console.log({ request });
    interval = request.interval;
    enableAnimation = request.enableAnimation;
    pet && pet.reset();
  }
  // send response to popup script
  sendResponse({ success: true });
});

class Pet {
  sprite: HTMLDivElement;
  animations: AnimationMap;
  positionX: number;
  direction: 1 | -1;
  bounds: ClientRect | DOMRect;
  clicked: boolean;
  animationInterval: number;

  constructor(spriteSheet: string, animations: AnimationMap) {
    this.animations = animations;
    this.positionX = 0;
    this.direction = 1;
    this.clicked = false;

    this.setupSprite(spriteSheet);
    this.applyStyles();
    this.setupEventListeners();
  }

  private setupSprite(spriteSheet: string) {
    const topBarSpace = document.querySelectorAll<HTMLDivElement>(
      selectors.topBarSpace
    );
    if (!topBarSpace[1]) return;

    this.sprite = document.createElement("div");
    this.sprite.className = "webflow-pet";
    topBarSpace[1].appendChild(this.sprite);

    const style = document.createElement("style");
    style.textContent = `
        .webflow-pet {
          position: relative;
          bottom: -4px;
          width: 32px;
          height: 32px;
          background: url(${chrome.runtime.getURL(spriteSheet)});
          background-position: 0 0;
        }
      `;
    document.head.appendChild(style);
  }

  private applyStyles() {
    if (!this.sprite.parentElement) return;
    this.bounds = this.sprite.parentElement.getBoundingClientRect();
    this.sprite.style.left = "0px"; // Reset the position of the sprite
  }

  private setupEventListeners() {
    window.addEventListener("resize", this.reset.bind(this));
    this.sprite.addEventListener("click", () => (this.clicked = true));
  }

  reset() {
    if (!this.sprite.parentElement) return;
    this.bounds = this.sprite.parentElement.getBoundingClientRect();
    this.positionX = 0;
    this.sprite.style.left = "0px"; // Reset the position of the sprite
    clearInterval(this.animationInterval || 0);
    enableAnimation && this.animate();
  }

  animate() {
    // initial state
    let state = AnimationTypes.Walk;

    // Initialize variables to keep track of the current animation state and position
    let animationInfo = this.animations.get(state);
    if (!animationInfo) return;

    let positionIndex = 0;
    let positions = this.getAnimationPositions(state, animationInfo.frames);

    // Initialize cycle count and target cycle count for the current animation
    let cycleCount = 0;
    let targetCycleCount = getRandomInt(
      animationInfo.minCycles,
      animationInfo.maxCycles
    );

    // Set up the animation loop using setInterval
    this.animationInterval = setInterval(
      () => {
        // Log debug information
        this.logDebugInfo(
          state,
          targetCycleCount,
          cycleCount,
          positions,
          positionIndex
        );

        if (this.clicked) {
          state = AnimationTypes.Love;
          animationInfo = this.animations.get(state);
          if (!animationInfo) return;

          // Update positions and cycle count for the new animation state
          positions = this.getAnimationPositions(state, animationInfo.frames);
          cycleCount = 0;
          targetCycleCount = getRandomInt(
            animationInfo.minCycles,
            animationInfo.maxCycles
          );
          this.clicked = false;
        }

        // Updates background image position for spriteshees
        // positions[positionIndex] looks like "32px 64px" i.e. 2nd frame of 4th animation
        this.displaySprite(positions[positionIndex]);

        // Perform additional actions specific to the "Walk" animation
        if (state === AnimationTypes.Walk) {
          this.moveSprite(); // Move the sprite in the current direction
          this.checkBoundaryCollision(); // Check if the sprite hits a boundary and reverse direction if needed
          this.flipSpriteIfNeeded(); // Flip the sprite if moving left
        }

        // Advance to the next animation frame position
        positionIndex = (positionIndex + 1) % positions.length;

        // Check if the current animation cycle is complete
        if (positionIndex === 0) {
          cycleCount++;

          // Check if the target cycle count is reached for the current animation
          if (cycleCount >= targetCycleCount) {
            // Move to the next state in the sequence

            state = this.getNextState(state);
            animationInfo = this.animations.get(state);
            if (!animationInfo) return;

            // Update positions and cycle count for the new animation state
            positions = this.getAnimationPositions(state, animationInfo.frames);
            cycleCount = 0;
            targetCycleCount = getRandomInt(
              animationInfo.minCycles,
              animationInfo.maxCycles
            );
          }
        }
      },
      interval >= 100 ? interval : 100
    );
  }

  getNextState(currentState) {
    if (currentState === AnimationTypes.Walk) {
      return this.getRandomState();
    } else if (currentState === AnimationTypes.Sleep) {
      return AnimationTypes.Stand;
    } else if (currentState === AnimationTypes.Stand) {
      return AnimationTypes.Walk;
    }
    return Math.random() > 0.5 ? AnimationTypes.Walk : AnimationTypes.Breathe;
  }

  getRandomState() {
    const animationKeys = Array.from(this.animations.keys());
    const randomStateIndex = getRandomInt(0, animationKeys.length);
    return animationKeys[randomStateIndex];
  }

  logDebugInfo(
    state: AnimationTypes,
    targetCycleCount: number,
    cycleCount: number,
    positions: string[],
    positionIndex: number
  ) {
    if (DEBUG) {
      console.log(`CURRENT ANIMATION: ${state}`);
      console.log(`Target cycle count: ${targetCycleCount}`);
      console.log(`Cycle count: ${cycleCount + 1}`);
      console.log(`Number of frames: ${positions.length}`);
      console.log(`Frame: ${positionIndex + 1}`);
    }
  }

  displaySprite(position: string) {
    this.sprite.style.backgroundPosition = position;
  }

  moveSprite() {
    if (Math.random() < 0.01) {
      this.direction *= -1;
    }
    this.positionX += this.direction;
    this.sprite.style.left = `${this.positionX}px`;
  }

  checkBoundaryCollision() {
    if (
      this.positionX <= 0 ||
      this.positionX >= (this.bounds?.width || 0) - 32
    ) {
      this.direction *= -1;
      this.positionX += this.direction;
    }
  }

  flipSpriteIfNeeded() {
    this.sprite.style.transform = `scaleX(${this.direction})`;
  }

  // returns positions for background image for each frame of the animation
  private getAnimationPositions(
    animation: AnimationTypes,
    frames: number,
    reverse: boolean = false
  ) {
    if (frames <= 0) {
      console.error(`Invalid number of frames: ${frames}`);
      return [];
    }
    // get the index of the animation from the string name
    const animationIndex = Array.from(this.animations.keys()).indexOf(
      animation
    );
    const positions = Array.from(
      { length: frames },
      (_, i) => `-${i * 32}px -${animationIndex * 32}px`
    );
    return reverse ? positions.reverse() : positions;
  }
}

let loadInterval: number;

loadInterval = setInterval(() => {
  const topBarSpace = document.querySelectorAll<HTMLDivElement>(
    selectors.topBarSpace
  );
  if (!topBarSpace[1]) return;
  clearInterval(loadInterval);
  pet = new Pet(spritesheets.babyPurpleCow, animations);
  enableAnimation && pet.animate();
}, 1000);

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
