import { createHeartSVG } from "./hearts.js";
import {
  checkIfHighScore,
  addHighScore,
  fetchLeaderboard,
} from "./scoreService.js";

const GAME_STATES = {
  IDLE: "idle",
  MOVING_RIGHT: "moving_right",
  MOVING_LEFT: "moving_left",
  ANIMATING: "animating",
  GAME_OVER: "game_over",
};

const START_POSITIONS = {
  LEFT: "left",
  RIGHT: "right",
};

const initialGameState = {
  highlighted: 0,
  score: 0,
  currentHearts: 3,
  maxHearts: 6,
  target: null,
  speed: 53,
  state: GAME_STATES.IDLE,
  startPosition: START_POSITIONS.LEFT,
};

const gameState = {};
const animationDuration = 800;

let gameText = document.querySelector(".game-text").textContent;
const gameTextElement = document.querySelector(".game-text");

// Store the newly submitted score for highlighting
let submittedScore = null;

function createCharacterSpans() {
  gameTextElement.innerHTML = gameText
    .split("")
    .map((char, index) => `<span id="char-${index}">${char}</span>`)
    .join("");
}

function moveHighlight(newIndex) {
  document.querySelector(".highlighted")?.classList.remove("highlighted");
  document.getElementById(`char-${newIndex}`).classList.add("highlighted");
  gameState.highlighted = newIndex;
}

function moveRight() {
  gameState.state = GAME_STATES.MOVING_RIGHT;

  function animate() {
    if (
      gameState.highlighted < gameText.length - 1 &&
      gameState.state === GAME_STATES.MOVING_RIGHT
    ) {
      moveHighlight(gameState.highlighted + 1);
      setTimeout(animate, gameState.speed);
    }
  }
  animate();
}

function moveLeft() {
  gameState.state = GAME_STATES.MOVING_LEFT;

  function animate() {
    if (
      gameState.highlighted > 0 &&
      gameState.state === GAME_STATES.MOVING_LEFT
    ) {
      moveHighlight(gameState.highlighted - 1);
      setTimeout(animate, gameState.speed);
    }
  }
  animate();
}

function generateGameString(length = 30) {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  while (length > 0) {
    randomString += letters[Math.floor(Math.random() * 26)];
    length--;
  }
  return randomString;
}

function resetPosition(index) {
  if (index === 0) {
    gameState.startPosition = START_POSITIONS.LEFT;
  } else {
    gameState.startPosition = START_POSITIONS.RIGHT;
  }
  moveHighlight(index);
  gameState.highlighted = index;
  gameState.speed -= 1;
  gameState.state = GAME_STATES.IDLE;
}

function setTarget(index) {
  document.querySelector(".target")?.classList.remove("target");
  document.getElementById(`char-${index}`).classList.add("target");
  gameState.target = index;
}

function initGame() {
  Object.assign(gameState, initialGameState);
  document.getElementById("score").textContent = gameState.score;
  gameText = generateGameString();

  const heartsContainer = document.querySelector(".hearts");
  heartsContainer.innerHTML = "";

  updateHeartDisplay(gameState.currentHearts);
  createCharacterSpans();
  resetPosition(0);
  setTarget(gameText.length - (Math.floor(Math.random() * 4) + 7));
}

function updateHeartDisplay(hearts) {
  const heartsContainer = document.querySelector(".hearts");
  for (let i = 0; i < hearts; i++) {
    heartsContainer.appendChild(createHeartSVG("full"));
  }
}

function addHeart() {
  if (gameState.currentHearts === 5.5) {
    addHalfHeart();
    return;
  } else if (gameState.currentHearts === gameState.maxHearts) {
    return;
  }
  const heartsContainer = document.querySelector(".hearts");
  if (gameState.currentHearts % 1 === 0) {
    heartsContainer.appendChild(createHeartSVG("full"));
  } else {
    heartsContainer.lastElementChild.remove();
    heartsContainer.appendChild(createHeartSVG("full"));
    heartsContainer.appendChild(createHeartSVG("half"));
  }
  gameState.currentHearts += 1;
}

function addHalfHeart() {
  if (gameState.currentHearts === gameState.maxHearts) {
    return;
  }
  const heartsContainer = document.querySelector(".hearts");
  if (gameState.currentHearts % 1 === 0) {
    heartsContainer.appendChild(createHeartSVG("half"));
  } else {
    heartsContainer.lastElementChild.remove();
    heartsContainer.appendChild(createHeartSVG("full"));
  }
  gameState.currentHearts += 0.5;
}

function removeHeart() {
  const heartsContainer = document.querySelector(".hearts");
  if (gameState.currentHearts % 1 === 0) {
    heartsContainer.lastElementChild.remove();
  } else {
    heartsContainer.lastElementChild.remove();
    if (heartsContainer.lastElementChild === null) {
      gameOver();
      return;
    }
    heartsContainer.lastElementChild.remove();
    heartsContainer.appendChild(createHeartSVG("half"));
  }
  gameState.currentHearts -= 1;
  if (gameState.currentHearts === 0) {
    gameOver();
  }
}

function removeHalfHeart() {
  const heartsContainer = document.querySelector(".hearts");
  if (gameState.currentHearts % 1 === 0) {
    heartsContainer.lastElementChild.remove();
    heartsContainer.appendChild(createHeartSVG("half"));
  } else {
    heartsContainer.lastElementChild.remove();
  }
  gameState.currentHearts -= 0.5;
  if (gameState.currentHearts === 0) {
    gameOver();
  }
}

function updateScore() {
  if (gameState.highlighted === gameState.target) {
    addHeart();
    gameState.score += 50;
  } else if (Math.abs(gameState.highlighted - gameState.target) === 1) {
    addHalfHeart();
    gameState.score += 20;
  } else if (Math.abs(gameState.highlighted - gameState.target) === 2) {
    removeHalfHeart();
    gameState.score -= 5;
  } else if (Math.abs(gameState.highlighted - gameState.target) > 2) {
    removeHeart();
    gameState.score -= 10;
  }
  document.getElementById("score").textContent = gameState.score;
}

function resetRight() {
  resetPosition(gameText.length - 1);
  setTarget(Math.floor(Math.random() * 4) + 5);
}

function resetLeft() {
  resetPosition(0);
  setTarget(gameText.length - (Math.floor(Math.random() * 4) + 7));
}

function animateEndPosition() {
  const landed = document.getElementById(`char-${gameState.highlighted}`);

  document.querySelectorAll('[id*="char"]').forEach((char) => {
    char.classList.remove(
      "char-perfect",
      "char-close",
      "char-yellow",
      "char-red-shake"
    );
  });

  let animationClass = "";
  const distance = Math.abs(gameState.highlighted - gameState.target);

  if (distance === 0) {
    animationClass = "char-perfect";
  } else if (distance === 1) {
    animationClass = "char-close";
  } else if (distance === 2) {
    animationClass = "char-yellow";
  } else if (distance > 2) {
    animationClass = "char-red-shake";
  }

  landed.classList.add(animationClass);

  setTimeout(() => {
    landed.classList.remove(animationClass);
  }, animationDuration);
}

function openGameOverModal() {
  const gameOverModal = document.getElementById("gameover-modal");
  const highScore = document.getElementById("player-high-score");
  const regularScore = document.getElementById("player-score");
  gameOverModal.classList.add("show");
  highScore.textContent = gameState.score;
  regularScore.textContent = gameState.score;

  resetGameOverModal();
}

function resetGameOverModal() {
  const formSection = document.querySelector(".high-score-form-section");
  const postSubmissionSection = document.querySelector(
    ".post-submission-section"
  );

  if (formSection) formSection.style.display = "block";
  if (postSubmissionSection) postSubmissionSection.style.display = "none";

  const initialsInput = document.getElementById("initials");
  if (initialsInput) initialsInput.value = "";

  submittedScore = null;
}

function showPostSubmissionLeaderboard() {
  const formSection = document.querySelector(".high-score-form-section");
  const postSubmissionSection = document.querySelector(
    ".post-submission-section"
  );

  if (formSection) formSection.style.display = "none";
  if (postSubmissionSection) postSubmissionSection.style.display = "block";

  const titleElement = document.getElementById("post-submission-title");
  if (submittedScore && titleElement) {
    const rankSuffix = getRankSuffix(submittedScore.rank);
    titleElement.textContent = `YOU RANKED ${submittedScore.rank}${rankSuffix}!`;
  }

  loadPostSubmissionLeaderboard();
}

function getRankSuffix(rank) {
  if (rank % 100 >= 11 && rank % 100 <= 13) {
    return "th";
  }
  switch (rank % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

async function loadPostSubmissionLeaderboard() {
  const entriesContainer = document.getElementById("post-submission-entries");

  try {
    const entries = await fetchLeaderboard();
    entriesContainer.innerHTML = "";

    entries.forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.className = "leaderboard-entry";

      if (
        submittedScore &&
        entry.initials === submittedScore.initials &&
        entry.score === submittedScore.score &&
        entry.rank === submittedScore.rank
      ) {
        entryElement.classList.add("player-score");
        setTimeout(() => {
          entryElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }

      entryElement.innerHTML = `
        <span class="rank">${entry.rank}</span>
        <span class="initials">${entry.initials}</span>
        <span class="score">${entry.score}</span>
      `;
      entriesContainer.appendChild(entryElement);
    });
  } catch (error) {
    console.error("Error loading post-submission leaderboard:", error);
    entriesContainer.innerHTML = "<div>Error loading scores</div>";
  }
}

function closeGameOverModal() {
  const gameOverModal = document.getElementById("gameover-modal");
  gameOverModal.classList.remove("show");
}

async function gameOver() {
  gameState.state = GAME_STATES.GAME_OVER;
  const isHighScore = await checkIfHighScore(gameState.score);
  const highScoreDisplay = document.querySelector(".high-score");
  const notHighScoreDisplay = document.querySelector(".not-high-score");
  if (isHighScore) {
    highScoreDisplay.classList.add("show");
    notHighScoreDisplay.classList.remove("show");
  } else {
    highScoreDisplay.classList.remove("show");
    notHighScoreDisplay.classList.add("show");
  }
  openGameOverModal();
}

function openLeaderboardModal() {
  const modal = document.getElementById("leaderboard-modal");
  modal.classList.add("show");
  loadLeaderboard();
}

function closeLeaderboardModal() {
  const modal = document.getElementById("leaderboard-modal");
  modal.classList.remove("show");
}

async function loadLeaderboard() {
  const entriesContainer = document.getElementById("leaderboard-entries");

  try {
    const entries = await fetchLeaderboard();
    entriesContainer.innerHTML = "";

    const top10 = entries.slice(0, 10);

    top10.forEach((entry) => {
      const entryElement = document.createElement("div");
      entryElement.className = "leaderboard-entry";
      entryElement.innerHTML = `
        <span class="rank">${entry.rank}</span>
        <span class="initials">${entry.initials}</span>
        <span class="score">${entry.score}</span>
      `;
      entriesContainer.appendChild(entryElement);
    });
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    entriesContainer.innerHTML = "<div>Error loading scores</div>";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initGame();
  setupEventListeners();
});

function setupEventListeners() {
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  const modal = document.getElementById("leaderboard-modal");
  const gameOverClose = document.querySelector(".gameover-modal-close");
  const leaderboardClose = document.querySelector(".leaderboard-modal-close");
  const leadberboardBackdrop = document.querySelector(".leaderboard-backdrop");
  const restartGameBtns = document.querySelectorAll(".restart-game-btn");
  const gameOverForm = document.querySelector(".gameover-form");

  gameOverForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(gameOverForm);
    const initials = formData.get("initials").toUpperCase();

    try {
      await addHighScore({
        initials: initials,
        score: gameState.score,
      });

      const updatedScores = await fetchLeaderboard();
      const playerEntry = updatedScores.find(
        (entry) =>
          entry.initials === initials && entry.score === gameState.score
      );

      if (playerEntry) {
        submittedScore = {
          initials: playerEntry.initials,
          score: playerEntry.score,
          rank: playerEntry.rank,
        };
      }

      showPostSubmissionLeaderboard();
    } catch (e) {
      console.log(e);
    }
  });

  restartGameBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      closeGameOverModal();
      initGame();
    });
  });

  leaderboardBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openLeaderboardModal();
  });

  gameOverClose.addEventListener("click", function () {
    closeGameOverModal();
    initGame();
  });

  leaderboardClose.addEventListener("click", closeLeaderboardModal);
  leadberboardBackdrop.addEventListener("click", closeLeaderboardModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeLeaderboardModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (gameState.state !== GAME_STATES.IDLE) {
      return;
    }

    if (event.key === "l") {
      if (gameState.startPosition === START_POSITIONS.RIGHT) {
        return;
      }
      moveRight();
    }

    if (event.key === "h") {
      if (gameState.startPosition === START_POSITIONS.LEFT) {
        return;
      }
      moveLeft();
    }
  });

  document.addEventListener("keyup", function (event) {
    if (
      gameState.state === GAME_STATES.ANIMATING ||
      gameState.state === GAME_STATES.GAME_OVER
    ) {
      return;
    }

    if (event.key === "l" && gameState.state === GAME_STATES.MOVING_RIGHT) {
      gameState.state = GAME_STATES.ANIMATING;
      animateEndPosition();
      setTimeout(() => {
        updateScore();
        resetRight();
      }, animationDuration + 200);
    }

    if (event.key === "h" && gameState.state === GAME_STATES.MOVING_LEFT) {
      gameState.state = GAME_STATES.ANIMATING;
      animateEndPosition();
      setTimeout(() => {
        updateScore();
        resetLeft();
      }, animationDuration + 200);
    }
  });
}
