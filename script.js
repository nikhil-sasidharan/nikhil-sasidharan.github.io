"use strict";

// Keep the original English content, including line breaks.
const translatedElements = Array.from(
  document.querySelectorAll("[data-de]")
).map((element) => ({
  element,
  english: Array.from(element.childNodes).map((node) =>
    node.cloneNode(true)
  ),
  german: element.dataset.de
}));

const languageButtons = document.querySelectorAll("[data-lang]");
const navigation = document.querySelector(".main-nav");
const focusGraphic = document.querySelector(".hero-visual");
const description = document.querySelector('meta[name="description"]');

const descriptions = {
  en: "Nikhil Sasidharan — Supply chain, inventory management and operational excellence. Professional experience across Germany, the Czech Republic and India.",
  de: "Nikhil Sasidharan — Supply Chain, Bestandsmanagement und Operational Excellence. Berufserfahrung in Deutschland, Tschechien und Indien."
};

// Storage may be unavailable in some privacy settings.
// The language switch still works without it.
function readSavedLanguage() {
  try {
    return localStorage.getItem("portfolio-language");
  } catch {
    return null;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem("portfolio-language", language);
  } catch {
    // Continue without saving the preference.
  }
}

function setLanguage(language) {
  const selectedLanguage = language === "de" ? "de" : "en";

  document.documentElement.lang = selectedLanguage;

  translatedElements.forEach(({ element, english, german }) => {
    if (selectedLanguage === "de") {
      element.textContent = german;
    } else {
      element.replaceChildren(
        ...english.map((node) => node.cloneNode(true))
      );
    }
  });

  languageButtons.forEach((button) => {
    const isSelected = button.dataset.lang === selectedLanguage;
    button.setAttribute("aria-pressed", String(isSelected));
  });

  if (navigation) {
    navigation.setAttribute(
      "aria-label",
      selectedLanguage === "de" ? "Hauptnavigation" : "Main navigation"
    );
  }

  if (focusGraphic) {
    focusGraphic.setAttribute(
      "aria-label",
      selectedLanguage === "de"
        ? "Berufliche Schwerpunkte"
        : "Professional focus"
    );
  }

  if (description) {
    description.content = descriptions[selectedLanguage];
  }

  document.title =
    selectedLanguage === "de"
      ? "Nikhil Sasidharan | Supply Chain & Operative Exzellenz"
      : "Nikhil Sasidharan | Supply Chain & Operational Excellence";

  saveLanguage(selectedLanguage);
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
});

// Start in English unless the visitor previously chose German.
setLanguage(readSavedLanguage() === "de" ? "de" : "en");

// Keep the footer year current.
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

// Adjust anchor spacing to the actual header height.
// This also accommodates longer German menu labels.
const header = document.querySelector(".site-header");

function updateHeaderSpacing() {
  if (header) {
    document.documentElement.style.scrollPaddingTop =
      `${Math.ceil(header.getBoundingClientRect().height) + 20}px`;
  }
}

updateHeaderSpacing();

if ("ResizeObserver" in window && header) {
  const headerObserver = new ResizeObserver(updateHeaderSpacing);
  headerObserver.observe(header);
} else {
  window.addEventListener("resize", updateHeaderSpacing);
}

// Highlight the section currently being read.
const navLinks = Array.from(
  document.querySelectorAll('.main-nav a[href^="#"]')
);

const sections = Array.from(
  document.querySelectorAll("main section[id]")
);

let updateScheduled = false;

function updateActiveSection() {
  const readingLine = header
    ? header.getBoundingClientRect().height + 90
    : 150;

  let currentId = "";

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= readingLine) {
      currentId = section.id;
    }
  });

  // Make the final section active at the bottom of the page.
  const atBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 4;

  if (atBottom && sections.length > 0) {
    currentId = sections[sections.length - 1].id;
  }

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === `#${currentId}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  updateScheduled = false;
}

function scheduleNavigationUpdate() {
  if (!updateScheduled) {
    updateScheduled = true;
    window.requestAnimationFrame(updateActiveSection);
  }
}

window.addEventListener("scroll", scheduleNavigationUpdate, {
  passive: true
});

window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("load", scheduleNavigationUpdate);

languageButtons.forEach((button) => {
  button.addEventListener("click", scheduleNavigationUpdate);
});

updateActiveSection();

/* Pause decorative motion; keep the control translated. */
const motionToggle = document.getElementById("motion-toggle");
function updateMotionLabel() {
  if (!motionToggle) return;
  const paused = document.documentElement.classList.contains("motion-paused");
  const german = document.documentElement.lang === "de";
  motionToggle.textContent = german
    ? (paused ? "Animation fortsetzen" : "Animation pausieren")
    : (paused ? "Resume motion" : "Pause motion");
  motionToggle.setAttribute("aria-pressed", String(paused));
}
if (motionToggle) {
  motionToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("motion-paused");
    updateMotionLabel();
  });
  languageButtons.forEach(button => button.addEventListener("click", updateMotionLabel));
  updateMotionLabel();
}
