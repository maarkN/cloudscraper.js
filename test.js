const CloudScraper = require("./built/cloudscraper-js.js").default;

const cloudscraper = new CloudScraper({
  timeout: 10,
});

cloudscraper.install().then(() => {
  console.log("CloudScraper installed!!");
  cloudscraper
    .get(`https://9anime.gs`)
    .then((response) => {
      console.log(`Status: ${response.status}`);
      console.log(response.text());
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
