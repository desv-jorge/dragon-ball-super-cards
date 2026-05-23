// ===== GLOBAL STATE =====
let number = ""; // Variável global para o número do personagem
const pageState = {
  player1: { personagem: "", natureza: "", grupo: "", ki: "", maxKi: "", exibir: false, image: "" },
  player2: { personagem: "", natureza: "", grupo: "", ki: "", maxKi: "", exibir: false, image: "" }
};
let scores = { p1: 0, p2: 0, total: 0 };

// ===== API CONFIG =====
const API_BASE = "https://dragonball-api.com/api/characters/";
const MAX_CHARACTERS = 78;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  createParticles();
  goToStep(1); // Ensure it starts on step 1
});

// ===== WIZARD STEPS =====
function goToStep(step) {
  const arena = document.getElementById("battleArena");
  arena.className = `battle-arena step-${step}`;
}

// ===== PARTICLE BACKGROUND =====
function createParticles() {
  const container = document.getElementById("bgParticles");
  const colors = ["#ff6a00", "#ffd700", "#00b4ff", "#ff2d55", "#a855f7"];
  for (let i = 0; i < 35; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 8 + 6}s;
      animation-delay:${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

// ===== GENERATE CHARACTER =====
async function generateCharacter(player) {
  // Random number 1-58
  number = String(Math.floor(Math.random() * MAX_CHARACTERS) + 1);

  const btn = document.getElementById(`btn${player}Play`);
  const loader = document.getElementById(`loader${player}`);
  const charImg = document.getElementById(`char${player}Image`);

  // Show loading
  btn.classList.add("hidden");
  loader.classList.add("active");
  charImg.classList.remove("visible");

  try {
    const response = await fetch(API_BASE + number);
    if (!response.ok) throw new Error("API Error: " + response.status);
    const data = await response.json();

    // Update page state from API paths: $.name, $.ki, $.maxKi, $.image, $.affiliation, $.race
    const state = pageState[`player${player}`];
    state.personagem = data.name || "Desconhecido";
    state.ki = data.ki || "N/A";
    state.maxKi = data.maxKi || "N/A";
    state.image = data.image || "";
    state.grupo = data.affiliation || "N/A";
    state.natureza = data.race || "N/A";
    state.exibir = true;

    // Update UI
    updateCardUI(player, state);
  } catch (err) {
    console.warn(`Personagem ${number} não encontrado (buraco na API). Buscando outro...`);
    // Em vez de falhar, tenta novamente de forma recursiva (Retry Automático)
    return generateCharacter(player);
  }

  // Hide loading
  loader.classList.remove("active");

  // Advance step based on player
  if (player === 1 && !pageState.player2.exibir) {
    // Aguarda um momento para o usuário ver a carta 1 antes de ir pra carta 2
    setTimeout(() => {
      goToStep(2);
      generateCharacter(2); // Auto-gera o Player 2
    }, 1200);
  } else if (player === 2) {
    // Aguarda um momento para o usuário ver a carta 2 antes do combate
    setTimeout(() => {
      checkBattleReady();
    }, 1200);
  }
}

// ===== UPDATE CARD UI =====
function updateCardUI(player, state) {
  const charImg = document.getElementById(`char${player}Image`);
  const stack = document.getElementById(`card${player}Stack`);

  // Set character image
  charImg.src = state.image;
  charImg.onload = () => {
    charImg.classList.add("visible");
    stack.classList.add("revealed");
  };
  charImg.onerror = () => {
    charImg.src = "https://dragonball-api.com/characters/goku_normal.webp";
    charImg.classList.add("visible");
  };

  // Set text fields
  document.getElementById(`char${player}Name`).textContent = state.personagem;
  document.getElementById(`char${player}Ki`).textContent = state.ki;
  document.getElementById(`char${player}MaxKi`).textContent = state.maxKi;
  document.getElementById(`char${player}Race`).textContent = state.natureza;
  document.getElementById(`char${player}Affiliation`).textContent = state.grupo;
}

// ===== CHECK BATTLE READY =====
function checkBattleReady() {
  const btnBattle = document.getElementById("btnBattle");
  if (pageState.player1.exibir && pageState.player2.exibir) {
    goToStep(3);
    btnBattle.classList.add("visible");
  }
}

// ===== PARSE KI VALUE =====
function parseKiValue(kiStr) {
  if (!kiStr || kiStr === "N/A" || kiStr === "---") return 0;
  const cleaned = kiStr.replace(/\./g, "").replace(/,/g, "").trim();
  const multipliers = {
    thousand: 1e3, million: 1e6, billion: 1e9,
    trillion: 1e12, quadrillion: 1e15, quintillion: 1e18,
    sextillion: 1e21, septillion: 1e24, octillion: 1e27,
    nonillion: 1e30, decillion: 1e33, googolplex: 1e100
  };
  const lower = cleaned.toLowerCase();
  for (const [word, mult] of Object.entries(multipliers)) {
    if (lower.includes(word)) {
      const numPart = parseFloat(lower.replace(word, "").trim()) || 1;
      return numPart * mult;
    }
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ===== START BATTLE =====
function startBattle() {
  const p1 = pageState.player1;
  const p2 = pageState.player2;

  const ki1 = parseKiValue(p1.maxKi);
  const ki2 = parseKiValue(p2.maxKi);

  let winner, loser, winnerPlayer;
  if (ki1 >= ki2) {
    winner = p1; loser = p2; winnerPlayer = 1;
  } else {
    winner = p2; loser = p1; winnerPlayer = 2;
  }

  // Highlight cards
  const stack1 = document.getElementById("card1Stack");
  const stack2 = document.getElementById("card2Stack");
  stack1.classList.remove("winner-card", "loser-card");
  stack2.classList.remove("winner-card", "loser-card");

  if (winnerPlayer === 1) {
    stack1.classList.add("winner-card");
    stack2.classList.add("loser-card");
  } else {
    stack2.classList.add("winner-card");
    stack1.classList.add("loser-card");
  }

  // Update scores
  if (winnerPlayer === 1) scores.p1++; else scores.p2++;
  scores.total++;
  document.getElementById("score1").textContent = scores.p1;
  document.getElementById("score2").textContent = scores.p2;
  document.getElementById("totalBattles").textContent = scores.total;

  // Show modal
  const modal = document.getElementById("battleModal");
  document.getElementById("winnerImage").src = winner.image;
  document.getElementById("winnerName").textContent = winner.personagem;
  document.getElementById("winnerStats").innerHTML = `
    Ki: ${winner.ki}<br>
    Max Ki: ${winner.maxKi}<br>
    Raça: ${winner.natureza}<br>
    Grupo: ${winner.grupo}
  `;
  modal.classList.add("active");
}

// ===== CLOSE MODAL =====
function closeModal() {
  const modal = document.getElementById("battleModal");
  modal.classList.remove("active");

  // Reset for new battle
  resetCards();
}

// ===== RESET CARDS =====
function resetCards() {
  for (const player of [1, 2]) {
    const btn = document.getElementById(`btn${player}Play`);
    const charImg = document.getElementById(`char${player}Image`);
    const stack = document.getElementById(`card${player}Stack`);

    btn.classList.remove("hidden");
    charImg.classList.remove("visible");
    charImg.src = "";
    stack.classList.remove("revealed", "winner-card", "loser-card");
    stack.style.filter = "";

    document.getElementById(`char${player}Name`).textContent = "???";
    document.getElementById(`char${player}Ki`).textContent = "---";
    document.getElementById(`char${player}MaxKi`).textContent = "---";
    document.getElementById(`char${player}Race`).textContent = "---";
    document.getElementById(`char${player}Affiliation`).textContent = "---";

    pageState[`player${player}`] = {
      personagem: "", natureza: "", grupo: "", ki: "", maxKi: "", exibir: false, image: ""
    };
  }

  document.getElementById("btnBattle").classList.remove("visible");
  goToStep(1);
}

// ===== MENU & SCORES =====
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  menu.classList.toggle("active");
  overlay.classList.toggle("active");
}

function resetScores() {
  scores = { p1: 0, p2: 0, total: 0 };
  document.getElementById("score1").textContent = 0;
  document.getElementById("score2").textContent = 0;
  document.getElementById("totalBattles").textContent = 0;
  toggleMenu(); // fecha o menu após zerar
}
