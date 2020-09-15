const { WebClient, ErrorCode } = require("@slack/web-api");
require("dotenv").config();
const express = require("express");
const app = express();
const { createEventAdapter } = require("@slack/events-api");
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const googleAuth = require("./auth");
const googleSheets = require("./sheets");

// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN);

// Channel ID
const channelID = "C01A2HN8Z2M"; //replace this later with the channelID you want on the VSA slack
const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/slack/events", slackEvents.expressMiddleware());

// Google sheets authorization
let AUTH = googleAuth
  .authorize()
  .then((auth) => {
    AUTH = auth;
  })
  .catch((err) => {
    console.log("auth error", err);
  });

// Receives slack POST requests
app
  .post("/", (req, res) => {
    // This is strictly for verification of redirect URL for slack (initialize once and done)
    if (req.body.challenge) {
      res.send(req.body.challenge);
      res.status(200);
      console.log("slack verification");
    }

    try {
      // TEST keyword for debugging
      if (
        req.body.event.type === "message" &&
        req.body.event.channel_type === "im" &&
        req.body.event.text === "test"
      ) {
        web.chat.postMessage({
          channel: req.body.event.channel,
          text: "Test received!",
        });
      }

      // TEST keyword for debugging
      if (
        req.body.event.type === "message" &&
        req.body.event.channel_type === "im" &&
        req.body.event.text === "match1234"
      ) {
        checkDate();
      }

      // POINTS keyword to access points on point
      if (
        req.body.event.type === "message" &&
        req.body.event.channel_type === "im" &&
        req.body.event.text === "points"
      ) {
        // Ask sheets.js for promise containing points
        googleSheets
          .getPoints(AUTH, req.body.event.user, req.body.event.channel)
          .then((points) => {
            if (points) {
              web.chat.postMessage({
                channel: req.body.event.channel,
                text: `You have ${points} points! :stars:`,
              });
            }
          })
          .catch((err) => {
            console.log(err);
            web.chat.postMessage({
              channel: req.body.event.channel,
              text: `I didn't find you :thinking_face:. Try typing 'name FIRST-NAME LAST-NAME' (without the quotes), and I'll try adding your slackID to the points sheet!`,
            });
          });
      }

      // NAME keyword to add userID to points sheet
      if (
        req.body.event.type === "message" &&
        req.body.event.channel_type === "im" &&
        req.body.event.text.includes('name')
      ) {
        googleSheets
          .findUser(AUTH, req.body.event.user, req.body.event.text.substring(5))
          .then((msg) => {
            web.chat.postMessage({
                channel: req.body.event.channel,
                text: `Found ya :yum:! Try asking me again for your number of points!`,
              });
          })
          .catch((err) => {
            console.log(err);
            web.chat.postMessage({
            channel: req.body.event.channel,
            text: `Looks like I couldn't find you. Try messaging an officer to get your name on the sheet manually. :+1:`,
            });
          });
      }
      res.status(200).send("Success!");
    } catch (error) {
      console.log(error);
    }
  })
  .listen(PORT);

console.log(`Server running on ${PORT}`);

// Checks if the date is Monday at 12pm
function checkDate() {
    (async () => {
      try {
        const result = await web.conversations.members({
          channel: channelID,
        });
        let members = result.members;
        let pairedMembers = [];

        // Random pairing sequence
        let i = 0; // current index of pairedMembers
        while (members.length > 1) {
          let pair1 = members.splice(
            Math.floor(Math.random() * members.length), 1);
          let pair2 = members.splice(
            Math.floor(Math.random() * members.length), 1);

          pairedMembers[i] = { pair1, pair2 };
          i++;
        }

        // Sending DM's to paired members
        for (let j = 0; j < pairedMembers.length; j++) {
          // Opening DM with the two paired members
          let convResult = await web.conversations.open({
            users: `${pairedMembers[j].pair1},${pairedMembers[j].pair2}`,
          });
          let convID = convResult.channel.id;

          // Sending opening message
          web.chat.postMessage({
            channel: convID,
            text: `You have been paired up! Get to know each other`,
          });
        }
      } catch (error) {
        console.log(error.data);
      }
    })();
}