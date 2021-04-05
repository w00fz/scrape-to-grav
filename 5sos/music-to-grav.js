const fs = require('fs');
const https = require('https');
const YAML = require('yaml');
const args = process.argv.slice(2);


if (args.length !== 2) {
    console.log(`Usage: ${process.argv[1]} <input.json> <grav/pages/destination>`);
    return false;
}

const input = args[0];
const dest = args[1];
let data = null;

if (!fs.existsSync(input)) {
    console.error(`Input JSON file '${input}' does not exist`);
    return;
}

try {
    const content = fs.readFileSync(input);
    data = JSON.parse(content);
} catch (error) {
    console.error(error);
}


if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
}

const download = (uri, filename, callback = () => {}) => {
    const file = fs.createWriteStream(filename);
    const request = https.get(uri, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
        }
    }, function(response) {
        response.pipe(file);
        callback();
    });
};


data.forEach(album => {
    const date = new Date(album.releaseDate).toLocaleString('en-US', { dateStyle: 'short' });
    const slug = album.slug.replace('/', '');

    fs.mkdirSync(`${dest}/${slug}`, { recursive: true });
    
    // crawl prevention from universal music
    // const image = download(album.image, `${dest}/${slug}/cover.jpg`);
    const links = YAML.stringify({ links: album.links });

    const frontmatter = `---
title: '${album.title}'
date: ${date}
${links}
---
`;

    fs.writeFileSync(`${dest}/${slug}/music-details.md`, frontmatter);
});