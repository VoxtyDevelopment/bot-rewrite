import config from '../config'
import { Logger } from '../index'

const roleconfig = {
    mainServerGuildId: config.guilds.mainGuild,
    fanServerGuildId: config.guilds.fanGuild,
    roleMappings: [
        {
            mainServerRoleId: `${config.roles.admin}`, // Admin
            fanServerRoleId: `${config.roles.fan.admin}`,
        },
        {
            mainServerRoleId: `${config.roles.jadmin}`, // Jr. Admin
            fanServerRoleId: `${config.roles.fan.jadmin}`,
        },
        {
            mainServerRoleId: `${config.roles.sstaff}`, // Senior Staff
            fanServerRoleId: `${config.roles.fan.sstaff}`
        },
        {
            mainServerRoleId: `${config.roles.staff}`, // Staff
            fanServerRoleId: `${config.roles.fan.staff}`,
        },
        {
            mainServerRoleId: `${config.roles.sit}`, // Staff in Training
            fanServerRoleId: `${config.roles.fan.sit}`,
        },
        {
            mainServerRoleId: `${config.roles.member}`, // Community Member
            fanServerRoleId: `${config.roles.fan.member}`
        }
    ]
}

module.exports = {
    once: true,
    name: 'ready',
    async execute(client) {
        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                if (Array.isArray(roleconfig.roleMappings)) {
                    for (const mapping of roleconfig.roleMappings) {
                        // Role Added
                        if (!oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const fanServerGuild = client.guilds.cache.get(roleconfig.fanServerGuildId);
                                if (!fanServerGuild) {
                                    Logger.warn('Fan server not found.');
                                    return;
                                }

                                const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                                if (fanServerRole) {
                                    const member = await fanServerGuild.members.fetch(newMember.user.id);
                                    await member.roles.add(fanServerRole);
                                    Logger.info(`Synced role: Added ${fanServerRole.name} to ${member.user.tag}`);
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

                        // Role Removed
                        if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const fanServerGuild = client.guilds.cache.get(roleconfig.fanServerGuildId);
                                if (!fanServerGuild) {
                                    Logger.warn('Fan server not found.');
                                    return;
                                }

                                const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                                if (fanServerRole) {
                                    const member = await fanServerGuild.members.fetch(newMember.user.id);
                                    await member.roles.remove(fanServerRole);
                                    Logger.info(`Synced role: Removed ${fanServerRole.name} from ${member.user.tag}`);
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
                } else {
                    Logger.error('roleMappings is not an array.');
                }
            }
        });

        Logger.info('Bot | Online');
    }
}
