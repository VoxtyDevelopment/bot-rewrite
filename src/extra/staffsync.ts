import config from '../config'

const roleconfig = {
    mainServerGuildId: config.guilds.mainGuild,
    staffServerGuildId: config.guilds.staffGuild,
    roleMappings: [
        {
            mainServerRoleId: `${config.roles.admin}`, // Admin
            staffServerRoleId: `${config.roles.staffguild.admin}`,
        },
        {
            mainServerRoleId: `${config.roles.jadmin}`, // Jr. Admin
            staffServerRoleId: `${config.roles.staffguild.jadmin}`,
        },
        {
            mainServerRoleId: `${config.roles.sstaff}`, // Senior Staff
            staffServerRoleId: `${config.roles.staffguild.sstaff}`
        },
        {
            mainServerRoleId: `${config.roles.staff}`, // Staff
            staffServerRoleId: `${config.roles.staffguild.staff}`,
        },
        {
            mainServerRoleId: `${config.roles.sit}`, // Staff in Training
            staffServerRoleId: `${config.roles.staffguild.sit}`,
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
                                const staffServerGuild = client.guilds.cache.get(roleconfig.staffServerGuildId);
                                if (!staffServerGuild) {
                                    console.log('Staff server not found.');
                                    return;
                                }
        
                                const staffServerRole = staffServerGuild.roles.cache.get(mapping.staffServerRoleId);
                                if (staffServerRole) {
                                    await staffServerGuild.members.fetch(newMember.user.id).then(member => {
                                        member.roles.add(staffServerRole);
                                    });
                                } else {
                                    console.log('Staff server role not found.');
                                }
                            } catch (error: any) {
                                if (error.code === 10007) {
                                    return
                                } else {
                                    console.error(`Error syncing role in staff server:`, error);
                                }
                            }
                        }
        
                        if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const staffServerGuild = client.guilds.cache.get(roleconfig.staffServerGuildId);
                                if (!staffServerGuild) {
                                    console.log('Staff server not found.');
                                    return;
                                }
        
                                const staffServerRole = staffServerGuild.roles.cache.get(mapping.staffServerRoleId);
                                if (staffServerRole) {
                                    await staffServerGuild.members.fetch(newMember.user.id).then(member => {
                                        member.roles.remove(staffServerRole);
                                    });
                                } else {
                                    console.log('Staff server role not found.');
                                }
                            } catch (error: any) {
                                if (error.code === 10007) {
                                    return
                                } else {
                                    console.error(`Error syncing role in staff server:`, error);
                                }
                            }
                        }
                    }
                } else {
                    console.error('roleMappings is not an array.');
                }
            }
        });       
    }
}
