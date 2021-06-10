const { google } = require('googleapis');

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
    let timeMin = minDate.startOf('day').toISOString();
    let timeMax = maxDate.endOf('day').toISOString();
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
        start: {date: book.date.format('YYYY-MM-DD'), timeZone: 'Asia/Taipei'},
        end: {
            date: book.date.add(1, 'day').format('YYYY-MM-DD'),
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