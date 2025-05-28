import { Client, Collection, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, ActivityType } from "discord.js";
import config from "./config"
import fs from 'fs';
import path from 'path';
import utilities from './utils/main-utils';
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
        GatewayIntentBits.DirectMessages,
    ]
}) as ExtendedClient;
// one for the money two for the better green 3-4-methylenedioxymethamphetamine
const commands: any[] = [];
const commandFiles = getAllFiles(path.join(__dirname, 'commands'));


function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            fileList.push(filePath);
        }
    }

    return fileList;
}



client.commands = new Collection();

for (const filePath of commandFiles) {
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

for (const filePath of commandFiles) {
    const command = require(filePath);

    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
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

const schemaPath = path.join(__dirname, 'sql', 'bot.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8').trim();

if (schemaSQL) {
    con.query(schemaSQL, (err) => {
        if (err) {
            console.error("import error wit sql", err);
        }
    });
}


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
export { client };