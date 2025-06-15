import { TeamSpeak } from "ts3-nodejs-library";
import config from "../config";
import mysql from 'mysql2';
import axios from 'axios';
import { post } from 'superagent';
import https from 'https';
import { EmbedBuilder, Client, ColorResolvable } from 'discord.js';
import { client } from "../index";

const headers = { 'User-Agent': 'ECRP_Bot/2.0' };
const invisiondomain = cleanURL(config.invision.domain);

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const con = mysql.createPool({
    connectionLimit: 100, 
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: 3306,
    multipleStatements: true
});

const ts3 = new TeamSpeak({
    host: config.ts3.host,
    queryport: config.ts3.queryport,
    serverport: config.ts3.serverport,
    username: config.ts3.username,
    password: config.ts3.password,
    nickname: config.ts3.nickname,
});

// logs to discord reallly should be done in a better way but this is fine for now
/**
 * @param title 
 * @param fields array of fields for the embed 
 */
export async function logToDiscord(title: string, fields: { name: string, value: string, inline?: boolean }[]) {
  try {
    const logChannel = client.channels.cache.get(config.channels.logs);
    if (!logChannel || !logChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(config.bot.settings.embedcolor as ColorResolvable)
      .setImage(config.server.logo)
      .setTimestamp()
      .setFooter({ text: config.bot.settings.embedfooter, iconURL: config.server.logo })
      .addFields(fields);

    if (logChannel && "send" in logChannel) await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to log to Discord:", err);
  }
}

export async function changeWebsiteRole(webid: string, roleid: string) {
     post(`https://${invisiondomain}/api/core/members/${webid}?group=${roleid}&key=${config.invision.api}`) // sets their group ID to the default (applicant role for most)
        .set('User-Agent', 'ECRP_Bot/2.0')
        .end((err, res) => {
        if(err) {
            console.log(err)
        }
    })
};

export async function banWebsiteUser(webid: string) {
    post(`https://${invisiondomain}/api/core/members/${webid}/warnings?moderator=1&suspendPermanent&points=100&key=${config.invision.api}`) // bans the user from the website
        .set('User-Agent', 'ECRP_Bot/2.0')
        .end((err, res) => {
        if(err) {
            console.log(err)
        }
    })
}

export function cleanURL(input: string) {
    let result = input;

    if (result.startsWith('https://')) {
        result = result.slice(8);
    }

    if (result.startsWith('http://')) {
        result = result.slice(7);
    }

    if (result.endsWith('/')) {
        result = result.slice(0, -1);
    }

    return result;
}

export default {
    con, ts3, logToDiscord
};
