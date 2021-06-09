const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const md5 = require('md5');

const fetchArticles = async function () {
    let host = 'https://tw.news.kobo.com';
    let url = host + '/%E5%B0%88%E9%A1%8C%E4%BC%81%E5%8A%83/%E5%A5%BD%E8%AE%80%E6%9B%B8%E5%96%AE';
    // let {data: html} = await axios.get(url);

    let html = fs.readFileSync(__dirname + '/list.html', {encoding: 'utf8'});
    // console.log(html);

    const $ = cheerio.load(html);
    return $('.blog-item:has(.blog-item-text-title:contains("一週99"))').map((i, el) => {
        return {
            link: host + $(el).find('a.blog-item-container').attr('href'),
            title: $(el).find('.blog-item-text-title').text().trim(),
        }
    }).toArray();
}

const findBooksInArticle = async function (url) {
    // let {data: html} = await axios.get(url);
    let html = fs.readFileSync(__dirname + '/article.html', {encoding: 'utf8'});
    const $ = cheerio.load(html);
    const books = [];

    $('.article-body p:contains("選書")').map((i, el) => {
        let date = parseDate($(el).find('span').text());
        if (!date) return;

        let $link = $(el).find('a:first');
        let bookLink = $link.attr('href');
        if (!bookLink) return;

        let id = md5(bookLink);
        if (books.find(book => book.id === id)) return;

        books.push({
            id: id,
            date: date.toISOString(),
            title: stripBrackets($link.text()),
            description: formatsDescription($, bookLink, url),
        });
    });

    return books;
};

const fetchBooks = async function () {
    let articles = await fetchArticles();
    let url = articles.length ? articles[0].link : null;
    if (!url) return [];

    // console.log(articles);
    let books = findBooksInArticle(url);
    console.log(books);
};

module.exports = {
    fetchBooks
};

function parseDate (text) {
    let date = dayjs(text.split(/\s/)[0], 'M/D');
    if (!date.isValid()) {
        return null;
    }
    return date.year(dayjs().year());
}

function stripBrackets(text, prefix="《", suffix="》") {
    if (text.startsWith(prefix)) {
        text = text.substr(prefix.length);
    }
    if (text.endsWith(suffix)) {
        text = text.substr(0, text.length - suffix.length);
    }
    return text;
}

function formatsDescription($, bookLink, blogUrl) {
    const descs = [];

    // cover
    let $img = $(`a[href="${bookLink}"] > img`);
    $img && descs.push($.html($img));

    // box
    $(`div.simplebox-content:has(a[href="${bookLink}"]) p`).map((i, p) => {
        let desc = $(p).contents().filter((i, el) => el.nodeType === 3).text();
        $(p).contents().map((i, child) => {
            let $child = $(child);
            switch ($child.prop('tagName')) {
                case 'A': desc += `<a href="${ $child.attr('href') }">${ $child.text() }</a>`; break;
                default: desc += $child.text(); break;
            }
        });
        descs.push('<div>' + desc + '</div>');
    });

    descs.push(`<div>來源<a href="${blogUrl}">${blogUrl}</a></div>`);

    return descs.join('');
}