const Scraper = require("./built/cloudscraper-js.js").default;
const scraper = new Scraper({
  usePython3: true,
  timeout: 30,
});

scraper
  .request({
    url: "https://consultas.anvisa.gov.br/api/tipoCategoriaRegulatoria",
    options: {
      method: "GET",
      headers: {
        Authorization: "Guest",
      },
    },
  })
  .then((data) => {
    console.log(data);
    console.log(data.text());
  })
  .catch((error) => {
    console.error(error);
  });
