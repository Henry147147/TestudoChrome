/**********************************************************************/
/*                                UTILS                               */
/**********************************************************************/

/**
 * Pauses execution for a random duration between min and max milliseconds.
 * @param {number} min - The minimum time to sleep in milliseconds.
 * @param {number} max - The maximum time to sleep in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
function waitRandomTime(min, max) {
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
    element.style[key] = style[key];
  }
}

/**
 * Simulates fetching the average GPA for a given course.
 * @param {string} courseName - The identifier of the course.
 * @returns {Promise<number>} A promise that resolves with the average GPA.
 */
async function fetchCourseGPA(courseName) {
  await waitRandomTime(250, 4000);
  return 3.1;
}

/**
 * Simulates fetching the rating for a given professor.
 * @param {string} professor - The name of the professor.
 * @returns {Promise<number>} A promise that resolves with the professor's rating.
 */
async function fetchProfessorRating(professor) {
  await waitRandomTime(250, 4000);
  return 4.85;
}

/**
 * Handles click events on the course GPA display to show the GPA graph.
 * @param {Event} e - The click event.
 */
function handleGPAGraphClick(e) {
  console.log({ e });
  console.log("clicked");
}

/**
 * Handles click events on the professor rating display to show detailed ratings.
 * @param {Event} e - The click event.
 */
function handleProfessorRatingsClick(e) {
  console.log({ e });
  console.log("clicked");
}

/**********************************************************************/
/*                            END UTILS                               */
/**********************************************************************/

const style = document.createElement("style");
style.textContent = `
  .gpa-spinner {
    display:inline-block;
    width:.65em;
    height:.65em;
    border:.15em solid currentColor;
    border-right-color:transparent;
    border-radius:50%;
    animation:gpa-spin .6s linear infinite;
    vertical-align:middle;
  }
  @keyframes gpa-spin { to { transform:rotate(360deg); } }
`;
document.head.appendChild(style);

const state = {};

/**
 * Inserts enriched rating data for an instructor into the DOM.
 * @param {string} className - The course identifier.
 * @param {string} instructor - The instructor's name.
 * @param {HTMLElement} element - The container to insert rating data into.
 */
async function enrichInstructorData(className, instructor, element) {
  if (instructor === "Instructor: TBA") {
    return;
  }
  const placeholder = document.createElement("span");
  placeholder.innerHTML = `(Rating: <b><span class="gpa-spinner"></span></b>)`;
  element.appendChild(placeholder);

  const ratings = await fetchProfessorRating(instructor);
  const gpaSpan = document.createElement("span");
  gpaSpan.style.cursor = "pointer";
  gpaSpan.style.textDecoration = "underline";
  gpaSpan.onmouseenter = () => applyStyles(gpaSpan, { color: "blue" });
  gpaSpan.onmouseleave = () => applyStyles(gpaSpan, { color: "black" });
  gpaSpan.onclick = handleProfessorRatingsClick;
  gpaSpan.innerHTML = `(Rating: <b>${ratings}/5.0</b>)`;

  placeholder.replaceWith(gpaSpan);
}

/**
 * Enriches all section rows with instructor rating data.
 * @param {Object} data - The parsed section data.
 * @param {string} data.className - The course identifier.
 * @param {string[]} data.instructors - List of instructor names.
 * @param {HTMLElement[]} data.instructorElements - Corresponding DOM elements for instructors.
 * @param {HTMLElement[]} data.iconElements - Corresponding icon container elements.
 */
async function enrichSectionData({ className, instructors, instructorElements, iconElements }) {
  await Promise.all(
    instructors.map((instructor, idx) =>
      enrichInstructorData(className, instructor, instructorElements[idx])
    )
  );
}

/**
 * Extracts section row elements from mutation records.
 * @param {MutationRecord[]} mutations - List of mutation observations.
 * @returns {HTMLElement[]} An array of row elements.
 */
function extractSectionRows(mutations) {
  const result = [];
  for (const { addedNodes } of mutations) {
    addedNodes.forEach(node => {
      if (node instanceof Element && node.matches(".sections-container")) {
        const rows = node.querySelectorAll(".section-info-container .row");
        rows.forEach(r => result.push(r));
      }
    });
  }
  return result;
}

/**
 * Parses HTML rows into structured data for enrichment.
 * @param {HTMLElement[]} rows - The section row elements.
 * @returns {Object} Parsed data including className, instructors, instructorElements, and iconElements.
 */
function parseSectionRows(rows) {
  let classElm = rows[0];
  while (classElm && !classElm.matches(".course")) {
    classElm = classElm.parentElement;
  }
  const courseId = classElm.id;

  const instructors = [];
  const instructorElements = [];
  const iconElements = [];

  rows.forEach(element => {
    const names = Array.from(element.querySelectorAll(".section-instructor"))
      .map(e => e.innerText);
    instructors.push(...names);
    instructorElements.push(element.querySelector(".section-instructors"));
    iconElements.push(element.querySelector(":scope > div:last-child"));
  });

  return { className: courseId, instructors, instructorElements, iconElements };
}

/**
 * Inserts enriched GPA data for a course title into the DOM.
 * @param {HTMLElement} courseElement - The course container element.
 * @param {string} courseName - The course identifier.
 */
async function enrichCourseTitle(courseElement, courseName) {
  const courseTitleEl = courseElement.querySelector(".course-title");
  const placeholder = document.createElement("span");
  placeholder.innerHTML = `(Avg GPA: <b><span class="gpa-spinner"></span></b>)`;
  courseTitleEl.parentElement.appendChild(placeholder);

  const averageGpa = await fetchCourseGPA(courseName);
  const gpaSpan = document.createElement("span");
  gpaSpan.style.cursor = "pointer";
  gpaSpan.style.textDecoration = "underline";
  gpaSpan.onmouseenter = () => applyStyles(gpaSpan, { color: "blue" });
  gpaSpan.onmouseleave = () => applyStyles(gpaSpan, { color: "black" });
  gpaSpan.onclick = handleGPAGraphClick;
  gpaSpan.innerHTML = `(Avg GPA: <b>${averageGpa}</b>)`;

  placeholder.replaceWith(gpaSpan);
}

/**
 * Initializes mutation observers and enriches course data on page load.
 */
async function initializeObservers() {
  const observer = new MutationObserver(mutations => {
    const sectionRows = extractSectionRows(mutations);
    if (sectionRows.length === 0) {
      return;
    }
    try {
      const data = parseSectionRows(sectionRows);
      enrichSectionData(data);
    } catch (err) {
      console.error("Error processing section rows:", err);
    }
  });

  const baseDOMElement = document.querySelector(".course-prefix-container");
  if (baseDOMElement) {
    observer.observe(baseDOMElement, {
      childList: true,
      subtree: true
    });
  }

  const courseDivs = Array.from(document.querySelectorAll(".course"));
  const courses = courseDivs.map(el => el.id);
  courses.forEach(course => {
    if (!(course in state)) {
      state[course] = {};
    }
  });

  await Promise.all(
    courseDivs.map((courseElement, idx) =>
      enrichCourseTitle(courseElement, courses[idx])
    )
  );
}

window.addEventListener("load", initializeObservers);
