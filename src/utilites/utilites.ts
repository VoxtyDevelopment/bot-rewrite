import { TeamSpeak } from "ts3-nodejs-library";
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import config from "../config";
import mysql from 'mysql2';
import axios from 'axios';
import https from 'https';
const headers = { 'User-Agent': 'ECRP_Bot/2.0'};

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const TEMPLATE_ID = '1Ur4T8yG3dDi_p9RAW3h8QqwPy7zbCTzeleXIvLhcwL4';

export const auth = new JWT({
    email: config.google.email,
    key: config.google.privatekey!.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
    ],
})

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

export async function generateDocument(name: string): Promise<string> {
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_ID,
      requestBody: {
        name: `${name} | DAR Report`,
      },
    });
  
    const newDocId = copyResponse.data.id!;
    const docLink = `https://docs.google.com/document/d/${newDocId}/edit`;
  
    await docs.documents.batchUpdate({
      documentId: newDocId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: { text: '{{name}}', matchCase: true },
              replaceText: name,
            },
          },
        ],
      },
    });
  
    await drive.permissions.create({
      fileId: newDocId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  
    await drive.permissions.create({
      fileId: newDocId,
      requestBody: {
        role: 'writer',
        type: 'group',
        emailAddress: 'eastcoastrp@googlegroups.com',
      },
      sendNotificationEmail: false,
    });
  
    return docLink;
}

export const drive = google.drive({ version: 'v3', auth });
export const docs = google.docs({ version: 'v1', auth });
export default { con, ts3 };