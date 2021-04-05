const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const url = 'https://www.reddit.com/r/news/';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();

    const $ = cheerio.load(content);

    // reddit logic to gather news headlines
    const newsHeadlines = [];

    $('a[href*="/r/news/comments"] h3').each((index, element) => {
        const title = $(element).text();
        newsHeadlines.push({ title });
    });

    console.log(newsHeadlines);
    // end reddit logic

    await browser.close();
})();