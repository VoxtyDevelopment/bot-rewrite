import config from '../config';
import { post } from 'superagent';
import utilities from '../utils/main-utils';
const con = utilities.con;


const roleConfig = {
    mainServerGuildId: config.guilds.mainGuild,

    roleMappings: [
        {
            mainServerRoleId: config.roles.admin, // Administration
            webRoleId: config.invision.admin
        },
        {
            mainServerRoleId: config.roles.jadmin, // Junior Administration
            webRoleId: config.invision.jadmin
        },
        {
            mainServerRoleId: config.roles.sstaff, // Senior Staff
            webRoleId: config.invision.sstaff
        },
        {
            mainServerRoleId: config.roles.staff, // Staff
            webRoleId: config.invision.staff
        },
        {
            mainServerRoleId: config.roles.sit, // Staff in Training
            webRoleId: config.invision.sit
        },
        {
            mainServerRoleId: config.roles.member, // Membership
            webRoleId: config.invision.member
        }
    ]
};

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
                                const webRole = mapping.webRoleId;
                                if (webRole) {
                                    con.query('SELECT webId FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                                        if (err || !rows[0]) {
                                            console.log('Error fetching user webId from database.');
                                        }
                                        const webId = rows[0].webId;

                                        post(`https://${config.invision.domain}/api/core/members/${webId}?group=${webRole}&key=${config.invision.api}`)
                                            .set('User-Agent', 'ECRP_Bot/1.0')
                                            .end((err, res) => {
                                                if (err) {
                                                    console.error(err);
                                                }
                                            });
                                    });
                                } else {
                                    console.log('Web role not found');
                                }
                            } catch (error) {
                                console.error('Error syncing web roles', error);
                            }
                        }

                        if (oldMember.roles.cache.has(mapping.mainServerRoleId) && !newMember.roles.cache.has(mapping.mainServerRoleId)) {
                            try {
                                const webRole = mapping.webRoleId;
                                if (webRole) {
                                    con.query('SELECT webId FROM users WHERE discId = ?', [newMember.user.id], async (err, rows) => {
                                        if (err || !rows[0]) {
                                            console.log('Error fetching user webId from database.');
                                        }
                                        const webId = rows[0].webId;

                                        post(`https://${config.invision.domain}/api/core/members/${webId}?group=${config.invision.applicant}&key=${config.invision.api}`)
                                            .set('User-Agent', 'ECRP_Bot/1.0')
                                            .end((err, res) => {
                                                if (err) {
                                                    console.error(err);
                                                }
                                            });
                                    });
                                } else {
                                    console.log('Web role not found');
                                }
                            } catch (error) {
                                console.error('Error removing web role', error);
                            }
                        }
                    }
                }
            }
        });
    }
};