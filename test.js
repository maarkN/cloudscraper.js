const Scraper = require("./built/cloudscraper-js.js").default;
const fs = require("fs");
const scraper = new Scraper({
  usePython3: true,
  timeout: 30,
});
const id =
  "eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIxNTg3NDA1OSIsIm5iZiI6MTc1MDMxMDIzMCwiZXhwIjoxNzUwMzEwNTMwfQ.BHQAQQC73XZ8EN74sKMI1y9EJ63A0aDrgixn3fbBsuw7mleS9HFHufPaP_4hkHmVFrKNrF2xj7mS3wwHf2FAKg";
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
