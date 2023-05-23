const DEBUG = false;
const QUICK = 250;
const SLOW = 1000;

enum selectors {
  topBarSpace = ".top-bar-space",
}

enum spritesheets {
  babyPurpleCow = "images/baby-purple-cow-spritesheet.png",
}

enum AnimationTypes {
  Blink = "blink",
  Breathe = "breathe",
  Walk = "walk",
  Jump = "jump",
  Stand = "stand",
  Sleep = "sleep",
  Smell = "smell",
  Eat = "eat",
  Love = "love",
}

type AnimationInfo = {
  frames: number;
  minCycles: number;
  maxCycles: number;
};

type AnimationMap = Map<AnimationTypes, AnimationInfo>;

const animations: AnimationMap = new Map([
  [AnimationTypes.Blink, { frames: 2, minCycles: 1, maxCycles: 2 }],
  [AnimationTypes.Breathe, { frames: 4, minCycles: 4, maxCycles: 8 }],
  [AnimationTypes.Walk, { frames: 4, minCycles: 4, maxCycles: 8 }],
  [AnimationTypes.Jump, { frames: 3, minCycles: 1, maxCycles: 1 }],
  [AnimationTypes.Stand, { frames: 4, minCycles: 1, maxCycles: 1 }],
  [AnimationTypes.Sleep, { frames: 2, minCycles: 4, maxCycles: 8 }],
  [AnimationTypes.Smell, { frames: 8, minCycles: 2, maxCycles: 3 }],
  [AnimationTypes.Eat, { frames: 4, minCycles: 2, maxCycles: 4 }],
  [AnimationTypes.Love, { frames: 6, minCycles: 1, maxCycles: 1 }],
]);

class Pet {
  sprite: HTMLDivElement;
  animations: AnimationMap;
  positionX: number;
  direction: 1 | -1;
  bounds: ClientRect | DOMRect;

  constructor(spriteSheet: string, animations: AnimationMap) {
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

    this.animations = animations;
    this.positionX = 0;
    this.direction = 1;
    if (!this.sprite.parentElement) return;
    this.bounds = this.sprite.parentElement.getBoundingClientRect();
    window.onresize = this.reset.bind(this);
  }

  reset() {
    if (!this.sprite.parentElement) return;
    this.bounds = this.sprite.parentElement.getBoundingClientRect();
    this.positionX = 0;
    this.sprite.style.left = "0px"; // Reset the position of the sprite
  }

  animate() {
    // Define an ordered sequence of animations
    const sequence = [
      AnimationTypes.Sleep,
      AnimationTypes.Stand,
      AnimationTypes.Walk,
      AnimationTypes.Eat,
      AnimationTypes.Walk,
      AnimationTypes.Stand,
      AnimationTypes.Sleep,
    ];

    // Start at the beginning of the sequence
    let sequenceIndex = 0;
    let state = sequence[sequenceIndex];
    let animationInfo = this.animations.get(state);
    if (!animationInfo) return;

    let positionIndex = 0;
    let positions = this.getAnimationPositions(state, animationInfo.frames);

    let cycleCount = 0;
    let targetCycleCount = getRandomInt(
      animationInfo.minCycles,
      animationInfo.maxCycles
    );

    setInterval(
      () => {
        // Log the current animation name
        DEBUG && console.log(`CURRENT ANIMATION: ${state}`);
        DEBUG && console.log(`Target cycle count: ${targetCycleCount}`);
        DEBUG && console.log(`Cycle count: ${cycleCount + 1}`);
        DEBUG && console.log(`Number of frames: ${positions.length}`);
        DEBUG && console.log(`Frame: ${positionIndex + 1}`);

        // Display sprite at current position
        this.sprite.style.backgroundPosition = positions[positionIndex];

        if (state === AnimationTypes.Walk) {
          // Move sprite in the current direction
          this.positionX += this.direction;

          this.sprite.style.left = `${this.positionX}px`;

          // 5% chance to change direction
          if (Math.random() < 0.01) {
            this.direction *= -1;
          }

          // If the sprite hits a boundary, reverse direction
          if (
            this.positionX <= 0 ||
            this.positionX >= (this.bounds?.width || 0) - 32
          ) {
            this.direction *= -1;
            this.positionX += this.direction; // nudge sprite back into bounds
          }

          this.sprite.style.transform = `scaleX(${this.direction})`; // flip sprite if moving left
        }

        // Advance the animation to the next frame
        positionIndex = (positionIndex + 1) % positions.length;

        // At the start of each animation cycle
        if (positionIndex === 0) {
          cycleCount++;

          if (cycleCount >= targetCycleCount) {
            // Move to the next state in the sequence
            sequenceIndex = (sequenceIndex + 1) % sequence.length;
            state = sequence[sequenceIndex];
            animationInfo = this.animations.get(state);
            if (!animationInfo) return;

            // Get the positions for the new animation
            positions = this.getAnimationPositions(state, animationInfo.frames);

            cycleCount = 0;
            targetCycleCount = getRandomInt(
              animationInfo.minCycles,
              animationInfo.maxCycles
            );
          }
        }
      },
      DEBUG ? SLOW : QUICK
    );
  }

  getAnimationPositions(animation: AnimationTypes, frames: number) {
    if (frames <= 0) {
      console.error(`Invalid number of frames: ${frames}`);
      return [];
    }
    // get the index of the animation from the string name
    const animationIndex = Array.from(this.animations.keys()).indexOf(
      animation
    );
    return Array.from(
      { length: frames },
      (_, i) => `-${i * 32}px -${animationIndex * 32}px`
    );
  }
}

let interval: number;
interval = setInterval(() => {
  const topBarSpace = document.querySelectorAll<HTMLDivElement>(
    selectors.topBarSpace
  );
  if (!topBarSpace[1]) return;
  clearInterval(interval);
  const pet = new Pet(spritesheets.babyPurpleCow, animations);
  pet.animate();
}, 1000);

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
