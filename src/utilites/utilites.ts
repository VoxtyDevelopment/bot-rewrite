import { TeamSpeak } from "ts3-nodejs-library";
import config from "../config";
import mysql from 'mysql2';

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

export default { con, ts3 };