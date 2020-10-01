const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client();

let queueMsg = null;
let everyoneMsg = null;
let roomCode = "";
let queueAuthor = null;

// Queue Stuff
// let queueList = new Map();

// Create queue role in server
createQueueRole = (guild) => {
    console.log("Creating Queue Role");
    guild.roles.create({
        data: {
          name: 'queue',
          color: 'ORANGE',
        },
        reason: 'Queue role for the AmongUsBot',
    });
}

// Return role object
findQueueRole = () => {
    let role = queueMsg.guild.roles.cache.find(x => x.name === 'queue');
    if(role != undefined) {
        console.log("Queue role found");
    }
    else {
        role = createQueueRole(queueMsg.guild);
    }
    return role;
}

// Create menu embed
createMenu = () => {
    let menu = new Discord.MessageEmbed()
    .setColor("#FF0000")
    .setTitle("Among Us Queue Started")
    .setDescription(`${queueAuthor.username} wants to play Among Us!`)
    .setAuthor(queueAuthor.username, queueAuthor.avatarURL())
    .attachFiles(['./static/icon.png'])
    .setThumbnail('attachment://icon.png')
    .addFields(
        { name: 'ROOM CODE:', value: (roomCode === "" ? "No code yet :(" : "**" + roomCode + "**") },
        { name: '\u200B', value: '\u200B' },
        { name: "How To Join:", value: `Use the ${config.queueEmoji} react button to be added to the queue. \
                                        All users in the queue will be assigned the \"queue\" role. \
                                        When the host is ready, they can ping those users with \"@queue\".` 
                                    },
        { name: "How To Stop Recieving Notifications:", value: "Just remove your reaction, and the queue role \
                                                                should be removed from your account. Message an admin \
                                                                or a user with adequate permissions to remove the role \
                                                                if this feature does'nt work. (Very Likely)" 
                                                            }

    )
    .setTimestamp();
    return menu;
}

// On Bot Startup
//
client.on("ready", () => {
    console.log(`Among Us Bot is running in ${client.guilds.cache.size} servers`);
    client.user.setActivity(config.prefix + "help", {type: 'PLAYING'});
    // client.user.setPresence({ activity: { name: 'UNDER CONSTRUCTION' }, status: 'dnd' })
    //     .catch(console.error);
});

// On Joining a server
//
client.on("guildCreate", guild => {
    console.log(`New server joined: ${guild.name} (id: ${guild.id}). This server has ${guild.memberCount} members`);
    createQueueRole(guild);
});

// On every reaction
//
client.on("messageReactionAdd", (reaction, user) => {
    if(reaction.message != queueMsg || user.bot) return;
    console.log("Recieved reaction on queue");

    // Find queue role
    let role = findQueueRole();

    if(reaction.emoji.name == config.queueEmoji) {  
        // Add to queue
        let member = queueMsg.guild.members.cache.find(x => x.user.username === user.username);
        member.roles.add(role);
        console.log(`Added ${user.username} to queue`);
    }
    else {
        // UNSUPPORTED REACTION
        console.log("Unsupported reaction");
    }
});

// On ever reaction removal
//
client.on("messageReactionRemove", (reaction, user) => {
    if(reaction.message != queueMsg || user.bot) return;
    console.log("Someone removed their reaction on queue");

    // Find queue role
    let role = findQueueRole();

    if(reaction.emoji.name == config.queueEmoji) {  
        // remove from queue
        let member = queueMsg.guild.members.cache.find(x => x.user.username === user.username);
        member.roles.remove(role);
        console.log(`Removed ${user.username} from queue`);
    }
    else {
        // UNSUPPORTED REACTION
        console.log("Unsupported reaction");
    }
});

// On every message
//
client.on("message", message => {
    if(message.author.bot || message.channel.type === "dm" || !message.content.startsWith(config.prefix)) return;

    let author = message.author;

    // Prefix System
    //
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    console.log(`Command received: `, messageArray);

    // Start queue command
    //
    if(cmd == config.prefix + "start") {
        // Check for queue in progress
        if(queueMsg === null) {
            queueAuthor = author;
            // Create Embed
            let menu = createMenu();

            // Send Embed, and remember message details
            message.channel.send(`@everyone`).then(evryMsg => {
                everyoneMsg = evryMsg;
            });
            message.channel.send(menu).then(menuMsg => {
                queueMsg = menuMsg;
                menuMsg.react(config.queueEmoji);
                menuMsg.pin();
            });
        }
        else {
            message.channel.send(`**Cannot Create Queue:** A Queue has already been started! Use \`${config.prefix}stop\` to end the previous queue.`);
        }
    }

    // Stop queue command
    //
    if(cmd == config.prefix + "stop") {
        console.log("Attempting to end queue");
        if(queueMsg === null) {
            message.channel.send(`**Cannot Stop Queue:** No queue in progress! Use \`${config.prefix}start\` to start a queue.`);
        }
        else {
            // Remove role off people
            let role = findQueueRole();
            role.members.each(m => {
                console.log(`Removed ${m.user.username} from queue`);
                m.roles.remove(role);
            });
            roomCode = "";
            queueMsg.delete();
            everyoneMsg.delete();
            queueMsg = null;
            queueAuthor = null;
            message.channel.send(`**GG: **The current queue has been stopped. Use \`${config.prefix}start\` to start another queue.`);
        }
    }

    // Code command
    //
    if(cmd == config.prefix + "code") {
        if(args[0]) {
            roomCode = args[0];
            let menu = createMenu();
            queueMsg.edit(menu);
        }
        else {
            message.channel.send(`**Cannot Set Room Code:** No room code provided. Use ${config.prefix}help for a description of this command`);
        }
    }

    // Help Command
    //
    if(cmd == config.prefix + "help") {
        // Create Embed
        let menu = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle("Command Menu")
        .setDescription("*Check pinned messages if you are trying to leave the queue*")
        .attachFiles(['./static/icon.png'])
        .setThumbnail('attachment://icon.png')
        .addFields(
            { name: config.prefix + "start", value: `Use this command to start a queue.`},
            { name: config.prefix + "stop", value: "Stop the current queue"},
            { name: config.prefix + "code <code>", value: `Provide the current room code. (Ex. \"${config.prefix}code RMCDEX\")`},
            { name: config.prefix + "about", value: "Description of the bot"}
        );

        // Send Embed
        message.channel.send(menu);
    }

    // about command
    //
    if(cmd == config.prefix + "about") {
        // Create Embed
        let menu = new Discord.MessageEmbed()
        .setColor("#FF0000")
        .setTitle("About")
        .setDescription("A simple bot to help users queue for an Among Us game")
        .attachFiles(['./static/icon.png'])
        .setThumbnail('attachment://icon.png')
        .addFields(
            { name: "Author:", value: "Dustin Ward"},
            { name: "Github", value: "https://github.com/dustin-ward/Among-Us-Discord-Bot"}
        );

        // Send Embed
        message.channel.send(menu);
    }
});

client.login(config.token);
