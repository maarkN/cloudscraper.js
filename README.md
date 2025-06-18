# NOTICE

This package is deprecated and not developed anymore. This is meant only for bare-minimum tests and bypassing CloudFlare.

# CloudScraper.js

Python based CloudFlare bypass. Utilizes [VeNoMouS&#39;s CloudScraper](https://github.com/VeNoMouS/cloudscraper) project to bypass CloudFlare. All credit goes to him. This is a copy of `cfbypass`

## Installation

**_THIS NEEDS TO BE UPDATED_**
Prerequisites: Python (version 3.10 or higher) and NodeJS (comes with NPM).

Installation is simple. Just run `pip install cloudscraper` or `pip3 install cloudscraper`.
Then, run `npm i cloudscraper.js`. Here is an example for using this package in your own project:

```javascript
// ES6
import Scraper from "cloudscraper.js";

// CommonJS
const Scraper = require("cloudscraper.js").default;

const scraper = new Scraper(true); // Set to true if using python3, leave empty if using python
scraper
  .request({
    url: "https://9anime.gs",
    options: {
      method: "GET",
    },
  })
  .then((data) => {
    console.log(data.text());
  })
  .catch((err) => {
    console.error(err);
  });
```

If you encounter issues installing the Python package, try running `python3 -m pip uninstall cloudscraper` and then `python3 -m pip install cloudscraper`.
