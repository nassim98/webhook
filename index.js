const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({'message': 'Server is running'});
});

/**
 *  [POST] /aircall/calls
 *  Creates a public endpoint for Aircall Webhooks
 */
app.post('/aircall/calls', (req, res) => {
    if (req.body.event === 'call.created'&&
        req.body.data.direction === 'inbound') {
        if (isOutsideOfBusinessHours() || isInsideOfHolidays()) {
            transferCall(req.body.data);
        }
        else {
            // Do nothing.
        }
    }
    res.sendStatus(200);
});

/**
 *  Returns true if current time is outside of
 *  business opening hours, false otherwise.
 */
const isOutsideOfBusinessHours = () => {
    //set to UTC timezone
    const businessHours = [
        {from: -1, to: -1}, // Sunday
        {from: 7, to: 14}, // Monday, from 7am to 7pm UTC+2
        {from: 7, to: 19}, // Tuesday, from 7am to 7pm UTC+2
        {from: 7, to: 19}, // Wednesday, from 7am to 7pm UTC+2
        {from: 7, to: 19}, // Thursday, from 7am to 7pm UTC+2
        {from: 7, to: 19}, // Friday, from 7am to 7pm UTC+2
        {from: 7, to: 19}  // Saturday, from 7am to 7pm UTC+2
    ];

    // Get current day of the week (0 for Sunday, 1 for Monday...):
    const currentDay = (new Date()).getDay();

    // Get hour, according to local time (from 0 to 23):
    const currentHour = (new Date()).getHours();

    return !(
        businessHours[currentDay]['from'] <= currentHour &&
        currentHour < businessHours[currentDay]['to']
    );
}

/**
 *  Returns true if current date is a holiday,
 *  false otherwise.
 */
const isInsideOfHolidays = () => {
    // Add here your holidays
    const holidays = [
        {day: 24, month: 5}, // 24-05 holiday
        {day: 14, month: 7}, // 14-07 holiday
        {day: 15, month: 8}, // 15-08 holiday
        {day: 1, month: 11}, // 1-11 holiday
        {day: 11, month: 11}, // 11-11 holiday
        {day: 25, month: 12} // 25-12 holiday
    ];

    // Get the day-of-the-month, using local time, between 1 and 31.
    const currentDate = (new Date()).getDate();

    // Get the month, using local time, between 1 and 12 (January to December).
    const currentMonth = (new Date()).getMonth() + 1;

    return (holidays.some( holiday => (holiday.day === currentDate && holiday.month === currentMonth) ));
}

/**
 *  Transfer the incoming call to the overflow number
 */
const transferCall = (callObject) => {
    // We set the ID of the two Aircall we created in step 1.
    const MAIN_NUMBER_ID = 283982;

    // Do nothing if the Webhook event is not associated to the main number:
    if (callObject.number.id !== MAIN_NUMBER_ID) {
        return;
    }

    // Encoding credentials:
    const apiId = "171ffef70e605b80cebc00e5b48495a2";
    const apiToken = "68f2fa80570bfd2d42e35432daca2f12";
    let encodedCredentials = Buffer.from(apiId + ':' + apiToken).toString('base64');

    // Format the URL
    const apiUrl = `https://api.aircall.io/v1/calls/${callObject.id}/transfers`;

    // Define the POST body, with the E164 overflow number
    const body = {
        number: '+33485800097'
    };

    // Define HTTP options
    const httpOptions = {
        headers: {
            'Authorization': 'Basic ' + encodedCredentials,
            'Content-Type': 'application/json'
        }
    };

    // Finally, send the POST API request to Aircall
    axios.post(apiUrl, body, httpOptions);
}

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));