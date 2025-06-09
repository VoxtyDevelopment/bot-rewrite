import config from '../config';
import utilites from "../utils/main-utils";
const ts3 = utilites.ts3;
const con = utilites.con;
import { changeWebsiteRole, banWebsiteUser } from "../utils/main-utils";
import { resetUser } from '../utils/ts3Utils';

const recentlyBannedOrKicked = new Set();

module.exports = {
    once: true,
    name: 'ready',

    async execute(client) {

        client.on('guildBanAdd', async (ban) => {
            recentlyBannedOrKicked.add(ban.user.id);
            setTimeout(() => recentlyBannedOrKicked.delete(ban.user.id), 10000);
        });

        client.on('guildMemberRemove', async (member) => {            
            if (member.user.bot) return;
            if (member.guild.id !== config.guilds.mainGuild) return;

            if (recentlyBannedOrKicked.has(member.id)) return;

            const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
            const kickLog = auditLogs.entries.first();
            if (kickLog && kickLog.target.id === member.id && Date.now() - kickLog.createdTimestamp < 10000) return;

            const requiredRoles = [
                config.roles.member,
                config.roles.sit,
                config.roles.staff,
                config.roles.sstaff,
                config.roles.jadmin,
                config.roles.admin
            ];
            const hadRequiredRole = member.roles.cache.some(role => requiredRoles.includes(role.id));
            if (!hadRequiredRole) return;

            console.log(`Member left: ${member.user.tag} (${member.id})`);
            const userId = member.id;
            con.query('SELECT * FROM users WHERE discId = ?', [userId], async (err, rows) => {
                if (!rows[0]) return console.log('There was an error fetching the users information from the database.');
                const usercache = rows[0];

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
                        try {
                            await ts3.serverGroupDelClient(cldbid, group.sgid);
                        } catch (err) {
                            console.warn(`Failed to remove group ${group.sgid} from user ${cldbid}:`, err);
                        }
                    }

                    if (usercache.webId) {
                        try {
                            await banWebsiteUser(usercache.webId);
                            await changeWebsiteRole(usercache.webId, config.invision.applicant);
                        } catch (error) {
                            console.error(`Failed to ban user on website (webId: ${usercache.webId}):`, error.message);
                        }
                    }

                    try {
                        resetUser(usercache.ts3);
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
                        leaveChannel.send({ content: `<@&${config.roles.admin}> <@&${config.roles.jadmin}>\n Member <@${userId}> has left the community, please mark with a ✅ when your side of the resignation process is complete.` });
                    }

                    member.guilds.cache.forEach(async (guild) => {
                        try {
                            await guild.members.ban(userId, { reason: `Improper resignation` });
                        } catch (error) {
                            console.error(`Error banning user <@${userId}> in server ${guild.id}:`, error);
                        }
                    });

                    con.query('DELETE FROM users WHERE discId = ?', [userId], (err) => {
                        if (err) {
                            console.error('Error deleting user from database:', err);
                        }
                    });

                } catch (error) {
                    console.error("There was an error executing this command", error);
                }
            });
        });
    }
};
