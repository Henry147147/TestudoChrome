window.addEventListener("load", () => {
    const courseDivs = Array.from(document.querySelectorAll(".course"));
    const courses = courseDivs.map(element => element.id);
    console.log(`Found ${courses.length} course(s)`);
    console.log({courses, courseDivs})
    // need to fetch for each instructor
});



// content-script.js
(function() {
  // keep a reference to the original fetch
  const originalFetch = window.fetch.bind(window);

  // your handler
  function handleCourseResponse(data, url) {
    // data is the parsed JSON (or text) from the response
    console.log("Got course data for", url, data);
    // …call your real function here…
  }

  // override fetch
  window.fetch = async function(input, init) {
    // figure out the URL string
    const url = typeof input === "string" ? input : input.url;

    // do the real fetch
    const response = await originalFetch(input, init);

    // if it’s the endpoint you care about…
    if (url.includes("sections?")) {
      // clone the response so we don’t consume the stream twice
      const clone = response.clone();

      // try JSON, fallback to text
      clone.json()
        .then(data => handleCourseResponse(data, url))
        .catch(() =>
          clone.text().then(txt => handleCourseResponse(txt, url))
        );
    }

    // return the original response so the page’s JS sees it
    return response;
  };
})();
