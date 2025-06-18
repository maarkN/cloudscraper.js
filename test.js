const Scraper = require("./built/cloudscraper-js.js").default;
const fs = require("fs");
const scraper = new Scraper({
  usePython3: true,
  timeout: 30,
});
const id =
  "eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIyNDU4NDQ5OCIsIm5iZiI6MTc1MDIzMTkzMCwiZXhwIjoxNzUwMjMyMjMwfQ.zMWOeWYXs0YZXHxH2OwFIcbWDe4vFFfk1NV1ezemY2sdPUXNeEm0XS5NcJ27Gt-ybDwFzmYhVtHCtDN2DLgFIw";
scraper
  .request({
    url: `https://consultas.anvisa.gov.br/api/consulta/medicamentos/arquivo/bula/parecer/${id}/?Authorization=`,
    options: {
      method: "GET",
      buffer: true,
      headers: {
        Authorization: "Guest",
      },
    },
  })
  .then((response) => {
    console.log(`Status: ${response.status}`);
    const buffer = response.buffer();
    console.log("Buffer length:", buffer.length);
    fs.writeFileSync("bula.pdf", buffer);
    console.log("Arquivo bula.pdf salvo!");
  })
  .catch((error) => {
    console.error(error);
  });
