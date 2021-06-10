const KoboCrawler = require("./kobo_crawler");
const GCal = require("./gcal");
const dayjs = require('dayjs');

exports.handler = async function(event, context) {
    let books = await KoboCrawler.fetchBooks();
    if (! books.length) {
        console.log('no books');
        return;
    }

    let dates = books.map(book => book.date).sort((a, b) => {
        return b.unix() - a.unix();
    });
    let events = await GCal.listEvents(dates.shift(), dates.pop());

    for (let book of books) {
        if (GCal.eventByBookId(events, book.id)) continue;
        await GCal.createBookEvent(book);
    }

    return 'done';
};