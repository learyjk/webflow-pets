(() => {
  // src/scripts/content.ts
  var DEBUG = false;
  var enableAnimation;
  var interval;
  var pet;
  chrome.storage.sync.get(
    {
      enableAnimation: true,
      interval: 500
    },
    function(items) {
      enableAnimation = items.enableAnimation || true;
      interval = items.interval || 500;
      DEBUG && console.log({ enableAnimation, interval });
    }
  );
  var animations = /* @__PURE__ */ new Map([
    ["blink" /* Blink */, { frames: 2, minCycles: 1, maxCycles: 2 }],
    ["breathe" /* Breathe */, { frames: 4, minCycles: 4, maxCycles: 8 }],
    ["walk" /* Walk */, { frames: 4, minCycles: 4, maxCycles: 8 }],
    ["jump" /* Jump */, { frames: 3, minCycles: 1, maxCycles: 1 }],
    ["stand" /* Stand */, { frames: 4, minCycles: 1, maxCycles: 1 }],
    ["sleep" /* Sleep */, { frames: 2, minCycles: 20, maxCycles: 40 }],
    ["smell" /* Smell */, { frames: 8, minCycles: 2, maxCycles: 3 }],
    ["eat" /* Eat */, { frames: 4, minCycles: 2, maxCycles: 4 }],
    ["love" /* Love */, { frames: 6, minCycles: 1, maxCycles: 1 }]
  ]);
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "updateSettings") {
      DEBUG && console.log({ request });
      interval = request.interval;
      enableAnimation = request.enableAnimation;
      pet && pet.reset();
    }
    sendResponse({ success: true });
  });
  var Pet = class {
    constructor(spriteSheet, animations2) {
      this.animations = animations2;
      this.positionX = 0;
      this.direction = 1;
      this.clicked = false;
      this.setupSprite(spriteSheet);
      this.applyStyles();
      this.setupEventListeners();
    }
    setupSprite(spriteSheet) {
      const topBarSpace = document.querySelectorAll(
        ".top-bar-space" /* topBarSpace */
      );
      if (!topBarSpace[1])
        return;
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
    applyStyles() {
      if (!this.sprite.parentElement)
        return;
      this.bounds = this.sprite.parentElement.getBoundingClientRect();
      this.sprite.style.left = "0px";
    }
    setupEventListeners() {
      window.addEventListener("resize", this.reset.bind(this));
      this.sprite.addEventListener("click", () => this.clicked = true);
    }
    reset() {
      if (!this.sprite.parentElement)
        return;
      this.bounds = this.sprite.parentElement.getBoundingClientRect();
      this.positionX = 0;
      this.sprite.style.left = "0px";
      clearInterval(this.animationInterval || 0);
      enableAnimation && this.animate();
    }
    animate() {
      let state = "walk" /* Walk */;
      let animationInfo = this.animations.get(state);
      if (!animationInfo)
        return;
      let positionIndex = 0;
      let positions = this.getAnimationPositions(state, animationInfo.frames);
      let cycleCount = 0;
      let targetCycleCount = getRandomInt(
        animationInfo.minCycles,
        animationInfo.maxCycles
      );
      this.animationInterval = setInterval(
        () => {
          this.logDebugInfo(
            state,
            targetCycleCount,
            cycleCount,
            positions,
            positionIndex
          );
          if (this.clicked) {
            state = "love" /* Love */;
            animationInfo = this.animations.get(state);
            if (!animationInfo)
              return;
            positions = this.getAnimationPositions(state, animationInfo.frames);
            cycleCount = 0;
            targetCycleCount = getRandomInt(
              animationInfo.minCycles,
              animationInfo.maxCycles
            );
            this.clicked = false;
          }
          this.displaySprite(positions[positionIndex]);
          if (state === "walk" /* Walk */) {
            this.moveSprite();
            this.checkBoundaryCollision();
            this.flipSpriteIfNeeded();
          }
          positionIndex = (positionIndex + 1) % positions.length;
          if (positionIndex === 0) {
            cycleCount++;
            if (cycleCount >= targetCycleCount) {
              state = this.getNextState(state);
              animationInfo = this.animations.get(state);
              if (!animationInfo)
                return;
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
      if (currentState === "walk" /* Walk */) {
        return this.getRandomState();
      } else if (currentState === "sleep" /* Sleep */) {
        return "stand" /* Stand */;
      } else if (currentState === "stand" /* Stand */) {
        return "walk" /* Walk */;
      }
      return Math.random() > 0.5 ? "walk" /* Walk */ : "breathe" /* Breathe */;
    }
    getRandomState() {
      const animationKeys = Array.from(this.animations.keys());
      const randomStateIndex = getRandomInt(0, animationKeys.length);
      return animationKeys[randomStateIndex];
    }
    logDebugInfo(state, targetCycleCount, cycleCount, positions, positionIndex) {
      if (DEBUG) {
        console.log(`CURRENT ANIMATION: ${state}`);
        console.log(`Target cycle count: ${targetCycleCount}`);
        console.log(`Cycle count: ${cycleCount + 1}`);
        console.log(`Number of frames: ${positions.length}`);
        console.log(`Frame: ${positionIndex + 1}`);
      }
    }
    displaySprite(position) {
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
      if (this.positionX <= 0 || this.positionX >= (this.bounds?.width || 0) - 32) {
        this.direction *= -1;
        this.positionX += this.direction;
      }
    }
    flipSpriteIfNeeded() {
      this.sprite.style.transform = `scaleX(${this.direction})`;
    }
    // returns positions for background image for each frame of the animation
    getAnimationPositions(animation, frames, reverse = false) {
      if (frames <= 0) {
        console.error(`Invalid number of frames: ${frames}`);
        return [];
      }
      const animationIndex = Array.from(this.animations.keys()).indexOf(
        animation
      );
      const positions = Array.from(
        { length: frames },
        (_, i) => `-${i * 32}px -${animationIndex * 32}px`
      );
      return reverse ? positions.reverse() : positions;
    }
  };
  var loadInterval;
  loadInterval = setInterval(() => {
    const topBarSpace = document.querySelectorAll(
      ".top-bar-space" /* topBarSpace */
    );
    if (!topBarSpace[1])
      return;
    clearInterval(loadInterval);
    pet = new Pet("images/baby-purple-cow-spritesheet.png" /* babyPurpleCow */, animations);
    enableAnimation && pet.animate();
  }, 1e3);
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
})();
//# sourceMappingURL=content.js.map
