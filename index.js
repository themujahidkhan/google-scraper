const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const { scrapeGoogle } = require("./scraper");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/scrape", async (req, res) => {
	const {
		keyword,
		pageNumber,
		locationCode,
		language,
		proxyIp,
		proxyPort,
		proxyUsername,
		proxyPassword,
	} = req.query;

	if (!keyword || !pageNumber) {
		return res
			.status(400)
			.json({ error: "Keyword and page number are required" });
	}

	try {
		const results = await scrapeGoogle(
			keyword,
			parseInt(pageNumber),
			locationCode,
			language,
			proxyIp || null,
			proxyPort || null,
			proxyUsername || null,
			proxyPassword || null,
		);

		// Print results in the terminal
		console.log(JSON.stringify(results, null, 2));
		res.json(results);
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ error: "An error occurred while scraping" });
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
