const state = {};

// todo make this a setting... 
//document.getElementById("ocelot_ai").remove()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function onLoad() {
  const courseDivs = Array.from(document.querySelectorAll(".course"));
  const courses = courseDivs.map(element => element.id);
  courses.forEach(course => {
    if (!(course in state)) {
        state[course] = {}
    }
  });

  for (const i in courseDivs) {
    const courseElement = courseDivs[i];
    const courseName = courses[i];
    enrichCourseName(courseElement, courseName);
  }




  const observer = new MutationObserver(mutations => {
    const sectionRows = getSectionData(mutations);
    const data = getHTMLDataFromRows(sectionRows);
    console.log({data})
  });

  observer.observe(document.querySelector(".course-prefix-container"), {
    childList: true,
    subtree: true
  });
}

window.addEventListener("load", onLoad);

function getSectionData(mutations) {
  const result = []
  for (let { addedNodes } of mutations) {
    addedNodes.forEach(node => {
      if ((node instanceof Element) && node.matches(".sections-container")) {
        const sectionInfo = Array.from(node.querySelectorAll(".section-info-container .row"));
        if (sectionInfo) {
          sectionInfo.forEach(element => result.push(element));
        }
      }
    });
  }
  return result;
}

function showGPAGraph(e, ...a) {
  console.warn({e, a})
  console.warn("clicked")
}

function setElementStyle(element, style) {
  for (const key in style) {
    element.style[key] = style[key];
  }
}

async function enrichCourseName(courseElement, courseName) {
  const courseNameElement = courseElement.querySelector(".course-title")
  const averageGpa = await getCourseAverageGPA(courseName)
  
  const gpa_element = document.createElement("span");
  gpa_element.style.cursor = "pointer"
  gpa_element.style.textDecoration = "underline"
  gpa_element.onmouseenter = () => setElementStyle(gpa_element, {color: "blue"})
  gpa_element.onmouseleave = () => setElementStyle(gpa_element, {color: "black"})
  gpa_element.onclick = showGPAGraph
  gpa_element.innerHTML = `(Avg: <bold>${averageGpa}</bold>)`

  courseNameElement.parentElement.appendChild(gpa_element)
  console.log({courseNameElement, courseName})
}

async function getCourseAverageGPA(courseName) {
  // TODO implement
  await sleep(2000)
  return 3.1
}


function getHTMLDataFromRows(rows) {
  let className = rows[0]
  let instructors = []
  let instructorElement = []
  let iconElements = []
  while (className && !(className.matches(".course"))) {
    className = className.parentElement;
  }
  return
  className = className.id;

  rows.forEach(element => {
    instructors.push(...Array.from(element.querySelectorAll(".section-instructor")).map(e => e.innerText))
    instructorElement.push(element.querySelector(".section-instructors"))
    instructorElement.push(element.querySelector(".section-instructors"))
    iconElements.push(element.querySelector(":scope > div:last-child"))
  })
  return {className, instructors, instructorElement, iconElements} 
}

