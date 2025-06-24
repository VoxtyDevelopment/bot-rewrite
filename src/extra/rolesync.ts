import config from '../config'
import { Logger } from '../index'
import { post } from 'superagent'
import utilities from '../utils/main-utils'
const con = utilities.con
const ts3 = utilities.ts3

const roleConfig = {
    mainServerGuildId: config.guilds.mainGuild,
    fanServerGuildId: config.guilds.fanGuild,
    staffServerGuildId: config.guilds.staffGuild,
    roleMappings: [
        {
            mainServerRoleId: `${config.roles.admin}`,
            fanServerRoleId: `${config.roles.fan.admin}`,
            staffServerRoleId: `${config.roles.staffguild.admin}`,
            webRoleId: config.invision.admin,
            ts3roleId: config.ts3.groupIDs.ADMIN
        },
        {
            mainServerRoleId: `${config.roles.jadmin}`,
            fanServerRoleId: `${config.roles.fan.jadmin}`,
            staffServerRoleId: `${config.roles.staffguild.jadmin}`,
            webRoleId: config.invision.jadmin,
            ts3roleId: config.ts3.groupIDs.JRADMIN
        },
        {
            mainServerRoleId: `${config.roles.sstaff}`,
            fanServerRoleId: `${config.roles.fan.sstaff}`,
            staffServerRoleId: `${config.roles.staffguild.sstaff}`,
            webRoleId: config.invision.sstaff,
            ts3roleId: config.ts3.groupIDs.SRSTAFF
        },
        {
            mainServerRoleId: `${config.roles.staff}`,
            fanServerRoleId: `${config.roles.fan.staff}`,
            staffServerRoleId: `${config.roles.staffguild.staff}`,
            webRoleId: config.invision.staff,
            ts3roleId: config.ts3.groupIDs.STAFF
        },
        {
            mainServerRoleId: `${config.roles.sit}`,
            fanServerRoleId: `${config.roles.fan.sit}`,
            staffServerRoleId: `${config.roles.staffguild.sit}`,
            webRoleId: config.invision.sit,
            ts3roleId: config.ts3.groupIDs.SIT
        },
        {
            mainServerRoleId: `${config.roles.member}`,
            fanServerRoleId: `${config.roles.fan.member}`,
            webRoleId: config.invision.member,
            ts3roleId: config.ts3.groupIDs.MEMBER
        }
    ]
}

module.exports = {
    once: true,
    name: 'ready',
    async execute(client) {
        await syncAllMembers(client);

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                await handleRoleSync(client, oldMember, newMember);
            }
        });

        Logger.info('Bot | Online');
    }
}

async function syncAllMembers(client) {
    for (const guildId of [roleConfig.mainServerGuildId, roleConfig.fanServerGuildId, roleConfig.staffServerGuildId]) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            await handleRoleSync(client, { roles: { cache: new Map() }, user: member.user }, member);
        }
    }
}

async function handleRoleSync(client, oldMember, newMember) {
    if (config.features.invision && roleConfig.fanServerGuildId) {
        for (const mapping of roleConfig.roleMappings) {
            if (!oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    const fanServerGuild = client.guilds.cache.get(roleConfig.fanServerGuildId);
                    if (!fanServerGuild) {
                        Logger.warn('Fan server not found.');
                        continue;
                    }
                    const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                    if (fanServerRole) {
                        const member = await fanServerGuild.members.fetch(newMember.user.id);
                        await member.roles.add(fanServerRole);
                    } else {
                        Logger.warn('Fan server role not found.');
                    }
                } catch (error: any) {
                    if (error.code === 10007) {
                        Logger.warn(`User ${newMember.user.tag} is not in the fan server. Skipping.`);
                    } else {
                        Logger.error('Error syncing role in fan server:', error);
                    }
                }
            }
            if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    const fanServerGuild = client.guilds.cache.get(roleConfig.fanServerGuildId);
                    if (!fanServerGuild) {
                        Logger.warn('Fan server not found.');
                        continue;
                    }
                    const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                    if (fanServerRole) {
                        const member = await fanServerGuild.members.fetch(newMember.user.id);
                        await member.roles.remove(fanServerRole);
                    } else {
                        Logger.warn('Fan server role not found.');
                    }
                } catch (error: any) {
                    if (error.code === 10007) {
                        Logger.warn(`User ${newMember.user.tag} is not in the fan server. Skipping.`);
                    } else {
                        Logger.error('Error syncing role in fan server:', error);
                    }
                }
            }
        }
    }

    if (config.features.invision && roleConfig.staffServerGuildId) {
        for (const mapping of roleConfig.roleMappings) {
            if (mapping.staffServerRoleId && !oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    const staffServerGuild = client.guilds.cache.get(roleConfig.staffServerGuildId);
                    if (!staffServerGuild) {
                        Logger.warn('Staff server not found.');
                        continue;
                    }
                    const staffServerRole = staffServerGuild.roles.cache.get(mapping.staffServerRoleId);
                    if (staffServerRole) {
                        await staffServerGuild.members.fetch(newMember.user.id).then(member => {
                            member.roles.add(staffServerRole);
                        });
                    } else {
                        Logger.warn('Staff server role not found.');
                    }
                } catch (error: any) {
                    if (error.code === 10007) {
                        Logger.warn(`User ${newMember.user.tag} is not in the staff server. Skipping.`);
                    } else {
                        Logger.error('Error syncing role in staff server:', error);
                    }
                }
            }
            if (mapping.staffServerRoleId && oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    const staffServerGuild = client.guilds.cache.get(roleConfig.staffServerGuildId);
                    if (!staffServerGuild) {
                        Logger.warn('Staff server not found.');
                        continue;
                    }
                    const staffServerRole = staffServerGuild.roles.cache.get(mapping.staffServerRoleId);
                    if (staffServerRole) {
                        await staffServerGuild.members.fetch(newMember.user.id).then(member => {
                            member.roles.remove(staffServerRole);
                        });
                    } else {
                        Logger.warn('Staff server role not found.');
                    }
                } catch (error: any) {
                    if (error.code === 10007) {
                        Logger.warn(`User ${newMember.user.tag} is not in the staff server. Skipping.`);
                    } else {
                        Logger.error('Error syncing role in staff server:', error);
                    }
                }
            }
        }
    }

    if (config.features.invision) {
        for (const mapping of roleConfig.roleMappings) {
            if (mapping.webRoleId && !oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    con.query('SELECT webId FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                        if (err || !rows[0]) {
                            return;
                        }
                        const webId = rows[0].webId;
                        post(`https://${config.invision.domain}/api/core/members/${webId}?group=${mapping.webRoleId}&key=${config.invision.api}`)
                            .set('User-Agent', 'ECRP_Bot/1.0')
                            .end((err, res) => {
                                if (err) {
                                    Logger.error(err);
                                }
                            });
                    });
                } catch (error) {
                    Logger.error('Error syncing web roles', error);
                }
            }
            // Role Removed
            if (mapping.webRoleId && oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    con.query('SELECT webId FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                        if (err || !rows[0]) {
                            return;
                        }
                        const webId = rows[0].webId;
                        post(`https://${config.invision.domain}/api/core/members/${webId}?group=${config.invision.applicant}&key=${config.invision.api}`)
                            .set('User-Agent', 'ECRP_Bot/1.0')
                            .end((err, res) => {
                                if (err) {
                                    Logger.error(err);
                                }
                            });
                    });
                } catch (error) {
                    Logger.error('Error syncing web roles', error);
                }
            }
        }
    }

    if (config.features.teamspeak) {
        for (const mapping of roleConfig.roleMappings) {
            if (mapping.ts3roleId && !oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    con.query('SELECT * FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                        if (err || !rows[0]) {
                            return;
                        }
                        const usercache = rows[0];
                        const teamspeakRole = mapping.ts3roleId;
                        if (teamspeakRole) {
                            const tsclient = await ts3.getClientByUid(usercache.ts3);
                            if (tsclient) {
                                await tsclient.addGroups(teamspeakRole);
                            } else {
                                const response = await ts3.execute("clientgetdbidfromuid", { cluid: usercache.ts3 }) as unknown;
                                if (!response || !response[0] || !response[0].cldbid) {
                                    Logger.warn(`No cldbid found for UID: ${usercache.ts3}`);
                                    return;
                                }
                                const cldbid = response[0].cldbid;
                                await ts3.clientAddServerGroup(cldbid, teamspeakRole);
                            }
                        } else {
                            Logger.warn('Teamspeak role not found');
                        }
                    });
                } catch (error) {
                    Logger.error('Error syncing teamspeak roles', error);
                }
            }
            if (mapping.ts3roleId && oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                try {
                    con.query('SELECT * FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                        if (err || !rows[0]) {
                            return;
                        }
                        const usercache = rows[0];
                        const teamspeakRole = mapping.ts3roleId;
                        if (teamspeakRole) {
                            const response = await ts3.execute("clientgetdbidfromuid", { cluid: usercache.ts3 }) as unknown;
                            if (!response || !response[0] || !response[0].cldbid) {
                                Logger.warn(`No cldbid found for UID: ${usercache.ts3}`);
                                return;
                            }
                            const cldbid = response[0].cldbid;
                            await ts3.serverGroupDelClient(cldbid, teamspeakRole);
                        } else {
                            Logger.warn('Teamspeak role not found');
                        }
                    });
                } catch (error) {
                    Logger.error('Error removing users server group from teamspeak', error);
                }
            }
        }
    }
}