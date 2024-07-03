const { chromium } = require("playwright");
const cheerio = require("cheerio");

async function scrapeGoogle(
	keyword,
	pageNumber,
	locationCode = "US",
	language = "en",
	proxyIp,
	proxyPort,
	proxyUsername,
	proxyPassword,
) {
	const browser = await chromium.launch({
		headless: true,
		ignoreHTTPSErrors: true, // Ignore SSL certificate errors
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			proxyIp && proxyPort ? `--proxy-server=${proxyIp}:${proxyPort}` : "",
		].filter(Boolean),
	});

	const context = await browser.newContext({
		userAgent:
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
		ignoreHTTPSErrors: true,
	});

	if (proxyUsername && proxyPassword) {
		await context.setHTTPCredentials({
			username: proxyUsername,
			password: proxyPassword,
		});
	}

	const page = await context.newPage();

	await page.route("**/*", (route) => {
		if (route.request().resourceType() === "document") {
			route.continue();
		} else {
			route.abort();
		}
	});
	const startIndex = (pageNumber - 1) * 10;
	const encodedKeyword = encodeURIComponent(keyword);
	const searchUrl = `https://www.google.com/search?q=${encodedKeyword}&start=${startIndex}&hl=${language}&gl=${locationCode}&num=100`;

	await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 60000 });

	const content = await page.content();
	const $ = cheerio.load(content);

	const results = {
		searchQuery: {
			term: keyword,
			url: searchUrl,
			device: "DESKTOP",
			page: pageNumber,
			type: "SEARCH",
			domain: "google.com",
			countryCode: locationCode,
			languageCode: language,
			locationUule: null,
			resultsPerPage: "100",
		},
		url: searchUrl,
		hasNextPage: $(".pnnext").length > 0,
		serpProviderCode: "N",
		resultsTotal:
			$(".result-stats")
				.text()
				.match(/[\d,]+/)?.[0]
				.replace(/,/g, "") || "Unknown",
		relatedQueries: [],
		paidResults: [],
		paidProducts: [],
		organicResults: [],
		peopleAlsoAsk: [],
		customData: {
			pageTitle: $("title").text(),
		},
	};

	// Extract related queries
	$(".brs_col")
		.find("p")
		.each((index, element) => {
			const $element = $(element);
			const title = $element.find("a").text();
			const url = $element.find("a").attr("href");
			if (title && url) {
				results.relatedQueries.push({ title, url });
			}
		});

	// Extract organic results
	$(".g").each((index, element) => {
		const $element = $(element);
		const title = $element.find("h3").text();
		const url = $element.find("a").attr("href");
		const displayedUrl = $element.find(".iUh30").text();
		const description =
			$element.find(".VwiC3b").text() || $element.find(".s").text();

		if (title && url) {
			results.organicResults.push({
				title,
				url,
				displayedUrl,
				description,
				emphasizedKeywords: [], // Add emphasized keywords logic if needed
				siteLinks: [], // Add site links logic if needed
				productInfo: {},
				type: "organic",
				position: index + 1,
			});
		}
	});

	// Extract "People also ask" questions
	$(".related-question-pair").each((index, element) => {
		const $element = $(element);
		const question = $element.find(".q-title").text();
		const answer = $element.find(".related-question-pair-answer").text();
		const url = $element.find("a").attr("href");
		const title = $element.find(".r").text();
		const date = $element.find(".date").text(); // Adjust date logic as needed
		results.peopleAlsoAsk.push({ question, answer, url, title, date });
	});

	// Extract paid results
	$(".ads-ad").each((index, element) => {
		const $element = $(element);
		const title = $element.find("h3").text();
		const url = $element.find("a").attr("href");
		const displayedUrl = $element.find(".ads-visurl cite").text();
		const description = $element.find(".ads-creative").text();
		const emphasizedKeywords = []; // Add emphasized keywords logic if needed
		const siteLinks = []; // Add site links logic if needed
		const adPosition = index + 1;

		if (title && url) {
			results.paidResults.push({
				title,
				url,
				displayedUrl,
				description,
				emphasizedKeywords,
				siteLinks,
				type: "paid",
				adPosition,
			});
		}
	});

	await browser.close();
	return results;
}

module.exports = { scrapeGoogle };
