const { WebClient, ErrorCode } = require('@slack/web-api');
require('dotenv').config();
const express = require('express');
const { response } = require('express');
const app = express();
const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

/* PLEASE MOVE THIS 
 * TO ANOTHER FILE
 * GOOGLE SHEETS API
 * */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');


// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN)

// Channel ID
const channelID = 'C017LS59CN9'; //replace this later with the channelID you want on the VSA slack

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/', (req, res) => {
    // This is strictly for verification of redirect URL for slack (initialize once and done)
    if (req.body.challenge) {
    res.send(req.body.challenge);
    res.status(200);
    console.log('trying');
    }

    try {
        if (req.body.event.type === 'message' && req.body.event.channel_type === 'im' && req.body.event.text === 'test') {
            web.chat.postMessage({
                channel: req.body.event.channel,
                text: 'Test received!'
            });
        }
        if (req.body.event.type === 'message' && req.body.event.channel_type === 'im' && req.body.event.text === 'points') {
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Sheets API.
                authorize(JSON.parse(content), getPoints, req.body.event.user, req.body.event.channel);
            });
        }
        res.status(200).send('Success!');
    } catch(error) {
        console.log(error);
    }
}).listen(3000);

app.use('/slack/events', slackEvents.expressMiddleware());



/** START OF GOOGLE SHEETS API */

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listPoints);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, userID, channelID) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, userID, channelID);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and points of students in the points spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1bHFps8CqGfDBdo_UFEQzqWTXp7wSfkC4iNHBUmavBK0/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listPoints(auth) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
        spreadsheetId: '1bHFps8CqGfDBdo_UFEQzqWTXp7wSfkC4iNHBUmavBK0',
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

function getPoints(auth, userID, channelID) {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
        spreadsheetId: '1bHFps8CqGfDBdo_UFEQzqWTXp7wSfkC4iNHBUmavBK0',
        range: 'Points!A2:C',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            // Print columns A and C, which correspond to indices 0 and 3.
            rows.map((row) => {
                console.log(row);
                if (row[1] == userID) {
                    web.chat.postMessage({
                        channel: channelID,
                        text: `Your points are ${row[2]}`
                    });
                } else {
                    console.log('No userID found');
              }
            });
        } else {
            console.log('No data found.');
        }
    });
}

/** END OF GOOGLE SHEETS API - PLEASE MOVE TO ANOTHER FILE - DON'T FORGET THE REQUIREMENTS AT TOP OF FILE */

// Checks if the date is Monday at 12pm
function checkDate() {
    let date = new Date();
    console.log(date.getDay());
    console.log(date.getHours());
    if(date.getDay() === 1 && date.getHours() === 12) {
        (async() => {
            try {
                const result = await web.conversations.members({
                    channel: channelID,
                });
                let members = result.members;
                let pairedMembers = [];
                
                // Random pairing sequence
                let i = 0; // current index of pairedMembers
                while (members.length > 1) {
                    let pair1 = members.splice(Math.floor(Math.random() * members.length), 1);
                    let pair2 = members.splice(Math.floor(Math.random() * members.length), 1);
                    pairedMembers[i] = { pair1, pair2 };
                    i++;
                }
                
                // Sending DM's to paired members
                for (let j = 0; j < pairedMembers.length; j++) {
                    // Opening DM with the two paired members
                    let convResult = await web.conversations.open({
                        users: `${pairedMembers[j].pair1},${pairedMembers[j].pair2}`
                    });
                    let convID = convResult.channel.id;
                    
                    // Sending opening message
                    let messageResult = await web.chat.postMessage({
                        channel: convID,
                        text: `You have been paired up! Get to know each other`
                    });
                    
                }
        
            } catch(error) {
                console.log(error.data);
            }
        })();
    }
}

// Runs checkDate every 45 minutes
var dateLoop = setInterval(function() {
    checkDate();
}, 2700000);