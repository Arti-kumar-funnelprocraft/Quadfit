const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileLinks = document.querySelectorAll(".mobile-menu a");
const assessmentForm = document.querySelector("[data-assessment-form]");
const pillarTrack = document.querySelector("[data-pillar-track]");
const methodSection = document.querySelector(".method");

if (pillarTrack && !pillarTrack.dataset.loopReady) {
  const originalPillars = [...pillarTrack.children];
  originalPillars.forEach((pillar, index) => {
    pillar.dataset.pillarIndex = String(index);
    const clone = pillar.cloneNode(true);
    clone.classList.add("pillar--clone");
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("tabindex");
    pillarTrack.appendChild(clone);
  });
  pillarTrack.dataset.loopReady = "true";
}

if (pillarTrack && methodSection) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let railOffset = 0;
  let previousTime = performance.now();
  let isDragging = false;
  let previousPointerX = 0;
  let dragVelocity = 0;
  let resumeAt = 0;
  let isSectionVisible = false;
  let activePillarIndex = null;
  let activePillarSince = 0;

  const getCycleWidth = () => {
    const first = pillarTrack.querySelector('.pillar:not(.pillar--clone)');
    const firstClone = pillarTrack.querySelector('.pillar--clone');
    return first && firstClone ? firstClone.offsetLeft - first.offsetLeft : 0;
  };

  const normalizeOffset = () => {
    const cycleWidth = getCycleWidth();
    if (!cycleWidth) return;
    while (railOffset <= -cycleWidth) railOffset += cycleWidth;
    while (railOffset > 0) railOffset -= cycleWidth;
  };

  const updateCenteredPillar = () => {
    const viewportCenter = window.innerWidth / 2;
    const cards = [...pillarTrack.querySelectorAll('.pillar')];
    let closestCard = null;
    let closestDistance = Infinity;
    cards.forEach((card) => {
      const rect = (card.querySelector('.pillar-core') || card).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
      }
    });

    const candidateIndex = closestCard?.dataset.pillarIndex ?? null;
    const now = performance.now();
    if (activePillarIndex === null && candidateIndex !== null) {
      activePillarIndex = candidateIndex;
      activePillarSince = now;
    } else if (candidateIndex !== null && candidateIndex !== activePillarIndex) {
      const activeDistance = cards
        .filter((card) => card.dataset.pillarIndex === activePillarIndex)
        .reduce((distance, card) => {
          const rect = (card.querySelector('.pillar-core') || card).getBoundingClientRect();
          return Math.min(distance, Math.abs(rect.left + rect.width / 2 - viewportCenter));
        }, Infinity);
      const minimumHold = isDragging ? 400 : 1400;
      if (now - activePillarSince >= minimumHold && closestDistance + 90 < activeDistance) {
        activePillarIndex = candidateIndex;
        activePillarSince = now;
      }
    }

    cards.forEach((card) => {
      card.classList.toggle('is-expanded', activePillarIndex !== null && card.dataset.pillarIndex === activePillarIndex);
    });
  };

  const renderRail = () => {
    normalizeOffset();
    pillarTrack.style.transform = `translate3d(${railOffset}px, 0, 0)`;
    updateCenteredPillar();
  };

  const animateRail = (time) => {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    if (isSectionVisible && !isDragging) {
      if (Math.abs(dragVelocity) > 0.08) {
        railOffset += dragVelocity;
        dragVelocity *= 0.92;
      } else if (!reducedMotion && time >= resumeAt) {
        railOffset -= 36 * delta;
      }
    }
    renderRail();
    window.requestAnimationFrame(animateRail);
  };

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    resumeAt = performance.now() + 850;
    pillarTrack.classList.remove('is-dragging');
    if (pillarTrack.hasPointerCapture?.(event.pointerId)) pillarTrack.releasePointerCapture(event.pointerId);
  };

  pillarTrack.setAttribute('aria-label', 'Adaptive Progress System pillars. Drag left or right to explore.');
  pillarTrack.addEventListener('pointerdown', (event) => {
    isDragging = true;
    previousPointerX = event.clientX;
    dragVelocity = 0;
    pillarTrack.classList.add('is-dragging');
    pillarTrack.setPointerCapture?.(event.pointerId);
  });
  pillarTrack.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const movement = event.clientX - previousPointerX;
    previousPointerX = event.clientX;
    railOffset += movement;
    dragVelocity = movement;
    renderRail();
  });
  pillarTrack.addEventListener('pointerup', endDrag);
  pillarTrack.addEventListener('pointercancel', endDrag);
  pillarTrack.addEventListener('lostpointercapture', () => {
    isDragging = false;
    pillarTrack.classList.remove('is-dragging');
  });

  const visibilityObserver = new IntersectionObserver((entries) => {
    isSectionVisible = entries[0]?.isIntersecting ?? false;
  }, { rootMargin: '20% 0px 20%' });
  visibilityObserver.observe(methodSection);
  window.addEventListener('resize', renderRail);
  renderRail();
  window.requestAnimationFrame(animateRail);
}
const journeyItems = [...document.querySelectorAll(".journey-list li")];
const journeyCurrentLabel = document.querySelector("[data-journey-current]");
let currentJourneyStep = 0;
const setJourneyStep = (index) => {
  if (!journeyItems.length) return;
  currentJourneyStep = (index + journeyItems.length) % journeyItems.length;
  journeyItems.forEach((item, itemIndex) => item.classList.toggle("is-current", itemIndex === currentJourneyStep));
  if (journeyCurrentLabel) journeyCurrentLabel.textContent = String(currentJourneyStep + 1).padStart(2, "0");
  const journeyTracker = document.querySelector('.quad-journey-tracker');
  if (journeyTracker) {
    journeyTracker.style.setProperty('--journey-progress', String((currentJourneyStep + 1) / journeyItems.length));
    journeyTracker.querySelector('[data-journey-name]').textContent = journeyItems[currentJourneyStep].querySelector('h3').textContent;
    journeyTracker.querySelectorAll('.quad-journey-dots i').forEach((dot, index) => dot.classList.toggle('is-complete', index <= currentJourneyStep));
  }
};
setJourneyStep(0);
journeyItems.forEach((item, index) => {
  item.addEventListener("pointerenter", () => setJourneyStep(index));
  item.addEventListener("focusin", () => setJourneyStep(index));
});
if (journeyItems.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.setInterval(() => setJourneyStep(currentJourneyStep + 1), 2800);
}
const phoneExerciseName = document.querySelector("[data-phone-exercise]");
const phoneExerciseReps = document.querySelector("[data-phone-reps]");
const phoneExercises = [
  { name: "Goblet squat", reps: "12 reps" },
  { name: "Romanian deadlift", reps: "10 reps" },
  { name: "Split-stance row", reps: "12 / side" },
];

if (phoneExerciseName && phoneExerciseReps && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let currentExercise = 0;
  window.setInterval(() => {
    phoneExerciseName.classList.add("is-changing");
    window.setTimeout(() => {
      currentExercise = (currentExercise + 1) % phoneExercises.length;
      phoneExerciseName.textContent = phoneExercises[currentExercise].name;
      phoneExerciseReps.textContent = phoneExercises[currentExercise].reps;
      phoneExerciseName.classList.remove("is-changing");
    }, 180);
  }, 3600);
}










const setMenu = (isOpen) => {
  menuButton?.setAttribute("aria-expanded", String(isOpen));
  mobileMenu?.classList.toggle("is-open", isOpen);
  if (mobileMenu) mobileMenu.hidden = !isOpen;
  menuButton?.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  document.body.classList.toggle("menu-open", isOpen);
};

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

mobileLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  },
  { passive: true },
);

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

document.querySelectorAll(".pillar").forEach((pillar) => {
  const makeActive = () => {
    document.querySelectorAll(".pillar").forEach((item) => item.classList.remove("pillar--active"));
    pillar.classList.add("pillar--active");
  };

  pillar.addEventListener("mouseenter", makeActive);
  pillar.addEventListener("focus", makeActive);
});

document.querySelectorAll(".accordion details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".accordion details").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

assessmentForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = assessmentForm.querySelector(".form-note");
  const selected = assessmentForm.querySelector('input[name="goal"]:checked');

  if (!selected) {
    note.textContent = "Choose the option that most closely reflects your current situation.";
    assessmentForm.querySelector('input[name="goal"]')?.focus();
    return;
  }

  note.textContent =
    "Your choice has been noted. The remaining assessment steps will be connected during the next build phase.";
});

// Loop the illustrative progress and its numeric counter together.
const progressMeter = document.querySelector('.quad-meter');
const progressCount = document.querySelector('[data-progress-count]');
if (progressMeter && progressCount) {
  const progressFill = progressMeter.querySelector('span');
  const reducedProgressMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cycleDuration = 6000;
  let progressStart;
  const renderProgress = (value) => {
    progressFill.style.width = `${value}%`;
    progressCount.textContent = `${Math.round(value)}%`;
    progressMeter.setAttribute('aria-valuenow', String(Math.round(value)));
  };
  const animateProgress = (time) => {
    if (reducedProgressMotion.matches) { renderProgress(78); return; }
    progressStart ??= time;
    const phase = ((time - progressStart) % cycleDuration) / cycleDuration;
    // Rise from 10 to 78, then count back down before repeating.
    const fraction = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    renderProgress(10 + 68 * fraction);
    window.requestAnimationFrame(animateProgress);
  };
  window.requestAnimationFrame(animateProgress);
}

// Example coaching topics: user-driven updates, without automatic text changes.
const supportTopics = {
  training: { question: 'I only have 25 minutes to train today. Is it still worth doing?', answer: 'Absolutely. Let\u2019s focus on your main movements and save the extras for next time. A shorter session still counts.', action: 'A simpler session. The same direction.' },
  nutrition: { question: 'I\u2019m eating out tonight. How do I keep my plan on track?', answer: 'Let\u2019s look at choices you\u2019ll enjoy and build a balanced meal around them. One meal doesn\u2019t need to become an all-or-nothing decision.', action: 'More flexible choices. Less second-guessing.' },
  routine: { question: 'My week has changed and I can\u2019t follow the original schedule.', answer: 'Let\u2019s work with the time you actually have. We can adjust your sessions and choose a few priorities for this week.', action: 'A plan for this week. Not an ideal week.' }
};
document.querySelectorAll('[data-support-topic]').forEach(button => {
  button.addEventListener('click', () => {
    const topic = supportTopics[button.dataset.supportTopic];
    const supportSection = button.closest('.quad-support');
    const activeTopic = button.dataset.supportTopic;
    supportSection.dataset.activeTopic = activeTopic;
    supportSection.querySelector('.quad-support-training-panel').hidden = activeTopic !== 'training';
    supportSection.querySelector('.quad-support-nutrition-panel').hidden = activeTopic !== 'nutrition';
    supportSection.querySelector('.quad-support-routine-panel').hidden = activeTopic !== 'routine';
    document.querySelectorAll('[data-support-topic]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    document.querySelector('[data-support-question]').textContent = topic.question;
    document.querySelector('[data-support-answer]').textContent = topic.answer;
    document.querySelector('[data-support-action]').textContent = topic.action;
    const thread = document.querySelector('.quad-support-thread');
    thread.classList.remove('is-updating');
    void thread.offsetWidth;
    thread.classList.add('is-updating');
  });
});


// Spotlight each coaching focus; visitors can choose a portrait to explore.
const guidanceSection = document.querySelector('.quad-guidance');
if (guidanceSection) {
  const guideCards = [...guidanceSection.querySelectorAll('[data-guide]')];
  const guideDetails = {
    training: ['YOUR TRAINING, IN CONTEXT', 'Know the movement. Understand the next step.', 'Your coach helps you work with your experience, equipment, and available time \u2014 with a clear direction for your sessions.'],
    nutrition: ['YOUR NUTRITION, MADE PRACTICAL', 'Build meals that fit your real routine.', 'Bring your food preferences and everyday questions. Work with your coach on balanced choices and habits you can repeat.'],
    habits: ['YOUR CONSISTENCY, SUPPORTED', 'Make the next step feel achievable.', 'Work through changing weeks, review what is getting in the way, and keep a few clear priorities that help you move forward.']
  };
  let guideIndex = 0;
  let guidanceVisible = false;
  let guideResumeAt = 0;
  const selectGuide = (index) => {
    guideIndex = index;
    guideCards.forEach((card, i) => { card.classList.toggle('is-selected', i === index); card.setAttribute('aria-pressed', String(i === index)); });
    const [eyebrow, title, copy] = guideDetails[guideCards[index].dataset.guide];
    guidanceSection.querySelector('[data-guide-eyebrow]').textContent = eyebrow;
    guidanceSection.querySelector('[data-guide-title]').textContent = title;
    guidanceSection.querySelector('[data-guide-copy]').textContent = copy;
  };
  guideCards.forEach((card, index) => {
    const choose = () => { selectGuide(index); guideResumeAt = performance.now() + 12000; };
    card.addEventListener('click', choose);
    card.addEventListener('pointerenter', choose);
    card.addEventListener('focus', choose);
  });
  new IntersectionObserver(entries => { guidanceVisible = entries[0].isIntersecting; }).observe(guidanceSection);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      if (guidanceVisible && performance.now() >= guideResumeAt && !guidanceSection.matches(':hover') && !guidanceSection.contains(document.activeElement)) selectGuide((guideIndex + 1) % guideCards.length);
    }, 4800);
  }
}

const connectedScenarios = {
  time: ['Your routine changes. Your direction doesn\u2019t have to.', 'Your week has filled up, and your original workout schedule no longer fits.', 'Work with your coach to prioritize the main sessions and simplify the rest around your available time.', 'A realistic week beats an abandoned plan.'],
  food: ['A different menu. The same bigger picture.', 'Travel, eating out, or a family meal means your usual food choices look different.', 'Talk through balanced choices with your coach, keeping your preferences and the occasion in mind.', 'Flexible decisions help your routine stay repeatable.'],
  progress: ['More context. A more useful next step.', 'You have been putting in effort, but one number doesn\u2019t explain how things are going.', 'Review your training, habits, energy, and consistency with your coach before deciding what to adjust.', 'Understand what\u2019s working, then build on it.']
};
document.querySelectorAll('[data-connected]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.quad-connected');
    section.querySelectorAll('[data-connected]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    const [title, context, adjust, result] = connectedScenarios[button.dataset.connected];
    section.querySelector('[data-connected-title]').textContent = title;
    section.querySelector('[data-connected-context]').textContent = context;
    section.querySelector('[data-connected-adjust]').textContent = adjust;
    section.querySelector('[data-connected-result]').textContent = result;
    const response = section.querySelector('.quad-connected-response');
    response.classList.remove('is-changing');
    void response.offsetWidth;
    response.classList.add('is-changing');
  });
});

const briefDeck = document.querySelector('.quad-decision-stack--interactive');
if (briefDeck) {
  const cards = [...briefDeck.querySelectorAll('[data-brief-card]')];
  const deckWrap = briefDeck.closest('.quad-brief-deck');
  const tabs = [...deckWrap.querySelectorAll('[data-brief-select]')];
  let briefHoverLockedUntil = 0;
  const selectBriefCard = index => {
    cards.forEach((card, i) => {
      card.classList.toggle('is-front', i === index);
      card.dataset.briefSlot = String((i - index + cards.length) % cards.length);
    });
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
  };
  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', () => {
      if (performance.now() < briefHoverLockedUntil) return;
      briefHoverLockedUntil = performance.now() + 700;
      selectBriefCard(index);
    });
    card.addEventListener('focus', () => selectBriefCard(index));
    card.addEventListener('click', () => selectBriefCard(index));
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('pointerenter', () => selectBriefCard(index));
    tab.addEventListener('click', () => selectBriefCard(index));
    tab.addEventListener('focus', () => selectBriefCard(index));
  });
  const resetBriefDeck = () => { briefHoverLockedUntil = 0; selectBriefCard(0); };
  deckWrap.addEventListener('pointerleave', resetBriefDeck);
  deckWrap.addEventListener('focusout', event => {
    if (!deckWrap.contains(event.relatedTarget)) resetBriefDeck();
  });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) resetBriefDeck();
  }).observe(deckWrap);
  window.addEventListener('pageshow', resetBriefDeck);
  selectBriefCard(0);
  const fitBriefDeck = () => {
    const height = Math.max(...cards.map(card => card.offsetHeight));
    briefDeck.style.setProperty('--brief-deck-height', `${height + 36}px`);
  };
  cards.forEach(card => new ResizeObserver(fitBriefDeck).observe(card));
  document.fonts.ready.then(fitBriefDeck);
  fitBriefDeck();
}

// Native disclosures keep the scope information readable without scripting.
const boundaryDetails = [...document.querySelectorAll('.quad-boundaries-questions details')];
boundaryDetails.forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    boundaryDetails.forEach(other => { if (other !== detail) other.open = false; });
    const caption = document.querySelector('[data-boundary-label]');
    if (caption) caption.textContent = detail.dataset.boundary;
  });
});

// A half-to-full progress line advances the overlapping scope cards.
const scopeCarousel = document.querySelector('.quad-scope-carousel');
if (scopeCarousel) {
  const panel = scopeCarousel.closest('.quad-scope-carousel-panel');
  const slides = [...scopeCarousel.querySelectorAll('[data-scope-slide]')];
  const controls = [...panel.querySelectorAll('[data-scope-select]')];
  const pauseButton = panel.querySelector('.quad-scope-pause');
  const reducedScopeMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let scopeActive = 0;
  let scopeElapsed = 0;
  let scopeLastTime = null;
  let scopeVisible = false;
  let scopePaused = reducedScopeMotion.matches;
  const scopeDuration = 6500;
  const renderScope = () => {
    slides.forEach((slide, index) => {
      const slot = index === scopeActive ? 2 : (index === (scopeActive + 2) % 3 ? 1 : 0);
      slide.classList.toggle('is-active', index === scopeActive);
      slide.style.setProperty('--scope-left', `${slot * 14}%`);
      slide.style.setProperty('--scope-width', slot === 2 ? '72%' : '53%');
      slide.style.setProperty('--scope-z', String(slot + 1));
      slide.style.setProperty('--scope-progress', String(.5 + Math.min(scopeElapsed / scopeDuration, 1) * .5));
    });
    controls.forEach((control, i) => control.setAttribute('aria-pressed', String(i === scopeActive)));
    panel.querySelector('[data-scope-count]').textContent = `${String(scopeActive + 1).padStart(2, '0')} / 03`;
  };
  const chooseScope = index => { scopeActive = index; scopeElapsed = 0; renderScope(); };
  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => chooseScope(index));
    slide.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseScope(index); }
    });
  });
  controls.forEach((control, index) => control.addEventListener('click', () => chooseScope(index)));
  const renderScopePause = () => {
    if (!pauseButton) return;
    pauseButton.textContent = scopePaused ? 'Play' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(scopePaused));
    pauseButton.setAttribute('aria-label', scopePaused ? 'Play card rotation' : 'Pause card rotation');
  };
  pauseButton?.addEventListener('click', () => { scopePaused = !scopePaused; renderScopePause(); });
  new IntersectionObserver(entries => { scopeVisible = entries[0].isIntersecting; }, { threshold: .2 }).observe(scopeCarousel);
  const tickScope = time => {
    const delta = scopeLastTime === null ? 0 : Math.min(time - scopeLastTime, 100);
    scopeLastTime = time;
    if (scopeVisible && !scopePaused && !document.hidden && !scopeCarousel.contains(document.activeElement)) {
      scopeElapsed += delta;
      if (scopeElapsed >= scopeDuration) { scopeActive = (scopeActive + 1) % slides.length; scopeElapsed = 0; }
      renderScope();
    }
    window.requestAnimationFrame(tickScope);
  };
  renderScope();
  renderScopePause();
  window.requestAnimationFrame(tickScope);
}

// Compose a WhatsApp conversation starter from the visitor's chosen focus.
const startMessages = {
  training: 'I\u2019d like help building a workout routine that fits my goals and schedule.',
  nutrition: 'I\u2019d like help making my nutrition simpler and more consistent.',
  consistency: 'I\u2019d like support to stay consistent with my fitness routine.',
  all: 'I\u2019d like to bring my training, nutrition, and consistency into one plan.'
};
document.querySelectorAll('[data-start-goal]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.quad-start');
    section.querySelectorAll('[data-start-goal]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    const message = startMessages[button.dataset.startGoal];
    section.querySelector('[data-start-summary]').textContent = message;
    section.querySelector('[data-start-link]').href = `https://wa.me/919766590226?text=${encodeURIComponent('Hi QuadFit, ' + message)}`;
  });
});

// Local assessment: values stay in the form and are never persisted or transmitted.
const localAssessment = document.querySelector('[data-local-assessment]');
if (localAssessment) {
  const steps = [...localAssessment.querySelectorAll('[data-assessment-step]')];
  const fields = localAssessment.querySelector('[data-assessment-fields]');
  const result = localAssessment.querySelector('[data-assessment-result]');
  const next = localAssessment.querySelector('[data-assessment-next]');
  const back = localAssessment.querySelector('[data-assessment-back]');
  const error = localAssessment.querySelector('.quad-local-error');
  let assessmentStep = 0;
  const renderAssessment = () => {
    steps.forEach((step, index) => step.hidden = index !== assessmentStep);
    localAssessment.querySelector('[data-assessment-counter]').textContent = `${assessmentStep + 1} / 3`;
    localAssessment.style.setProperty('--assessment-progress', `${(assessmentStep + 1) / 3 * 100}%`);
    back.hidden = assessmentStep === 0;
    next.innerHTML = assessmentStep === 2 ? 'Show my starting point <span aria-hidden="true">&#8594;</span>' : 'Continue <span aria-hidden="true">&#8594;</span>';
    error.textContent = '';
  };
  localAssessment.addEventListener('submit', event => {
    event.preventDefault();
    const selected = steps[assessmentStep].querySelector('input:checked');
    if (!selected) {
      error.textContent = 'Choose the option that best fits your starting point.';
      steps[assessmentStep].querySelector('input').focus();
      return;
    }
    if (assessmentStep < 2) {
      assessmentStep += 1; renderAssessment();
      steps[assessmentStep].querySelector('input').focus();
      return;
    }
    const focus = localAssessment.querySelector('input[name="focus"]:checked').value;
    const messages = {
      training: 'Bring your goals, available equipment, and schedule to your coach. A clear workout routine is a useful place to start.',
      nutrition: 'Start by discussing your usual meals and food preferences. Your coach can help you find practical nutrition habits to work on.',
      consistency: 'Talk through the moments when your routine gets interrupted. A few realistic priorities can help you find your rhythm.',
      all: 'Review training, nutrition, and consistency together with your coach, so the next step fits the whole picture.'
    };
    localAssessment.querySelector('[data-assessment-result-copy]').textContent = messages[focus];
    const list = localAssessment.querySelector('[data-assessment-result-details]');
    list.replaceChildren();
    ['focus','experience','availability'].forEach(name => {
      const input = localAssessment.querySelector(`input[name="${name}"]:checked`);
      const li = document.createElement('li');
      li.textContent = input.nextElementSibling.textContent;
      list.appendChild(li);
    });
    fields.hidden = true; result.hidden = false;
    localAssessment.querySelector('[data-assessment-counter]').textContent = 'Complete';
    localAssessment.style.setProperty('--assessment-progress', '100%');
    result.focus();
  });
  back.addEventListener('click', () => { assessmentStep = Math.max(0, assessmentStep - 1); renderAssessment(); steps[assessmentStep].querySelector('input').focus(); });
  localAssessment.querySelector('[data-assessment-reset]').addEventListener('click', () => {
    localAssessment.reset(); assessmentStep = 0; fields.hidden = false; result.hidden = true;
    localAssessment.querySelector('[data-assessment-result-details]').replaceChildren();
    localAssessment.querySelector('[data-assessment-result-copy]').textContent = '';
    renderAssessment(); steps[0].querySelector('input').focus();
  });
  window.addEventListener('pageshow', () => { localAssessment.reset(); assessmentStep = 0; fields.hidden = false; result.hidden = true; renderAssessment(); });
  renderAssessment();
}

// Close the mobile half-width menu with Escape, outside click, or a wide viewport.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
});
document.addEventListener('click', event => {
  if (menuButton?.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
});
window.addEventListener('resize', () => { if (window.innerWidth > 800) setMenu(false); });
const particleSection = document.querySelector('.quad-start');
if (particleSection) {
  const fitParticles = () => particleSection.style.setProperty('--dot-travel', `${particleSection.offsetHeight + 45}px`);
  new ResizeObserver(fitParticles).observe(particleSection);
  fitParticles();
}
