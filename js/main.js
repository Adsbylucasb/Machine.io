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
  phone: '',
  email: ''
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
    const name    = (document.getElementById('contactName').value    || '').trim();
    const company = (document.getElementById('contactCompany').value || '').trim();
    const phone   = (document.getElementById('contactPhone').value   || '').trim();
    const emailEl = document.getElementById('contactEmail');
    const email   = emailEl ? (emailEl.value || '').trim() : '';
    return name.length > 0 && company.length > 0 && phone.length > 0 && email.length > 0;
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
  const submitBtn = document.getElementById('submitBtn');
  const answered = isStepAnswered(currentStep);

  prevBtn.disabled = currentStep === 1;

  if (currentStep === CONTACT_STEP) {
    // Step 7: hide nextBtn, show submitBtn
    nextBtn.style.display = 'none';
    if (submitBtn) {
      submitBtn.style.display = '';
      submitBtn.disabled = !answered;
    }
  } else {
    // Steps 1-6: show nextBtn, hide submitBtn
    if (submitBtn) submitBtn.style.display = 'none';
    nextBtn.style.display = '';
    nextBtn.textContent = currentStep === QUIZ_QUESTIONS ? 'Voir mon résultat' : 'Suivant';
    nextBtn.disabled = !answered;
  }
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
  contactData.name    = (document.getElementById('contactName').value    || '').trim();
  contactData.company = (document.getElementById('contactCompany').value || '').trim();
  contactData.phone   = (document.getElementById('contactPhone').value   || '').trim();
  const emailEl = document.getElementById('contactEmail');
  contactData.email   = emailEl ? (emailEl.value || '').trim() : '';
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

  // Contact step: populate hidden fields, submit to Formspree, then show result
  if (currentStep === CONTACT_STEP) {
    saveContactData();

    // Copy quiz answers into hidden form fields (q2 is checkbox → join)
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].forEach(q => {
      const el = document.getElementById('hidden' + q.toUpperCase());
      if (el) {
        const val = answers[q];
        el.value = Array.isArray(val) ? val.join(', ') : (val || '');
      }
    });

    const submitBtn = document.getElementById('submitBtn');
    const errEl     = document.getElementById('formError');
    const successEl = document.getElementById('formSuccess');

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours…'; }
    if (errEl)     errEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';

    fetch('https://formspree.io/f/xnjoorqp', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName:    contactData.name,
        contactCompany: contactData.company,
        contactPhone:   contactData.phone,
        email:          contactData.email,
        q1: answers.q1 || '',
        q2: Array.isArray(answers.q2) ? answers.q2.join(', ') : (answers.q2 || ''),
        q3: answers.q3 || '',
        q4: answers.q4 || '',
        q5: answers.q5 || '',
        q6: answers.q6 || '',
        _subject: 'Nouveau lead - Machine.io'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer'; }
        if (successEl) {
          successEl.textContent = 'Envoi réussi !';
          successEl.style.display = 'block';
        }
        showEligibleResult();
      } else {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer'; }
        if (errEl) {
          errEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
          errEl.style.display = 'block';
        }
      }
    })
    .catch(() => {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer'; }
      if (errEl) {
        errEl.textContent = 'Erreur réseau. Veuillez réessayer.';
        errEl.style.display = 'block';
      }
    });
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
      // Not eligible: send quiz answers fire-and-forget, no contact data available
      fetch('https://formspree.io/f/xnjoorqp', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q1: answers.q1 || '',
          q2: Array.isArray(answers.q2) ? answers.q2.join(', ') : (answers.q2 || ''),
          q3: answers.q3 || '',
          q4: answers.q4 || '',
          q5: answers.q5 || '',
          q6: answers.q6 || '',
          _subject: 'Nouveau lead non éligible - Machine.io'
        })
      });
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
['contactName', 'contactCompany', 'contactPhone', 'contactEmail'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateNavButtons);
});

// Intercept native form submit — keep AJAX logic, prevent page redirect
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    quizNext();
  });
}

// --- Init ---
showStep(1);
