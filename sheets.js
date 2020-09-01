const {google} = require('googleapis');
const fs = require('fs');
const { resolve } = require('path');

/** START OF GOOGLE SHEETS API */

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const SPREADSHEET_ID = '1bHFps8CqGfDBdo_UFEQzqWTXp7wSfkC4iNHBUmavBK0';

/**
 * Prints the names and points of students in the points spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1bHFps8CqGfDBdo_UFEQzqWTXp7wSfkC4iNHBUmavBK0/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listPoints(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Points!A2:C',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            console.log('Name, Points:');
            // Print columns A and C, which correspond to indices 0 and 3.
            rows.map((row) => {
                console.log(`${row[0]}, ${row[2]}`);
            });
        } else {
            console.log('No data found.');
        }
    });
}

/**
 * Retrieves the number of points a student has based on slackID
 * @param {*} auth The authenticated Google JWT client
 * @param {*} userID Slack ID of user generating event
 * @param {*} channelID Channel ID of the event to respond in
 */
function getPoints(auth, userID) {
    const sheets = google.sheets({version: 'v4', auth});
    return new Promise( (resolve, reject) => {
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Points!A2:C100',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            console.log(res.data);
            const rows = res.data.values;
            if (rows.length) {
                // Look at columns A and C, which correspond to indices 0 and 2.
                rows.map((row) => {
                    if (row[1] == userID) {
                        resolve(row[2]);
                    }
                });
                reject("No userID found");
            } else {
                console.log('No data found.');
            }
        });
    });
}


function findUser(auth, userID, name) {
    const sheets = google.sheets({version: 'v4', auth});
    const arrID = [ [userID], ];
    return new Promise( (resolve, reject) => {
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Points!A2:B',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            
            const rows = res.data.values;
            if (rows.length) {
                // Look at columns A and B, which correspond to indices 0 and 1.
                rows.map((row, index) => {
                    if (row[0].toUpperCase() === name.toUpperCase()) {
                        console.log(`A${index}`);
                        sheets.spreadsheets.values.update({
                            spreadsheetId: SPREADSHEET_ID,
                            range: `B${index + 2}`,
                            valueInputOption: 'RAW',
                            resource: {values: arrID}
                        }).then(() => {
                            resolve('Success!');
                        }).catch((err) => {
                            console.log(err);
                            reject('No name found');
                        });
                    }
                });
            } else {
                console.log('No data found.');
                reject('No name found');
            }
        });
    });
}

module.exports = {
    getPoints,
    findUser,
}

/*
if (row[1] == userID) {
                    web.chat.postMessage({
                        channel: channelID,
                        text: `You have ${row[2]} points! :stars:`,
                    });
                } else {
                    console.log('No userID found');
              }
              */