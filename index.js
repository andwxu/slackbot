const { WebClient, ErrorCode } = require('@slack/web-api');
require('dotenv').config();
const express = require('express');
const { response } = require('express');
const app = express();
const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN)

// Channel ID
const channelID = 'C017LS59CN9'; //replace this later with the channelID you want on the VSA slack

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/', (req, res) => {
    /*
    res.send(req.body.challenge);
    res.status(200);
    */
    try {
        if (req.body.event.type === 'message' && req.body.event.text === 'test') {
            web.chat.postMessage({
                channel: req.body.event.channel,
                text: 'Test received!'
            });
        }
        if (req.body.event.type === 'message' && req.body.event.text === 'points') {
            web.chat.postMessage({
                channel: req.body.event.channel,
                text: 'Points received!'
            });
        }
        res.status(200).send("Success!");
    } catch(error) {
        console.log(error);
    }
}).listen(3000);

app.use('/slack/events', slackEvents.expressMiddleware());


/*
// Executes the pairing every week
setInterval(
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
    })
, 604800000);
*/