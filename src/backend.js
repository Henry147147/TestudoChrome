/**********************************************************************/
/*                                CHART                               */
/**********************************************************************/

/**
 * Stacked grade-distribution bar chart with axes + Y-axis ticks.
 * @param {Object.<string,number>} data   – e.g. { "A+": 3, A: 10, "A-": 5, ... }
 * @param {HTMLElement} parent           – container that will receive the chart
 */
function createBarChart(data, parent, professorName) {
  /* ---------- reshape data ---------- */
  const groups = {};
  for (const [grade, n] of Object.entries(data)) {
    if (grade === "gpa") {
      continue;
    }
    const letter = grade[0].toUpperCase();
    const sign = grade[1] || "";
    if (!groups[letter]) groups[letter] = { total: 0, parts: {} };
    groups[letter].total += n;
    groups[letter].parts[sign] = (groups[letter].parts[sign] || 0) + n;
  }
  const maxTotal = Math.max(...Object.values(groups).map(g => g.total));
  const baseHue = { A: 220, B: 150, C: 35, D: 285, F: 0 };

  /* ---------- outer frame ---------- */
  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "relative",
    padding: "36px 48px 48px 60px", // space for ticks & labels
    width: "100%",
    boxSizing: "border-box",
  });

  /* ---------- chart body ---------- */
  const chart = document.createElement("div");
  Object.assign(chart.style, {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    height: "240px",
  });

  /* ---------- stacked bars ---------- */
  const variants = [["-", 0.5], ["", 1], ["+", 1.5]];
  for (const letter of Object.keys(groups).sort()) {
    const { total, parts } = groups[letter];

    const bar = document.createElement("div");
    Object.assign(bar.style, {
      flex: "1",
      display: "flex",
      flexDirection: "column-reverse",
      height: `${(total / maxTotal) * 100}%`,
      position: "relative",
    });

    for (const [sign, lightMul] of variants) {
      const count = parts[sign] || 0;
      if (!count) continue;

      const seg = document.createElement("div");
      seg.style.cssText = `
        height:${(count / total) * 100}%;
        background:hsl(${baseHue[letter] ?? 200} 65% ${50 * lightMul}%);
        position:relative;
      `;

      const tip = document.createElement("div");
      tip.textContent = `${letter}${sign || ""}: ${count}`;
      tip.style.cssText = `
        position:absolute; bottom:calc(100% + 4px); left:50%;
        transform:translateX(-50%);
        font-size:.75rem; background:#222; color:#fff;
        padding:2px 6px; border-radius:4px;
        white-space:nowrap; pointer-events:none;
        opacity:0; transition:opacity .2s;
        z-index: 100;
      `;
      seg.onmouseenter = () => (tip.style.opacity = "1");
      seg.onmouseleave = () => (tip.style.opacity = "0");
      seg.appendChild(tip);
      bar.appendChild(seg);
    }

    const lbl = document.createElement("span");
    lbl.textContent = letter;
    lbl.style.cssText = `
      position:absolute; bottom:-1.4em; left:50%;
      transform:translateX(-50%);
      font-size:.8rem; user-select:none;
    `;
    bar.appendChild(lbl);
    chart.appendChild(bar);
  }

  /* ---------- axis lines ---------- */
  const axisY = document.createElement("div");
  axisY.style.cssText = `
    position:absolute; top:32px; bottom:48px; left:48px;
    width:2px; background:#333;
  `;
  const axisX = document.createElement("div");
  axisX.style.cssText = `
    position:absolute; left:60px; right:32px; bottom:32px;
    height:2px; background:#333;
  `;

  /* ---------- axis labels ---------- */
  let xTitle;
  let reviewDiv;
  if (professorName) {
    xTitle = document.createElement("span");
    xTitle.textContent = "Professor Reviews:";
    xTitle.style.cssText = `
      position:absolute; bottom:0; left:50%;
      transform:translate(-50%, 50%);
      font-size:.8rem; font-weight:600; white-space:nowrap;
      user-select:none;
    `;

    reviewDiv = document.createElement("div")
    reviewDiv.className = "professor-review-container"
    applyStyles(reviewDiv, {
      display: "flex", 
      justifyContent: "center",
      marginTop: "20px"
    })
    const spinner = document.createElement("span")
    spinner.className = "gpa-spinner"
    reviewDiv.appendChild(spinner)
  }


  /* ---------- Y-axis tick marks & labels ---------- */
  const tickSteps = [0, 25, 50, 75];      // %
  tickSteps.forEach(pct => {
    const tick = document.createElement("div");
    tick.style.cssText = `
      position:absolute; left:46px;
      width:6px; height:2px; background:#333;
      bottom:calc(${pct}% + 32px);
      transform:translateY(50%);
    `;
    const lbl = document.createElement("span");
    lbl.textContent = `${pct}%`;
    lbl.style.cssText = `
      position:absolute; left:0; bottom:calc(${pct}% + 32px);
      transform:translateX(-8px) translateY(50%);
      font-size:.7rem; text-align:right; width:40px;
      user-select:none;
    `;
    frame.append(tick, lbl);
  });  

  /* ---------- assemble ---------- */
  if (professorName) {
    frame.append(axisY, axisX, xTitle, chart);
    parent.appendChild(frame);
    parent.parentElement.appendChild(reviewDiv);
    fetch(`${HOST}/professor/${professorName}/reviews`)
    .then(res => res.json())
    .then(data => console.log({data}))
  } else {
    frame.append(axisY, axisX, chart);
    parent.appendChild(frame);
  }

}




/**********************************************************************/
/*                                UTILS                               */
/**********************************************************************/
const HOST = "https://henry1477.asuscomm.com:8000";

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

function togglePopup(trigger, content) {
  // Same trigger → toggle off
  if (activePopup && activePopup.trigger === trigger) {
    closeActivePopup();
    return false;
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
    width: "20rem",
    fontSize: "13px"
  });

  // Position next to trigger
  const rect = trigger.getBoundingClientRect();
  const doc = document.documentElement;
  popup.style.top = `${rect.bottom + doc.scrollTop + 4}px`;
  popup.style.left = `${rect.left + doc.scrollLeft}px`;

  document.body.appendChild(popup);
  activePopup = { popup, trigger };
  return true;
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
  const opened = togglePopup(targetSpan, `<b class="popup-graph-title">${courseName}</b><br/><div id="chart-area"></div>`);
  if (opened) {
    fetch(`${HOST}/class/${courseName}/grades`)
      .then(response => response.json())
      .then(data => {
        let total = 0
        for (const key in data) {
          if (key !== "gpa") {
            total += data[key]
          }
        }
        document.querySelector(".popup-graph-title").innerText += `: Total Grades: ${total}`
        createBarChart(data, document.getElementById("chart-area"));
      })
  }
}

/**
 * Handles click events on the professor rating display to show detailed ratings.
 */
function handleProfessorRatingsClick(e) {
  const targetSpan = walkBackUntil(e.target, el => el.matches(".professor-ratings-span"));
  if (!targetSpan) return;
  console.log({ targetSpan })
  const profName = targetSpan.parentElement.querySelector(".section-instructor").innerText;
  const courseName = targetSpan.closest(".course").id;
  console.warn({ profName, courseName })
  const opened = togglePopup(targetSpan, `<b class="popup-graph-title">${profName}</b><br/><div id="chart-area"></div>`);
  if (opened) {
    console.log(`${HOST}/professor/${profName}/grades`)
    fetch(`${HOST}/professor/${profName}/grades`)
      .then(response => response.json())
      .then(data => {
        console.log({ data })
        let total = 0
        for (const key in data) {
          if (key !== "gpa") {
            total += data[key]
          }
        }
        document.querySelector(".popup-graph-title").innerHTML += `<br\>Total Grades: ${total} &nbsp; GPA: ${data["gpa"].toFixed(2)}`
        createBarChart(data, document.getElementById("chart-area"), profName);
      })
  }

}

/**********************************************************************/
/*                            END UTILS                               */
/**********************************************************************/

const style = document.createElement("style");
style.textContent = `
  .gpa-spinner{display:inline-block;width:.65em;height:.65em;border:.15em solid currentColor;border-right-color:transparent;border-radius:50%;animation:gpa-spin .6s linear infinite;vertical-align:middle}
  @keyframes gpa-spin{to{transform:rotate(360deg)}}
  .enrichment-popup{animation:fade-in .14s ease-out}
  @keyframes fade-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1}}`;
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