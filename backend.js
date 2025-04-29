/**********************************************************************/
/*                                UTILS                               */
/**********************************************************************/
const HOST = "https://henry1477.asuscomm.com:8000";
/**
 * Pauses execution for a random duration between min and max milliseconds.
 * @param {number} min - The minimum time to sleep in milliseconds.
 * @param {number} max - The maximum time to sleep in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
function waitRandomTime(min, max) {
  if (min > max) [min, max] = [max, min];
  const randomMs = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, randomMs));
}

/**
 * Applies a set of CSS styles to a DOM element.
 * @param {HTMLElement} element - The target element to style.
 * @param {Object} style - An object of CSS property–value pairs.
 */
function applyStyles(element, style) {
  for (const key in style) {
    if (Object.prototype.hasOwnProperty.call(style, key)) {
      element.style[key] = style[key];
    }
  }
}

/**********************************************************************/
/*                               POPUPS                               */
/**********************************************************************/
let activePopup = null; // { popup: HTMLElement, trigger: HTMLElement }

/**
 * Closes the currently-open popup, if any.
 */
function closeActivePopup() {
  if (activePopup) {
    activePopup.popup.remove();
    activePopup = null;
  }
}

/**
 * Creates (or toggles) a popup next to a trigger element.
 * @param {HTMLElement} trigger - The element that was clicked.
 * @param {HTMLElement | string} content - The node or HTML string to display inside the popup.
 */
function togglePopup(trigger, content) {
  // Same trigger → toggle off
  if (activePopup && activePopup.trigger === trigger) {
    closeActivePopup();
    return;
  }

  // Clicked a new trigger → close old and open new
  closeActivePopup();

  const popup = document.createElement("div");
  popup.className = "enrichment-popup";
  popup.innerHTML = typeof content === "string" ? content : "";
  if (content instanceof HTMLElement) popup.appendChild(content);

  // Basic styling; feel free to tweak
  applyStyles(popup, {
    position: "absolute",
    zIndex: 9_999,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxShadow: "0 2px 6px rgba(0,0,0,.2)",
    padding: "8px",
    maxWidth: "280px",
    fontSize: "13px"
  });

  // Position next to trigger
  const rect = trigger.getBoundingClientRect();
  const doc = document.documentElement;
  popup.style.top = `${rect.bottom + doc.scrollTop + 4}px`;
  popup.style.left = `${rect.left + doc.scrollLeft}px`;

  document.body.appendChild(popup);
  activePopup = { popup, trigger };
}

// Dismiss popup on outside click or scroll
function outsideDismissListener(e) {
  if (
    activePopup &&
    !activePopup.popup.contains(e.target) &&
    !activePopup.trigger.contains(e.target)
  ) {
    closeActivePopup();
  }
}
window.addEventListener("click", outsideDismissListener);
window.addEventListener("scroll", closeActivePopup, { passive: true });

/**********************************************************************/
/*                        DATA-FETCHING HELPERS                       */
/**********************************************************************/
/**
 * Simulates fetching the average GPA for a given course.
 * @param {string} courseName - The identifier of the course.
 * @returns {Promise<string>} A promise that resolves with the average GPA (as a string), or "None" on error.
 */
async function fetchCourseGPA(courseName) {
  try {
    const response = await fetch(`${HOST}/class/${courseName}/grades`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { gpa } = await response.json();
    return gpa && gpa > 0 ? gpa.toFixed(2) : "None";
  } catch (err) {
    console.error("fetchCourseGPA", err);
    return "None";
  }
}

/**
 * Simulates fetching the rating for a given professor.
 * @param {string} professor - The name of the professor.
 * @returns {Promise<string>} A promise that resolves with the professor's rating (as a string), or "None" on error.
 */
async function fetchProfessorRating(professor) {
  try {
    const response = await fetch(`${HOST}/professor/${encodeURIComponent(professor)}/ratings`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { average_rating } = await response.json();
    return average_rating && average_rating > 0 ? average_rating.toFixed(2) : "None";
  } catch (err) {
    console.error("fetchProfessorRating", err);
    return "None";
  }
}

/**********************************************************************/
/*                         EVENT HANDLERS (UI)                        */
/**********************************************************************/
/**
 * Handles click events on the course GPA display to show the GPA graph.
 */
function handleGPAGraphClick(e) {
  const targetSpan = walkBackUntil(e.target, el => el.matches(".class-gpa-span"));
  if (!targetSpan) return;

  // Dummy content; replace with graph / async fetch if desired
  const courseName = targetSpan.closest(".course").id;
  togglePopup(targetSpan, `<b>${courseName}</b><br/>GPA distribution graph coming soon…`);
}

/**
 * Handles click events on the professor rating display to show detailed ratings.
 */
function handleProfessorRatingsClick(e) {
  const targetSpan = walkBackUntil(e.target, el => el.matches(".professor-ratings-span"));
  if (!targetSpan) return;

  const profName = targetSpan.textContent.replace(/\(Rating: |\/5\)|\)/g, "").trim();
  togglePopup(targetSpan, `<b>${profName}</b><br/>Detailed rating breakdown coming soon…`);
}

/**********************************************************************/
/*                            END UTILS                               */
/**********************************************************************/

const style = document.createElement("style");
style.textContent = `
  .gpa-spinner{display:inline-block;width:.65em;height:.65em;border:.15em solid currentColor;border-right-color:transparent;border-radius:50%;animation:gpa-spin .6s linear infinite;vertical-align:middle}
  @keyframes gpa-spin{to{transform:rotate(360deg)}}
  .enrichment-popup{animation:fade-in .14s ease-out}
  @keyframes fade-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1}}
`;
document.head.appendChild(style);

const state = {};

/**********************************************************************/
/*                          ENRICHMENT LOGIC                          */
/**********************************************************************/
async function enrichInstructorData(className, instructor, element) {
  if (instructor === "Instructor: TBA") return;

  const placeholder = document.createElement("span");
  placeholder.innerHTML = `(Rating: <b><span class="gpa-spinner"></span></b>)`;
  element.appendChild(placeholder);

  const rating = await fetchProfessorRating(instructor);
  const span = document.createElement("span");
  span.className = "professor-ratings-span";
  Object.assign(span.style, { cursor: "pointer", textDecoration: "underline" });
  span.onmouseenter = () => applyStyles(span, { color: "blue" });
  span.onmouseleave = () => applyStyles(span, { color: "black" });
  span.onclick = handleProfessorRatingsClick;
  span.innerHTML = rating === "None" ? `(Rating: <b>${rating}</b>)` : `(Rating: <b>${rating}/5</b>)`;

  placeholder.replaceWith(span);
}

async function enrichSectionData({ className, instructors, instructorElements }) {
  await Promise.all(instructors.map((instructor, i) => enrichInstructorData(className, instructor, instructorElements[i])));
}

function extractSectionRows(mutations) {
  const rows = [];
  for (const { addedNodes } of mutations) {
    addedNodes.forEach(node => {
      if (node instanceof Element && node.matches(".sections-container")) {
        node.querySelectorAll(".section-info-container .row").forEach(r => rows.push(r));
      }
    });
  }
  return rows;
}

function walkBackUntil(element, predicate) {
  while (element && !predicate(element)) element = element.parentElement;
  return element;
}

function parseSectionRows(rows) {
  const classElm = walkBackUntil(rows[0], el => el.matches(".course"));
  const courseId = classElm.id;

  const instructors = [];
  const instructorElements = [];

  rows.forEach(row => {
    const names = Array.from(row.querySelectorAll(".section-instructor"), e => e.innerText);
    instructors.push(...names);
    instructorElements.push(row.querySelector(".section-instructors"));
  });

  return { className: courseId, instructors, instructorElements };
}

async function enrichCourseTitle(courseElement, courseName) {
  const titleEl = courseElement.querySelector(".course-title");
  const placeholder = document.createElement("span");
  placeholder.innerHTML = `(Avg GPA: <b><span class="gpa-spinner"></span></b>)`;
  titleEl.parentElement.appendChild(placeholder);

  const avgGPA = await fetchCourseGPA(courseName);
  const span = document.createElement("span");
  span.className = "class-gpa-span";
  Object.assign(span.style, { cursor: "pointer", textDecoration: "underline" });
  span.onmouseenter = () => applyStyles(span, { color: "blue" });
  span.onmouseleave = () => applyStyles(span, { color: "black" });
  span.onclick = handleGPAGraphClick;
  span.innerHTML = `(Avg GPA: <b>${avgGPA}</b>)`;

  placeholder.replaceWith(span);
}

async function initializeObservers() {
  const observer = new MutationObserver(mutations => {
    const rows = extractSectionRows(mutations);
    if (!rows.length) return;
    try {
      enrichSectionData(parseSectionRows(rows));
    } catch (err) {
      console.error("enrichSectionData", err);
    }
  });

  const base = document.querySelector(".course-prefix-container");
  if (base) observer.observe(base, { childList: true, subtree: true });

  const courseDivs = Array.from(document.querySelectorAll(".course"));
  const ids = courseDivs.map(el => el.id);
  ids.forEach(id => (state[id] = state[id] || {}));

  await Promise.all(courseDivs.map((div, i) => enrichCourseTitle(div, ids[i])));
}

window.addEventListener("load", initializeObservers);
