import { TeamSpeak } from "ts3-nodejs-library";
import config from "../config";
import mysql from 'mysql2';
import axios from 'axios';
import https from 'https';
const headers = { 'User-Agent': 'ECRP_Bot/2.0'};

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const con = mysql.createPool({
    connectionLimit: 100, 
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: 3306
});

const ts3 = new TeamSpeak({
    host: config.ts3.host,
    queryport: config.ts3.queryport,
    serverport: config.ts3.serverport,
    username: config.ts3.username,
    password: config.ts3.password,
    nickname: config.ts3.nickname,
});

export async function changeWebsiteRole(webid: string, roleid: string) {
  try {
    await axios.post(
      `https://${config.invision.domain}/api/core/members/${webid}?group=${roleid}&key=${config.invision.api}`,
      {},
      { headers, httpsAgent }
  );
  } catch (error) {
    return console.error(error);
  }
};

export async function banWebsiteUser(webid: string) {
  try {
    await axios.post(
      `https://${config.invision.domain}/api/core/members/${webid}/warnings?suspendPermanent&moderator=1&points=100&key=${config.invision.api}`,
      {},
      { headers, httpsAgent }
  );
  } catch (error) {
    return console.error(error);
  }
}

export default { con, ts3 };
