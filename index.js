const { WebClient, ErrorCode } = require('@slack/web-api');
require('dotenv').config();

// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN)

// Channel ID
const channelID = 'C0189AEUN8Y'; //replace this later with the channelID you want on the VSA slack

(async() => {
    try {
        const result = await web.chat.postMessage({
            text: 'testing now haha',
            channel: channelID,
        });

        console.log(`Sent the ${result.ts} in conversation ${channelID}`);
    } catch (error) {
        console.log(error.data);
    }
})();