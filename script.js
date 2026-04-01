/* ─── CREDENTIALS ──────────────────────────────── */
const VALID_USERS = {
  patient: { mobile: '01311106790', password: '1234' }
};

/* ─── LOGIN LOGIC ──────────────────────────────── */
const pwToggleBtn = document.getElementById('pw-toggle');
const pwInput     = document.getElementById('password');

pwToggleBtn.addEventListener('click', () => {
  pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  pwToggleBtn.textContent = pwInput.type === 'password' ? '👁' : '🙈';
});

document.getElementById('login-btn').addEventListener('click', () => {
  const role   = document.getElementById('role').value;
  const mobile = document.getElementById('mobile').value.trim();
  const pass   = document.getElementById('password').value;
  const errEl  = document.getElementById('error-msg');
  const errTxt = document.getElementById('error-text');

  errEl.classList.remove('show');

  if (!role) {
    errTxt.textContent = 'Please select a role.';
    errEl.classList.add('show'); return;
  }
  if (!mobile) {
    errTxt.textContent = 'Please enter your mobile number.';
    errEl.classList.add('show'); return;
  }
  if (!pass) {
    errTxt.textContent = 'Please enter your password.';
    errEl.classList.add('show'); return;
  }

  const creds = VALID_USERS[role];
  if (creds && mobile === creds.mobile && pass === creds.password) {
    showToast('✓ Successfully logged in!');
    setTimeout(() => switchToPhq(role), 1200);
  } else {
    errTxt.textContent = 'Invalid credentials. Please check your details and try again.';
    errEl.classList.add('show');
  }
});

/* Allow Enter key */
['mobile','password'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  });
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function switchToPhq(role) {
  // Hide login view
  document.getElementById('login-view').classList.remove('active');
  // Show PHQ-9 view
  document.getElementById('phq-view').classList.add('active');
  document.getElementById('greeting-chip').textContent = `👋 Welcome, ${capitalize(role)}`;
  buildQuestions();
  window.scrollTo({ top: 0 });
}

function logout() {
  // Hide PHQ-9 view
  document.getElementById('phq-view').classList.remove('active');
  // Show login view
  document.getElementById('login-view').classList.add('active');
  document.getElementById('password').value = '';
  document.getElementById('mobile').value = '';
  document.getElementById('role').value = '';
  document.getElementById('error-msg').classList.remove('show');
  resetForm(true);
  window.scrollTo({ top: 0 });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ─── PHQ-9 DATA ───────────────────────────────── */
const QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

const OPTIONS = [
  { label: "Not at all",              value: 0 },
  { label: "Several days",            value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day",        value: 3 }
];

const DESCRIPTIONS = {
  "Minimal depression":           "Your symptoms are minimal. Continue monitoring your well-being and maintain healthy routines.",
  "Mild depression":              "You may be experiencing mild symptoms. Consider speaking with a healthcare provider if these persist.",
  "Moderate depression":          "Moderate symptoms detected. It is recommended to consult a healthcare professional for evaluation.",
  "Moderately severe depression": "Your symptoms are moderately severe. Please reach out to a healthcare provider soon.",
  "Severe depression":            "Severe symptoms detected. Please seek professional help as soon as possible."
};

const SEV_CLASSES = {
  "Minimal depression":           "sev-minimal",
  "Mild depression":              "sev-mild",
  "Moderate depression":          "sev-moderate",
  "Moderately severe depression": "sev-modsevere",
  "Severe depression":            "sev-severe"
};

const answers = new Array(9).fill(null);

/* ─── RENDER QUESTIONS ─────────────────────────── */
function buildQuestions() {
  const c = document.getElementById('questions-container');
  c.innerHTML = QUESTIONS.map((q, i) => `
    <div class="question-row" id="qrow-${i}">
      <div class="q-head">
        <span class="q-num">${i + 1}</span>
        <span class="q-text">${q}</span>
      </div>
      <div class="opt-grid">
        ${OPTIONS.map(opt => `
          <label class="opt-label" id="opt-${i}-${opt.value}" onclick="selectOption(${i}, ${opt.value})">
            <input type="radio" name="q${i}" value="${opt.value}" />
            <div class="opt-dot"></div>
            <span>${opt.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/* ─── INTERACTIONS ─────────────────────────────── */
function selectOption(qIndex, value) {
  answers[qIndex] = value;
  OPTIONS.forEach(opt => {
    document.getElementById(`opt-${qIndex}-${opt.value}`)
      .classList.toggle('selected', opt.value === value);
  });
  const row = document.getElementById(`qrow-${qIndex}`);
  row.classList.add('answered');
  row.classList.remove('error-row');
  row.style.outline = '';
  updateProgress();
}

function updateProgress() {
  const done = answers.filter(a => a !== null).length;
  const pct  = Math.round((done / 9) * 100);
  document.getElementById('prog-label').textContent = `${done} of 9 answered`;
  document.getElementById('prog-pct').textContent   = `${pct}%`;
  document.getElementById('prog-fill').style.width  = `${pct}%`;
}

/* ─── CALCULATE ────────────────────────────────── */
function calculatePHQ9Score(ans) {
  const total = ans.reduce((s, v) => s + v, 0);
  let severity;
  if (total <= 4)       severity = "Minimal depression";
  else if (total <= 9)  severity = "Mild depression";
  else if (total <= 14) severity = "Moderate depression";
  else if (total <= 19) severity = "Moderately severe depression";
  else                  severity = "Severe depression";
  return { score: total, severity };
}

function handleCalculate() {
  const unanswered = answers.map((a, i) => a === null ? i + 1 : null).filter(Boolean);

  if (unanswered.length > 0) {
    unanswered.forEach(n => {
      const row = document.getElementById(`qrow-${n - 1}`);
      row.classList.add('error-row');
    });
    const firstRow = document.getElementById(`qrow-${unanswered[0] - 1}`);
    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const btn = document.getElementById('calc-btn');
    const orig = btn.textContent;
    btn.textContent = `⚠ Please answer question${unanswered.length > 1 ? 's' : ''} ${unanswered.join(', ')}`;
    btn.style.background = 'linear-gradient(135deg,#dc2626,#ef4444)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 3000);
    return;
  }

  QUESTIONS.forEach((_, i) => {
    document.getElementById(`qrow-${i}`).classList.remove('error-row');
  });

  const result = calculatePHQ9Score(answers);
  showResults(result);
}

function showResults(result) {
  const panel   = document.getElementById('results-panel');
  const circle  = document.getElementById('score-circle');
  const sevCard = document.getElementById('severity-card');

  Object.values(SEV_CLASSES).forEach(c => {
    circle.classList.remove(c);
    sevCard.classList.remove(c);
  });

  const cls = SEV_CLASSES[result.severity] || 'sev-moderate';
  circle.classList.add(cls);
  sevCard.classList.add(cls);

  document.getElementById('result-score').textContent    = result.score;
  document.getElementById('result-severity').textContent = result.severity;
  document.getElementById('result-desc').textContent     = DESCRIPTIONS[result.severity] || '';

  document.querySelectorAll('#range-table tbody tr').forEach(tr => {
    const min = +tr.dataset.min, max = +tr.dataset.max;
    tr.classList.toggle('active-row', result.score >= min && result.score <= max);
  });

  panel.classList.add('visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm(silent = false) {
  answers.fill(null);
  buildQuestions();
  updateProgress();
  document.getElementById('results-panel').classList.remove('visible');
  if (!silent) window.scrollTo({ top: 0, behavior: 'smooth' });
}