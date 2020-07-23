const { WebClient, ErrorCode } = require('@slack/web-api');
const dotenv = require('dotenv');

// Initialize dotenv
dotenv.config();

// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN)

// Channel ID
const channelID = 'C0189AEUN8Y';

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