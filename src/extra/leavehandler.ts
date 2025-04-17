import config from '../config'
import utilites from "../utilites/utilites";
import axios from 'axios';
const ts3 = utilites.ts3
const con = utilites.con

module.exports = {
    once: true,
    name: 'ready',
    async execute(client) {
        client.on('guildMemberRemove', async (member) => {
            const userId = member.id;
            con.query('SELECT * FROM users WHERE discId = ?', [userId], async (err, rows) => {
                if (!rows[0]) return console.log('There was an error fetching the users information from the database.');
                const usercache = rows [0];
        
                try {
                    const response = await ts3.execute("clientgetdbidfromuid", { cluid: usercache.ts3 }) as unknown;
        
                    if (!response || !response[0] || !response[0].cldbid) {
                        console.log(`No cldbid found for UID: ${usercache.ts3}`);
                        return;
                    }
                    
                    const cldbid = response[0].cldbid;
        
                    const groupsResponse = await ts3.execute("servergroupsbyclientid", { cldbid }) as Array<{ sgid: string }>;
        
                    if (!groupsResponse || !Array.isArray(groupsResponse)) {
                        console.log(`No server groups found for CLDBID: ${cldbid}`);
                        return;
                    }
        
                    for (const group of groupsResponse) {
                        const sgid = group.sgid;
                        try {
                            await ts3.serverGroupDelClient(cldbid, sgid);
                        } catch (err) {
                            console.warn(`Failed to remove group ${sgid} from user ${cldbid}:`, err);
                        }
                    }

                    const headers = { 'User-Agent': 'ECRP_Bot/2.0'};
                    const suspendUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

                    if (usercache.webId) {
                        try {
                            await axios.post(
                                `https://${config.invision.domain}/api/core/members/${usercache.webId}/warnings?moderator=1&points=100&suspend=${suspendUntil}&key=${config.invision.api}`,
                                {},
                                { headers }
                            );
                        
                            await axios.post(
                                `https://${config.invision.domain}/api/core/members/${usercache.webId}?group=3&key=${config.invision.api}`,
                                {},
                                { headers }
                            );
                        } catch (error) {
                            console.error(`Failed to ban user on website (webId: ${usercache.webId}):`, error.message);
                        }
                    }

                    try {
                        await ts3.execute('banadd', {
                            uid: usercache.ts3,
                            time: 2592000, // 30d
                            banreason: "Improper Resignation"
                        });
                    } finally {
                        await ts3.logout();
                        ts3.quit;
                    }

                    const leaveChannel = client.channels.cache.get(config.channels.leaveLogs);

                    const memberRole = member.guild.roles.cache.get(config.roles.member);

                    const hasMemberRole = member.roles.cache.some(role => role.position >= memberRole.position);
                    

                    if (hasMemberRole) {
                        leaveChannel.send({ content: `<@&${config.roles.admin}> <@&${config.roles.jadmin}>\n Member <@${userId}> has left the community, please mark with a ✅ when your side of the resigination process is complete.`})
                    }

                    member.guilds.cache.forEach(async (guild) => {
                        try {
                            await guild.members.ban(userId, { reason: `Improper resigination` });
                        } catch (error) {
                            console.error(`Error banning user <@${userId}> in server ${guild.id}:`, error);
                        }
                    });
                } catch (error) {
                    console.error("There was an error executing this command", error)
                    return;
                }
            })
        })
    }
}
