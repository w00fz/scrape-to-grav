const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');

const selectorForLoadMoreButton = '.pager-next a';
const url = 'https://www.5sos.com/music';

const isElementVisible = async (page, cssSelector) => {
    let visible = true;
    await page
        .waitForSelector(cssSelector, { visible: true, timeout: 2000 })
        .catch(() => {
            visible = false;
        });
    return visible;
};

const albums = [];
const getMusicData = async (page, slug) => {
    const content = await page.content();
    const $ = cheerio.load(content);

    slug = slug.replace(/^\/music\//, '');

    const releaseDate = $('.date-display-single').attr('content');
    const title = $('.field--name-title h2').text().trim();
    const image = $('.l-article-main img').attr('src');

    const links = [];
    
    $('.entity-paragraphs-item').each((index, item) => {
        item = $(item);
        item.removeClass('entity entity-paragraphs-item ds-1col view-mode-full clearfix');
        const key = item.attr('class').replace('paragraphs-item-', '');
        const url = item.find('a').attr('href');
        const label = item.find('a').text().trim();

        links.push({ key, label, url });
    });

    return { title, slug, releaseDate, image, links };
}

const getData = async (page, browser) => {
    const content = await page.content();
    const $ = cheerio.load(content);

    $('.l-front').each((index, element) => {
        try {
            const title = $(element).find('.ds-region--overlay .field__item h5').text().trim();
            const href = $(element).find('.ds-region--background .field__item a').attr('href');
            
            console.log(`Scraping Music Album '${title} (${href})'`);
            
            addAlbum(href, browser);
        } catch (error) {
            console.error(error);
        }
    });
}

const addAlbum = async (href, browser) => {
    const subPage = await browser.newPage();
    await subPage.goto(`https://www.5sos.com/${href}`);
    const musicData = await getMusicData(subPage, href);
    
    albums.push(musicData);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const musicData = await getMusicData(page, '/calm-0');
    albums.push(musicData);

    let loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);
    while (loadMoreVisible) {
        await getData(page, browser);

        const next = await page.$eval(selectorForLoadMoreButton, element => element.href);
        await page.goto(next);

        loadMoreVisible = await isElementVisible(page, selectorForLoadMoreButton);
    }

    await getData(page, browser);
    
    setTimeout(async () => {
        await browser.close();

        let data = JSON.stringify(albums);
        fs.writeFileSync('scraped-music.json', data);
        console.log(albums);
        console.log('');
        console.log('Data stored in `scraped-music.json`');
    }, 10000);
})();

