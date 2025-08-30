const config = {

    licensekey: "",

    features: {
        invision: true,
        teamspeak: true
    },

    bot: {
        token: "",
        clientId: "",

        settings: {
            status: "",
            embedcolor: "#1ABC9C",
            embedfooter: "iloveyou",
        },
    },
 
    mysql: {
        host: "",
        user: "",
        password: "",
        database: "",
    },

    departmentDiscords: {
        "Los Santos Police Department": {
        link: "https://discord.gg/invite",
        officer: "Police Commissioner - Vacante W."
        },
        "Blaine County Sheriff's Office": {
        link: "https://discord.gg/invite",
        officer: "Sheriff - Vacante W."
        },
        "San Andreas State Police": {
        link: "https://discord.gg/invite",
        officer: "Commissioner - Vacante W."
        },
        "San Andreas Civilian Operations": {
        link: "https://discord.gg/invite",
        officer: "Civilian Director - Vacante W."
        }
    },


    invision: {
        api: "",
        domain: "",
        recruit: "",
        member: "",
        sit: "",
        staff: "",
        sstaff: "",
        jadmin: "",
        admin: "",
        dev: "",
        media: "",
        rnt: "",
        retired: "",
        applicant: "",
    },

    logifValid: true,
    logIps: false, // if you want to log the IPs for people if they pass the VPN check, set this to true otherwise it won't log.
    vpnApiKey: '', // uhh if you want to use the iphub api for checking if a user is using a vpn or not you can get your api key here: https://iphub.info/register // free key is 1000 requests per day

    ts3: {
        host: "localhost",
        queryport: 10011,
        serverport: 9987,
        username: "serveradmin",
        password: "",
        nickname: "Vox Development",

        groupIDs: {
            VPNBYPASS: 1,
            DND: 1,
            QUEUEBYPASS: 1,
            COOKIE: 1,
            SEESTAFF: 1,
            SEEADMIN: 1,
            SEEHA: 1,
            SEEIA: 1,
            MEMBER: "1",
            RSTAFF: 1,
            RADMIN: 1,
            SIT: "1",
            STAFF: "1",
            SRSTAFF: "1",
            JRADMIN: "1",
            ADMIN: "1",
            SRADMIN: 1,
            HEADADMIN: 1,
        },
        whitelistedChannelIds: [2, 1, 41, 43, 46, 48],
        whitelistedWaitingRoomIds: [285, 286, 2, 44, 47, 49],
        aopChannels: {
            s1: 328,
            s2: 290,
        },
        RTOChannels: {
            s1: 70,
            s2: 84,
        },
        fastTravelChannels: [287, 288],
        dispatchTags: [
            '(P)',
            '(S)',
            '(T)',
            '(FIRE)',
            '(QA)',
            '(EVAL)',
            '(911)',
            '[P]',
            '[S]',
            '[T]',
            '[FIRE]',
            '[QA]',
            '[EVAL]',
            '[911]',
        ],
        addonTags: ['(TOW)', '(SCANNER)', '(L)', '[TOW]', '[SCANNER]', '[L]'],
    },

    server: {
        name: "Vox Development",
        fivemip: '127.0.0.1:30120', // e.g 127.0.0.1:30120
        logo: "https://media.discordapp.net/attachments/1282018361781260321/1356408862621831278/Vox_Development_Logo_Transparent.png?ex=68018db1&is=68003c31&hm=88a35338149ba9f42676d9896e53bf121793e5e6a2d429660ff7bcad171cef0d&=&format=webp&quality=lossless&width=461&height=461"
    },

    roles: {
        leadership: "",
        admin: "",
        ia: "",
        jadmin: "",
        sstaff: "",
        staff: "",
        sit: "",
        member: "",
        verification: "",
        whitelist: "",

        fan: {
            admin: "",
            jadmin: "",
            sstaff: "",
            staff: "",
            sit: "",
            member: ""
        },


        dept: {
            lspd: "",
            bcso: "",
            sasp: "",
            safr: "",
            civ: "",
            comms: "",
            rnt: "",
            dev: "",
            media: "",
        },
        
        staffguild: {
            admin: "",
            jadmin: "",
            sstaff: "",
            staff: "",
            sit: ""
        }
    },

    guilds: {
        mainGuild: "",
        devGuild: "",
        fanGuild: "",
        staffGuild: "",
    },

    messages: {
        onlymainGuild: "This command can only be used in the main guild.",
        noPermission: "You do not have permission to use this command.",

    },

    mute: {
        role: ""
    },

    channels: {
        logs: "",
        leaveLogs: ""
    },

    // This is important to where you don't fuck it up, keep one guild ID for your guild when you want to add more roles for probationary+ etc make a new line by copying 

    /*
        {
            discordRoleId: 'guildId',
            ts3roleId: "roleId"
        },
    */

    departmentRoles: {
      '': { // Guild ID
        departmentRoleId: "", // Department Role ID for TeamSpeak
        roles: [
          {
            discordRoleId: '',
            ts3roleId: ""
          },
          {
            discordRoleId: '',
            ts3roleId: ""
          }
        ]
      },
      '': { // Guild ID
        departmentRoleId: "", // Department Role ID for TeamSpeak
        roles: [
          {
            discordRoleId: '',
            ts3roleId: ""
          },
          {
            discordRoleId: '',
            ts3roleId: ""
          }
        ]
      }
    }
}

export default config;