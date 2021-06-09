const KoboCrawler = require("./kobo_crawler");

exports.handler = async function(event, context) {
    KoboCrawler.fetchBooks();
};