window.addEventListener("load", () => {
    const courses = document.querySelectorAll(".course");
    console.log(`Found ${courses.length} course(s)`);
  
    // This will hold one sub-array per course, each of which is a list of
    // the instructor names for that course.
    const instructorsByCourse = [];
  
    courses.forEach(course => {
      // Grab every <span class="section-instructor"> inside this .course
      const instSpans = course.querySelectorAll(".section-instructor");
  
      // Turn NodeList → Array of trimmed text content
      const names = Array.from(instSpans)
                        .map(span => span.textContent.trim());
  
      console.log(`Course ${course.id || "(no id)"} instructors:`, names);
  
      instructorsByCourse.push(names);
    });
  
    // Final result: array of arrays of names
    console.log("All instructors grouped by course:", instructorsByCourse);
  });
  