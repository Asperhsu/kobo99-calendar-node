const { google } = require('googleapis');
const dayjs = require('dayjs');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const SERVICE_ACCOUNT_FILE = __dirname + '/credentials.json';
const CALENDAR_ID = 'rcmvnfej75s7c9sjdbic1f55v8@group.calendar.google.com';

const getCalendarService = function () {
    let auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_FILE,
        scopes: SCOPES,
    });
    return google.calendar({version: 'v3', auth});
}

const listEvents = async function (minDate, maxDate) {
    let service = getCalendarService();
    let timeMin = dayjs(minDate, 'YYYY-MM-DD').startOf('day').toISOString();
    let timeMax = dayjs(maxDate, 'YYYY-MM-DD').endOf('day').toISOString();
    console.log(`list events from ${timeMin} to ${timeMax}`);

    const res = await service.events.list({
        calendarId: CALENDAR_ID,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return res.data.items || [];
}

const eventByBookId = function (events, bookId) {
    return events.find(event => {
        let id = event.extendedProperties && event.extendedProperties.shared && event.extendedProperties.shared.id;
        return id == bookId;
    });
};

const createBookEvent = async function (book) {
    let service = getCalendarService();

    const resource = {
        summary: book.title,
        description: book.description,
        start: {date: book.date, timeZone: 'Asia/Taipei'},
        end: {
            date: dayjs(book.date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD'),
            timeZone: 'Asia/Taipei'
        },
        extendedProperties: {
            shared: {
                id: book.id
            }
        }
    };

    const event = await service.events.insert({
        calendarId: CALENDAR_ID,
        resource: resource,
    });
    console.log('Event created: %s', event.data.summary);
}

module.exports = {
    listEvents,
    eventByBookId,
    createBookEvent,
};