// Frankfurter API – gratuit, sans clé d'authentification
const API_BASE = "https://api.frankfurter.app";

// Drapeaux emoji par code devise
const FLAGS = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CHF: "🇨🇭",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CNY: "🇨🇳",
  INR: "🇮🇳",
  MXN: "🇲🇽",
  BRL: "🇧🇷",
  KRW: "🇰🇷",
  RUB: "🇷🇺",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  PLN: "🇵🇱",
  CZK: "🇨🇿",
  HUF: "🇭🇺",
  RON: "🇷🇴",
  TRY: "🇹🇷",
  ZAR: "🇿🇦",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  NZD: "🇳🇿",
  THB: "🇹🇭",
  IDR: "🇮🇩",
  MYR: "🇲🇾",
  PHP: "🇵🇭",
  AED: "🇦🇪",
  SAR: "🇸🇦",
  ILS: "🇮🇱",
  BGN: "🇧🇬",
  ISK: "🇮🇸",
  HRK: "🇭🇷",
  XOF: "🌍",
};

// Noms complets des devises
const CURRENCY_NAMES = {
  EUR: "Euro",
  USD: "Dollar US",
  GBP: "Livre sterling",
  JPY: "Yen japonais",
  CHF: "Franc suisse",
  CAD: "Dollar canadien",
  AUD: "Dollar australien",
  CNY: "Yuan chinois",
  INR: "Roupie indienne",
  MXN: "Peso mexicain",
  BRL: "Réal brésilien",
  KRW: "Won sud-coréen",
  RUB: "Rouble russe",
  SEK: "Couronne suédoise",
  NOK: "Couronne norvégienne",
  DKK: "Couronne danoise",
  PLN: "Zloty polonais",
  CZK: "Couronne tchèque",
  HUF: "Forint hongrois",
  RON: "Leu roumain",
  TRY: "Livre turque",
  ZAR: "Rand sud-africain",
  SGD: "Dollar singapourien",
  HKD: "Dollar de Hong Kong",
  NZD: "Dollar néo-zélandais",
  THB: "Baht thaïlandais",
  IDR: "Roupie indonésienne",
  MYR: "Ringgit malaisien",
  PHP: "Peso philippin",
  AED: "Dirham des EAU",
  SAR: "Riyal saoudien",
  ILS: "Shekel israélien",
  BGN: "Lev bulgare",
  ISK: "Couronne islandaise",
  HRK: "Kuna croate",
  XOF: "Franc CFA (BCEAO)",
};

// XOF est arrimé à l'EUR à taux fixe (accord de coopération monétaire)
const XOF_EUR_RATE = 655.957; // 1 EUR = 655.957 XOF

// Éléments DOM
const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const convertBtn = document.getElementById("convert-btn");
const spinner = document.getElementById("spinner");
const resultBox = document.getElementById("result-box");
const errorBox = document.getElementById("error-box");
const resultAmount = document.getElementById("result-amount");
const resultCurrency = document.getElementById("result-currency");
const rateDisplay = document.getElementById("rate-display");
const inverseRate = document.getElementById("inverse-rate");
const lastUpdate = document.getElementById("last-update");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const swapBtn = document.getElementById("swap-btn");

let history = JSON.parse(localStorage.getItem("convHistory") || "[]");

// ─── Initialisation ──────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch(`${API_BASE}/currencies`);
    if (!res.ok) throw new Error("Impossible de récupérer les devises.");
    const currencies = await res.json();

    // Ajout manuel du XOF (non présent dans l'API Frankfurter)
    currencies['XOF'] = 'Franc CFA (BCEAO)';

    const codes = Object.keys(currencies).sort();
    populateSelects(codes, currencies);
    renderHistory();
  } catch (err) {
    showError("Impossible de charger les devises. Vérifiez votre connexion.");
  }
}

function populateSelects(codes, names) {
  [fromSelect, toSelect].forEach((select, i) => {
    select.innerHTML = "";
    codes.forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${code} – ${names[code] || CURRENCY_NAMES[code] || code}`;
      select.appendChild(opt);
    });
  });

  // Valeurs par défaut : EUR → USD
  fromSelect.value = "EUR";
  toSelect.value = "USD";
  updateFlags();
}

// ─── Conversion ──────────────────────────────────────────────────────────────
async function convert() {
  const amount = parseFloat(amountInput.value);
  const from = fromSelect.value;
  const to = toSelect.value;

  if (isNaN(amount) || amount <= 0) {
    showError("Veuillez entrer un montant valide supérieur à zéro.");
    return;
  }

  if (from === to) {
    displayResult(amount, to, 1, from, amount);
    return;
  }

  setLoading(true);
  hideAll();

  try {
    let converted, rate, dateStr;

    if (from === "XOF" || to === "XOF") {
      // XOF est arrimé à l'EUR — on passe par EUR comme devise pivot
      if (from === "XOF" && to === "EUR") {
        converted = amount / XOF_EUR_RATE;
        rate = 1 / XOF_EUR_RATE;
      } else if (from === "EUR" && to === "XOF") {
        converted = amount * XOF_EUR_RATE;
        rate = XOF_EUR_RATE;
      } else if (from === "XOF") {
        // XOF → EUR → to
        const amountEur = amount / XOF_EUR_RATE;
        const res = await fetch(`${API_BASE}/latest?amount=${amountEur}&from=EUR&to=${to}`);
        if (!res.ok) throw new Error(`Erreur API (${res.status})`);
        const data = await res.json();
        converted = data.rates[to];
        rate = converted / amount;
        dateStr = data.date;
      } else {
        // from → EUR → XOF
        const res = await fetch(`${API_BASE}/latest?amount=${amount}&from=${from}&to=EUR`);
        if (!res.ok) throw new Error(`Erreur API (${res.status})`);
        const data = await res.json();
        converted = data.rates["EUR"] * XOF_EUR_RATE;
        rate = converted / amount;
        dateStr = data.date;
      }
      if (!dateStr) {
        lastUpdate.textContent = `Taux XOF/EUR fixe : 1 EUR = ${XOF_EUR_RATE} XOF`;
      }
    } else {
      const res = await fetch(`${API_BASE}/latest?amount=${amount}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`Erreur API (${res.status})`);
      const data = await res.json();
      converted = data.rates[to];
      rate = converted / amount;
      dateStr = data.date;
    }

    if (dateStr) {
      const d = new Date(dateStr);
      lastUpdate.textContent = `Taux du ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`;
    }

    displayResult(converted, to, rate, from, amount);
    addToHistory(amount, from, converted, to, rate);
  } catch (err) {
    showError(`Erreur : ${err.message}`);
  } finally {
    setLoading(false);
  }
}

// ─── Affichage du résultat ────────────────────────────────────────────────────
function displayResult(converted, to, rate, from, amount) {
  resultAmount.textContent = formatNumber(converted);
  resultCurrency.textContent = to;

  if (from && amount) {
    rateDisplay.textContent = `1 ${from} = ${formatNumber(rate, 6)} ${to}`;
    inverseRate.textContent = `1 ${to} = ${formatNumber(1 / rate, 6)} ${from}`;
  } else {
    rateDisplay.textContent = "";
    inverseRate.textContent = "";
  }

  resultBox.classList.remove("hidden");
}

// ─── Formatage des nombres ────────────────────────────────────────────────────
function formatNumber(num, decimals = 4) {
  if (num >= 1000)
    return num.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  if (num >= 1)
    return num.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  return num.toLocaleString("fr-FR", { maximumFractionDigits: decimals });
}

// ─── Utilitaires UI ──────────────────────────────────────────────────────────
function showError(msg) {
  hideAll();
  document.getElementById("error-message").textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideAll() {
  resultBox.classList.add("hidden");
  errorBox.classList.add("hidden");
}

function setLoading(active) {
  convertBtn.disabled = active;
  spinner.classList.toggle("active", active);
  document.querySelector(".btn-text").textContent = active
    ? "Conversion..."
    : "Convertir";
}

function updateFlags() {
  fromFlag.textContent = FLAGS[fromSelect.value] || "🌍";
  toFlag.textContent = FLAGS[toSelect.value] || "🌍";
}

// ─── Historique ───────────────────────────────────────────────────────────────
function addToHistory(amount, from, converted, to, rate) {
  const entry = {
    id: Date.now(),
    amount,
    from,
    converted,
    to,
    rate,
    time: new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  history.unshift(entry);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem("convHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historySection.classList.remove("visible");
    return;
  }

  historySection.classList.add("visible");
  historyList.innerHTML = "";

  history.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="hist-left">
        <span class="hist-conversion">
          ${formatNumber(entry.amount)} ${entry.from}
          → ${formatNumber(entry.converted)} ${entry.to}
        </span>
        <span class="hist-time">${entry.time}</span>
      </div>
      <span class="hist-rate">1 ${entry.from} = ${formatNumber(entry.rate, 4)} ${entry.to}</span>
    `;
    historyList.appendChild(li);
  });
}

// ─── Événements ──────────────────────────────────────────────────────────────
convertBtn.addEventListener("click", convert);

amountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") convert();
});

swapBtn.addEventListener("click", () => {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tmp;
  updateFlags();
  hideAll();
});

fromSelect.addEventListener("change", () => {
  updateFlags();
  hideAll();
});
toSelect.addEventListener("change", () => {
  updateFlags();
  hideAll();
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("convHistory");
  renderHistory();
});

// ─── Démarrage ───────────────────────────────────────────────────────────────
init();
