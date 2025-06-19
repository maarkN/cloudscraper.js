const Scraper = require("./built/cloudscraper-js.js").default;
const fs = require("fs");
const scraper = new Scraper({
  usePython3: true,
  timeout: 10,
});
const id =
  "eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiIyNDU4NDQ5OCIsIm5iZiI6MTc1MDIzMTkzMCwiZXhwIjoxNzUwMjMyMjMwfQ.zMWOeWYXs0YZXHxH2OwFIcbWDe4vFFfk1NV1ezemY2sdPUXNeEm0XS5NcJ27Gt-ybDwFzmYhVtHCtDN2DLgFIw";
scraper
  .request({
    url: `https://consultas.anvisa.gov.br/api/consulta/bulario?column=&count=10&filter%5BcategoriasRegulatorias%5D=11,1,2,3,4,12,5,6,10,7,8&order=asc&page=1?Authorization=`,
    options: {
      method: "GET",
      timeout: 10,
      headers: {
        Authorization: "Guest",
      },
    },
  })
  .then((response) => {
    console.log(`Status: ${response.status}`);
    const buffer = response.buffer();
    console.log("Buffer length:", buffer.length);
    console.log(response.error);
    fs.writeFileSync("bula.pdf", buffer);
    console.log("Arquivo bula.pdf salvo!");
  })
  .catch((error) => {
    console.error(error);
  });
