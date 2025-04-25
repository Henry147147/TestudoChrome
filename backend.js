const state = {};

function onLoad() {
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

function enrichCourseName(courseElement, courseName) {

}


function getHTMLDataFromRows(rows) {
  let className = rows[0]
  let instructors = []
  let instructorElement = []
  let iconElements = []
  while (className && !(className.matches(".course"))) {
    className = className.parentElement;
  }
  className = className.id;

  rows.forEach(element => {
    instructors.push(...Array.from(element.querySelectorAll(".section-instructor")).map(e => e.innerText))
    instructorElement.push(element.querySelector(".section-instructors"))
    instructorElement.push(element.querySelector(".section-instructors"))
    iconElements.push(element.querySelector(":scope > div:last-child"))
  })
  return {className, instructors, instructorElement, iconElements} 
}

