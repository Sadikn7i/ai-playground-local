const API = 'http://localhost:8000';

// ── Server health check ────────────────────────────────────────

async function checkServer() {
  const dot   = document.getElementById('server-dot');
  const label = document.getElementById('server-label');
  dot.className = 'server-dot loading';
  label.textContent = 'Connecting...';
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      dot.className   = 'server-dot online';
      label.textContent = 'Server online';
    } else throw new Error();
  } catch {
    dot.className   = 'server-dot offline';
    label.textContent = 'Server offline';
  }
}

checkServer();
setInterval(checkServer, 10000);

// ── Tab switching ──────────────────────────────────────────────

document.querySelectorAll('.top-nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.top-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Character count ────────────────────────────────────────────

const trInput = document.getElementById('tr-input');
const trCount = document.getElementById('tr-count');
function updateCount() {
  const n = trInput.value.length;
  trCount.textContent = n + ' character' + (n === 1 ? '' : 's');
}
trInput.addEventListener('input', updateCount);
updateCount();

// ── Language label sync ────────────────────────────────────────

document.getElementById('tr-lang').addEventListener('change', function () {
  document.getElementById('tr-lang-label').textContent =
    this.options[this.selectedIndex].text;
});

// ── Helpers ────────────────────────────────────────────────────

function setStatus(id, text) {
  document.getElementById(id).textContent = text;
}

function setBtn(id, disabled) {
  document.getElementById(id).disabled = disabled;
}

window.copyText = function (id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).catch(() => {});
};

async function post(endpoint, body, statusId) {
  setStatus(statusId, 'Running...');
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || res.statusText);
  }
  setStatus(statusId, '');
  return res.json();
}

// ── Translation ────────────────────────────────────────────────

window.runTranslate = async function () {
  const text = document.getElementById('tr-input').value.trim();
  const lang = document.getElementById('tr-lang').value;
  const out  = document.getElementById('tr-output');
  if (!text) return;

  setBtn('tr-btn', true);
  out.innerHTML = '<span class="output-placeholder">Translating...</span>';

  try {
    const data = await post('/translate', { text, target_lang: lang }, 'tr-status');
    out.textContent = data.translation;
  } catch (e) {
    setStatus('tr-status', 'Error: ' + e.message);
    out.innerHTML = '<span class="output-placeholder">Failed</span>';
  }
  setBtn('tr-btn', false);
};

// ── Sentiment ──────────────────────────────────────────────────

window.runSentiment = async function () {
  const text = document.getElementById('sa-input').value.trim();
  if (!text) return;

  setBtn('sa-btn', true);
  document.getElementById('sa-result').style.display = 'none';

  try {
    const data = await post('/sentiment', { text }, 'sa-status');
    const isPos = data.label === 'POSITIVE';
    const pct   = parseFloat(data.score * 100).toFixed(1);

    const verdict = document.getElementById('sa-verdict');
    const pctEl   = document.getElementById('sa-pct');
    const meter   = document.getElementById('sa-meter');

    verdict.textContent  = isPos ? 'Positive' : 'Negative';
    verdict.style.color  = isPos ? 'var(--green)' : 'var(--red)';
    pctEl.textContent    = pct + '% confidence';

    document.getElementById('sa-result').style.display = 'block';

    requestAnimationFrame(() => setTimeout(() => {
      meter.style.width      = pct + '%';
      meter.style.background = isPos ? 'var(--green)' : 'var(--red)';
    }, 30));

  } catch (e) {
    setStatus('sa-status', 'Error: ' + e.message);
  }
  setBtn('sa-btn', false);
};

// ── Semantic Search ────────────────────────────────────────────

window.runSearch = async function () {
  const corpus = document.getElementById('ss-corpus').value.trim().split('\n').filter(s => s.trim());
  const query  = document.getElementById('ss-query').value.trim();
  const listEl = document.getElementById('ss-result');
  if (!query || !corpus.length) return;

  setBtn('ss-btn', true);
  listEl.innerHTML = '';

  try {
    const data = await post('/search', { query, corpus }, 'ss-status');
    const top  = data.results[0]?.score || 1;

    listEl.innerHTML = data.results.map((r, i) => {
      const pct      = (r.score * 100).toFixed(1);
      const relWidth = ((r.score / top) * 100).toFixed(1);
      return `
        <div class="result-item">
          <span class="result-text">${r.text}</span>
          <div class="result-meta">
            <span class="result-score">${pct}%</span>
            <div class="result-bar-wrap">
              <div class="result-bar" style="width:${relWidth}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    setStatus('ss-status', 'Error: ' + e.message);
  }
  setBtn('ss-btn', false);
};

// ── Summarization ──────────────────────────────────────────────

window.runSummarize = async function () {
  const text   = document.getElementById('su-input').value.trim();
  const result = document.getElementById('su-result');
  if (!text) return;

  setBtn('su-btn', true);
  result.style.display = 'none';

  try {
    const data = await post('/summarize', { text }, 'su-status');
    document.getElementById('su-text').textContent = data.summary;
    result.style.display = 'block';
  } catch (e) {
    setStatus('su-status', 'Error: ' + e.message);
  }
  setBtn('su-btn', false);
};