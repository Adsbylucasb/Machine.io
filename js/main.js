/* =========================================
   MACHINE.IO — Main JS
   ========================================= */

// ==================
// NAVBAR SCROLL
// ==================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

// ==================
// FADE-IN ON SCROLL
// ==================
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = [...entry.target.parentElement.querySelectorAll('.fade-in')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

fadeEls.forEach(el => observer.observe(el));

// ==================
// QUESTIONNAIRE
// ==================

// Steps 1-6 are qualification questions.
// Step 7 is the contact form (shown only when eligible).
const QUIZ_QUESTIONS = 6;
const CONTACT_STEP = 7;

let currentStep = 1;
const answers = {};

// Contact data — ready to send to CRM or tracking system
const contactData = {
  name: '',
  company: '',
  phone: ''
};

// --- Helpers ---

function getStepEl(step) {
  return document.querySelector(`.quiz-step[data-step="${step}"]`);
}

function getProgressBar() { return document.getElementById('progressBar'); }
function getStepLabel()    { return document.getElementById('stepLabel'); }
function getPrevBtn()      { return document.getElementById('prevBtn'); }
function getNextBtn()      { return document.getElementById('nextBtn'); }

// --- Validation ---

function isStepAnswered(step) {
  if (step === CONTACT_STEP) {
    const name    = (document.getElementById('contactName').value   || '').trim();
    const company = (document.getElementById('contactCompany').value || '').trim();
    const phone   = (document.getElementById('contactPhone').value  || '').trim();
    return name.length > 0 && company.length > 0 && phone.length > 0;
  }

  const stepEl = getStepEl(step);
  if (!stepEl) return false;

  if (stepEl.querySelector('input[type="radio"]:checked'))    return true;
  if (stepEl.querySelector('input[type="checkbox"]:checked')) return true;

  return false;
}

// --- Progress & UI ---

function updateProgress() {
  if (currentStep === CONTACT_STEP) {
    getProgressBar().style.width = '100%';
    getStepLabel().textContent = 'Vos coordonnées';
    return;
  }
  const pct = (currentStep / QUIZ_QUESTIONS) * 100;
  getProgressBar().style.width = pct + '%';
  getStepLabel().textContent = `Question ${currentStep} sur ${QUIZ_QUESTIONS}`;
}

function updateNavButtons() {
  const prevBtn = getPrevBtn();
  const nextBtn = getNextBtn();
  const answered = isStepAnswered(currentStep);

  prevBtn.disabled = currentStep === 1;

  if (currentStep === CONTACT_STEP) {
    nextBtn.textContent = 'Voir mon résultat';
  } else if (currentStep === QUIZ_QUESTIONS) {
    nextBtn.textContent = 'Voir mon résultat';
  } else {
    nextBtn.textContent = 'Suivant';
  }

  nextBtn.disabled = !answered;
}

function showStep(step) {
  document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'));
  const target = getStepEl(step);
  if (target) target.classList.add('active');
  updateProgress();
  updateNavButtons();
}

// --- Answer saving ---

function saveCurrentAnswers() {
  const stepEl = getStepEl(currentStep);
  if (!stepEl) return;

  const radio = stepEl.querySelector('input[type="radio"]:checked');
  if (radio) {
    answers[`q${currentStep}`] = radio.value;
    return;
  }

  const checked = [...stepEl.querySelectorAll('input[type="checkbox"]:checked')];
  if (checked.length > 0) {
    answers[`q${currentStep}`] = checked.map(c => c.value);
  }
}

function saveContactData() {
  contactData.name    = (document.getElementById('contactName').value   || '').trim();
  contactData.company = (document.getElementById('contactCompany').value || '').trim();
  contactData.phone   = (document.getElementById('contactPhone').value  || '').trim();

  // CRM / tracking hook — replace with your integration:
  // console.log('Lead data:', { ...answers, ...contactData });
}

// --- Eligibility ---

function isEligible() {
  // Not eligible only if: CA < 150k AND no budget
  return !(answers.q4 === '<150k' && answers.q5 === 'non');
}

// --- Result display ---

function showEligibleResult() {
  document.querySelector('.quiz-box').style.display = 'none';
  const el = document.getElementById('resultEligible');
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showNotEligibleResult() {
  document.querySelector('.quiz-box').style.display = 'none';
  const el = document.getElementById('resultNotEligible');
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- Navigation ---

window.quizNext = function () {
  if (!isStepAnswered(currentStep)) return;

  // Contact step: save and show eligible result
  if (currentStep === CONTACT_STEP) {
    saveContactData();
    showEligibleResult();
    return;
  }

  saveCurrentAnswers();

  // After last qualification question: branch on eligibility
  if (currentStep === QUIZ_QUESTIONS) {
    if (isEligible()) {
      // Eligible: show contact step first
      currentStep = CONTACT_STEP;
      showStep(currentStep);
    } else {
      // Not eligible: skip contact step
      showNotEligibleResult();
    }
    return;
  }

  currentStep++;
  showStep(currentStep);
};

window.quizPrev = function () {
  if (currentStep === 1) return;
  // From contact step, go back to question 6
  currentStep = (currentStep === CONTACT_STEP) ? QUIZ_QUESTIONS : currentStep - 1;
  showStep(currentStep);
};

// --- Event listeners ---

// Radio / checkbox options
document.querySelectorAll('.quiz-option input').forEach(input => {
  input.addEventListener('change', updateNavButtons);
});

// Contact text inputs (live validation)
['contactName', 'contactCompany', 'contactPhone'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateNavButtons);
});

// --- Init ---
showStep(1);
