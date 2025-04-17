import { Client, Collection, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, ActivityType } from "discord.js";
import config from "./config"
import fs from 'fs';
import path from 'path';
import utilities from './utilites/utilites';
const con = utilities.con;

interface ExtendedClient extends Client {
    commands: Collection<string, {
        data: SlashCommandBuilder,
        execute: (interaction: ChatInputCommandInteraction) => Promise<any>
    }>;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages
    ]
}) as ExtendedClient;

const commands: any[] = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

for (const file of commandFiles) {
    const filePath = path.join(__dirname, 'commands', file);
    const command = require(filePath);

    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(config.bot.token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        await rest.put(
            Routes.applicationCommands(config.bot.clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

const eventFiles = fs.readdirSync(path.join(__dirname, 'extra')).filter(file => file.endsWith('.ts'));
for(const file of eventFiles) {
    const filePath = `./extra/${file}`
    const event = require(filePath)
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;
    
    // @ts-ignore
    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return;
    }

    try{
        await command.execute(interaction, client, config, con);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: "there was an error while executing this command!", ephemeral: true})
    }
})

con.query(`
    CREATE TABLE IF NOT EXISTS muterecords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discId VARCHAR(255),
        modId VARCHAR(255),
        muteReason TEXT,
        muteDate DATETIME
    )
`);

con.query(`
    CREATE TABLE IF NOT EXISTS activemutes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guildId VARCHAR(255) NOT NULL,
        discId VARCHAR(255) NOT NULL,
        muteReason TEXT DEFAULT NULL,
        roles VARCHAR(255) NOT NULL,
        muteChannel VARCHAR(255) NOT NULL
    )
`);


con.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        discId VARCHAR(255) NOT NULL,
        webId VARCHAR(255),
        ts3 VARCHAR(255) NOT NULL,
        steamHex VARCHAR(255) NOT NULL
    )
`);

con.query(`
    CREATE TABLE IF NOT EXISTS patrols (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    date VARCHAR(255) NOT NULL,
    time VARCHAR(255) NOT NULL,
    aop VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL
)
`);


con.query(`
    CREATE TABLE IF NOT EXISTS patrol_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patrol_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reaction VARCHAR(255) NOT NULL,
    FOREIGN KEY (patrol_id) REFERENCES patrols(id)
)
`);

client.on("ready", async () => {
    const activities = [
        { name: config.bot.settings.status, type: ActivityType.Playing }
    ];

    let i = 0;

    client.user.setPresence({
        status: 'online',
        activities: [activities[i % activities.length]],
    });

    setInterval(() => {
        i++;
        client.user.setPresence({
            status: 'online',
            activities: [activities[i % activities.length]],
        });
    }, 300000);
})


client.login(config.bot.token)