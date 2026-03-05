const I18N = {
  pt: {
    language: "Idioma",
    language_pt: "PT",
    language_en: "EN",
    language_es: "ES",
    list_title: "Lista de Indicadores & Recomendações",
    list_subtitle: "Analise vários tickers e abra gráficos detalhados com um clique.",
    list_form_label: "Tickers (separados por vírgula)",
    list_form_placeholder: "ex.: QQQ, COWZ, IBIT",
    list_analyze: "Analisar lista",
    list_hint: "Clique no ticker para abrir o gráfico em nova aba.",
    list_results: "Resultados",
    download_report: "Baixar relatório Word",
    list_table_ticker: "Ticker",
    list_table_price: "Preço",
    list_table_macd: "MACD / Sinal",
    list_table_recommendation: "Recomendação",
    list_table_summary: "Resumo / Racional",
    list_empty: "Digite um ou mais tickers acima e clique em \"Analisar lista\".",
    unavailable: "Indisponível",
    error: "Erro",
    info_title: "Aviso:",
    info_body: "Esta página replica o layout do app de indicadores. Para resultados ao vivo, conecte um backend/API.",
  },
  en: {
    language: "Language",
    language_pt: "PT",
    language_en: "EN",
    language_es: "ES",
    list_title: "Indicator List & Recommendations",
    list_subtitle: "Analyze multiple tickers at once and open detailed charts with a single click.",
    list_form_label: "Tickers (comma separated)",
    list_form_placeholder: "e.g., QQQ, COWZ, IBIT",
    list_analyze: "Analyze list",
    list_hint: "Click the ticker to open the charting app in a new tab.",
    list_results: "Results",
    download_report: "Download Word report",
    list_table_ticker: "Ticker",
    list_table_price: "Price",
    list_table_macd: "MACD / Signal",
    list_table_recommendation: "Recommendation",
    list_table_summary: "Summary / Rationale",
    list_empty: "Enter one or more tickers above and click \"Analyze list\".",
    unavailable: "Unavailable",
    error: "Error",
    info_title: "Notice:",
    info_body: "This page mirrors the indicator app layout. For live results, connect a backend/API.",
  },
  es: {
    language: "Idioma",
    language_pt: "PT",
    language_en: "EN",
    language_es: "ES",
    list_title: "Lista de Indicadores y Recomendaciones",
    list_subtitle: "Analiza varios tickers y abre gráficos detallados con un clic.",
    list_form_label: "Tickers (separados por coma)",
    list_form_placeholder: "ej.: QQQ, COWZ, IBIT",
    list_analyze: "Analizar lista",
    list_hint: "Haz clic en el ticker para abrir el gráfico en una nueva pestaña.",
    list_results: "Resultados",
    download_report: "Descargar reporte Word",
    list_table_ticker: "Ticker",
    list_table_price: "Precio",
    list_table_macd: "MACD / Señal",
    list_table_recommendation: "Recomendación",
    list_table_summary: "Resumen / Razonamiento",
    list_empty: "Ingresa uno o más tickers arriba y haz clic en \"Analizar lista\".",
    unavailable: "No disponible",
    error: "Error",
    info_title: "Aviso:",
    info_body: "Esta página replica el diseño del app de indicadores. Para resultados en vivo, conecta un backend/API.",
  },
};

const DEFAULT_TICKERS = "QQQ,GLD, SLV, GOOGL, SPY,LLY, PLTR,AMD,BTC,AMZN,SOFI,TSLA,NVDA,NFLX";
const API_ENDPOINT = "https://psi-indicadores-api.onrender.com/api/recommendations";
const GRAPH_BASE = "";

const form = document.getElementById("indicator-form");
const tickersInput = document.getElementById("tickers");
const tableWrap = document.getElementById("table-wrap");
const tableBody = document.getElementById("results-body");
const emptyState = document.getElementById("empty-state");
const downloadWrap = document.getElementById("download-wrap");

function getLang() {
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || "pt").toLowerCase();
  return I18N[lang] ? lang : "pt";
}

function setLang(lang) {
  const dict = I18N[lang] || I18N.pt;
  document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  tickersInput.placeholder = dict.list_form_placeholder;
}

function parseTickers(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function setLangInputs(lang) {
  document.querySelectorAll('input[name="lang"]').forEach((input) => {
    input.checked = input.value === lang;
  });
}

function renderEmpty() {
  tableWrap.hidden = true;
  downloadWrap.hidden = true;
  emptyState.hidden = false;
  tableBody.innerHTML = "";
}

function renderPlaceholders(lang, tickers) {
  const dict = I18N[lang] || I18N.pt;
  tableBody.innerHTML = "";
  tickers.forEach((ticker) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="ticker-wrap">
          <span class="ticker-link disabled">${ticker}</span>
          <span class="dcf-btn disabled">${dict.list_table_recommendation === "Recomendação" ? "DCF" : "DCF"}</span>
        </span>
      </td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">-- / --</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="pill neutral">${dict.unavailable}</span></td>
      <td><span class="muted">${dict.unavailable}</span></td>
    `;
    tableBody.appendChild(row);
  });
  tableWrap.hidden = false;
  downloadWrap.hidden = true;
  emptyState.hidden = true;
}

async function fetchResults(lang, tickers) {
  if (!API_ENDPOINT) {
    renderPlaceholders(lang, tickers);
    return;
  }
  const params = new URLSearchParams({
    tickers: tickers.join(","),
    lang,
  });
  try {
    const resp = await fetch(`${API_ENDPOINT}?${params.toString()}`);
    if (!resp.ok) {
      throw new Error("API error");
    }
    const payload = await resp.json();
    renderFromApi(lang, tickers, payload);
  } catch (err) {
    renderPlaceholders(lang, tickers);
  }
}

function renderFromApi(lang, tickers, payload) {
  const dict = I18N[lang] || I18N.pt;
  tableBody.innerHTML = "";
  tickers.forEach((ticker) => {
    const data = payload && payload.data ? payload.data[ticker] : null;
    const recommendation = data && data.recomendacao_label ? data.recomendacao_label : (data && data.recomendacao) || dict.unavailable;
    const recClass = recommendation.includes("ENTRY") || recommendation.includes("ENTRAR") || recommendation.includes("ENTRADA")
      ? "buy"
      : recommendation.includes("EXIT") || recommendation.includes("SAIR") || recommendation.includes("SALIR")
      ? "sell"
      : "neutral";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="ticker-wrap">
          ${GRAPH_BASE ? `<a class="ticker-link" href="${GRAPH_BASE}/grafico/${ticker}" target="_blank" rel="noopener">${ticker}</a>` : `<span class="ticker-link disabled">${ticker}</span>`}
          <span class="dcf-btn disabled">DCF</span>
        </span>
      </td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">-- / --</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="muted">--</span></td>
      <td><span class="pill ${recClass}">${recommendation}</span></td>
      <td><span class="muted">${dict.unavailable}</span></td>
    `;
    tableBody.appendChild(row);
  });
  tableWrap.hidden = false;
  downloadWrap.hidden = true;
  emptyState.hidden = true;
}

function handleSubmit(event) {
  event.preventDefault();
  const lang = getLang();
  const tickers = parseTickers(tickersInput.value);
  if (!tickers.length) {
    renderEmpty();
    return;
  }
  fetchResults(lang, tickers);
}

function init() {
  const lang = getLang();
  setLang(lang);
  setLangInputs(lang);
  const params = new URLSearchParams(window.location.search);
  const tickersParam = params.get("tickers");
  tickersInput.value = tickersParam || DEFAULT_TICKERS;
  renderEmpty();
}

document.querySelectorAll('input[name="lang"]').forEach((input) => {
  input.addEventListener("change", () => {
    const lang = input.value;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.location.href = url.toString();
  });
});

form.addEventListener("submit", handleSubmit);
init();
