import config from '../config'
import utilites from "../utilites/utilites";
const ts3 = utilites.ts3
const con = utilites.con

const roleConfig = {
    mainServerGuildId: config.guilds.mainGuild,

    roleMappings: [
        {
            mainServerRoleId: config.roles.admin, // Administration
            ts3roleId: config.ts3.roles.admin
        },
        {
            mainServerRoleId: config.roles.jadmin, // Junior Administration
            ts3roleId: config.ts3.roles.jadmin
        },
        {
            mainServerRoleId: config.roles.sstaff, // Senior Staff
            ts3roleId: config.ts3.roles.sstaff
        },
        {
            mainServerRoleId: config.roles.staff, // Staff
            ts3roleId: config.ts3.roles.staff
        },
        {
            mainServerRoleId: config.roles.sit, // Staff in Training
            ts3roleId: config.ts3.roles.sit
        },
        {
            mainServerRoleId: config.roles.member, // Membership
            ts3roleId: config.ts3.roles.member
        }
    ]
}

module.exports = {
    once: true,
    name: 'ready',
    async execute(client) {
        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                if (Array.isArray(roleConfig.roleMappings)) {
                    for (const mapping of roleConfig.roleMappings) {
                        if (!oldMember.roles.cache.has(mapping.mainServerRoleId) && newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                con.query('SELECT * FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                                    if (err) return console.log('There was an error fetching the users information from the database.');
                                    if (!rows[0]) return console.log('There was an error fetching the users information from the database.');
                                    const usercache = rows [0];
                                    const teamspeakRole = (mapping.ts3roleId)          
                                    
                                    if (teamspeakRole) {
                                        const tsclient = await ts3.getClientByUid(usercache.ts3);

                                        if (tsclient) {
                                            await tsclient.addGroups(teamspeakRole);
                                        } else {
                                            const response = await ts3.execute("clientgetdbidfromuid", { cluid: usercache.ts3 }) as unknown;                                            
                                            if (!response || !response[0] || !response[0].cldbid) {
                                                console.log(`No cldbid found for UID: ${usercache.ts3}`);
                                                return;
                                            }
                                            
                                            const cldbid = response[0].cldbid;
                                            await ts3.clientAddServerGroup(cldbid, teamspeakRole);
                                                                                                                              
                                        }
                                    } 
                                    else {
                                        console.log('Teamspeak role not found')
                                    }
                                })
                            } catch (error) {
                                console.error('Error syncing teamspeak roles', error)
                            }
                        }

                        if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                con.query('SELECT * FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                                    if (err) return console.log('There was an error fetching the users information from the database.');
                                    if (!rows[0]) return console.log('There was an error fetching the users information from the database.');
                                    const usercache = rows [0];
                                    const teamspeakRole = (mapping.ts3roleId) 
                                    
                                    if (teamspeakRole) {
                                        const response = await ts3.execute("clientgetdbidfromuid", { cluid: usercache.ts3 }) as unknown;
                                        
                                        if (!response || !response[0] || !response[0].cldbid) {
                                            console.log(`No cldbid found for UID: ${usercache.ts3}`);
                                            return;
                                        }
                                        
                                        const cldbid = response[0].cldbid;

                                        await ts3.serverGroupDelClient(cldbid, teamspeakRole);
                                    } else {
                                        console.log('Teamspeak role not found')
                                    }
                                })
                            } catch (error) {
                                console.error('Error removing users server group from teamspeak', error)
                            }
                        }
                    }
                }
            }
        })
    }
}
