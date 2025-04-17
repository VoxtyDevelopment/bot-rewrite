import config from '../config'

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
                        if (!oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const fanServerGuild = client.guilds.cache.get(roleconfig.fanServerGuildId);
                                if (!fanServerGuild) {
                                    console.log('Fan server not found.');
                                    return;
                                }
        
                                const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                                if (fanServerRole) {
                                    await fanServerGuild.members.fetch(newMember.user.id).then(member => {
                                        member.roles.add(fanServerRole);
                                    });
                                } else {
                                    console.log('Fan server role not found.');
                                }
                            } catch (error: any) {
                                if (error.code === 10007) {
                                    console.log(`User ${newMember.user.tag} is not in the fan server. Skipping.`);
                                } else {
                                    console.error(`Error syncing role in fan server:`, error);
                                }
                            }
                        }
        
                        if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const fanServerGuild = client.guilds.cache.get(roleconfig.fanServerGuildId);
                                if (!fanServerGuild) {
                                    console.log('Fan server not found.');
                                    return;
                                }
        
                                const fanServerRole = fanServerGuild.roles.cache.get(mapping.fanServerRoleId);
                                if (fanServerRole) {
                                    await fanServerGuild.members.fetch(newMember.user.id).then(member => {
                                        member.roles.remove(fanServerRole);
                                    });
                                } else {
                                    console.log('Fan server role not found.');
                                }
                            } catch (error: any) {
                                if (error.code === 10007) {
                                    console.log(`User ${newMember.user.tag} is not in the fan server. Skipping.`);
                                } else {
                                    console.error(`Error syncing role in fan server:`, error);
                                }
                            }
                        }
                    }
                } else {
                    console.error('roleMappings is not an array.');
                }
            }
        });       

        console.log("Services Are Running");
    }
}
