const { WebClient, ErrorCode } = require('@slack/web-api');
require('dotenv').config();

// Initialize web client with token that's hidden due to dotenv
const web = new WebClient(process.env.BOT_TOKEN)

// Channel ID
const channelID = 'C017LS59CN9'; //replace this later with the channelID you want on the VSA slack

// Executes the pairing every 30 seconds, can change this to a week later
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
, 30000);