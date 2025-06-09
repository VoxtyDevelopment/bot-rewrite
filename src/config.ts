const config = {

    licensekey: "mb3tpihl-meegkh5l",

    bot: {
        token: "",
        clientId: "1358579274130522166",

        settings: {
            status: "Watching the sunrise on the eastcoast",
            embedcolor: "#1ABC9C",
            embedfooter: "Vox Development",
        },
    },
 
    mysql: {
        host: "localhost",
        user: "root",
        password: "",
        database: "botv2",
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
        api: "dba33bf8371595924d078ea0f420fe2c",
        domain: "slrp.epizy.com",
        recruit: "1",
        member: "12",
        sit: "1",
        staff: "1",
        sstaff: "1",
        jadmin: "1",
        admin: "1",
        dev: "1",
        media: "1",
        rnt: "1",
        retired: "",
        applicant: "",
    },

    vpnApiKey: 'MjgzMTQ6ajM5UTFiQXBybEU3QVJJUkZ3aWZBSU9DM0VGNDliNDA=', // uhh if you want to use the iphub api for checking if a user is using a vpn or not you can get your api key here: https://iphub.info/register // free key is 1000 requests per day

    ts3: {
        host: "localhost",
        queryport: 10011,
        serverport: 9987,
        username: "serveradmin",
        password: "BRfCc63X",
        nickname: "Vox Development",

        roles: {
            admin: "267",
            jadmin: "267",
            sstaff: "267",
            staff: "267",
            sit: "267",
            member: "468"
        },
        groupIDs: {
            VPNBYPASS: 638,
            DND: 330,
            QUEUEBYPASS: 636,
            COOKIE: 439,
            SEESTAFF: 239,
            SEEADMIN: 287,
            SEEHA: 240,
            SEEIA: 238,
            MEMBER: 128,
            RSTAFF: 438,
            RADMIN: 148,
            SIT: 19,
            STAFF: 18,
            SRSTAFF: 17,    
            JRADMIN: 16,
            ADMIN: 15,
            SRADMIN: 152,
            HEADADMIN: 153,
        },
        whitelistedChannelIds: [2, 1, 41, 43, 46, 48],
        whitelistedWaitingRoomIds: [285, 286, 2, 44, 47, 49],
        aopChannels: {
            s1: 66,
            s2: 81,
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
        leadership: "1373987444944273429",
        admin: "1373987472580546631",
        ia: "",
        jadmin: "1373987518118367334",
        sstaff: "1373987535088259084",
        staff: "1373987564041670656",
        sit: "1373987593578086462",
        member: "1373985382143885463",
        verification: "1373985382143885463",
        whitelist: "1373985382143885463",

        fan: {
            admin: "1258513061829152851",
            jadmin: "1258513061829152850",
            sstaff: "1258513061829152849",
            staff: "1258513061799526509",
            sit: "1258513061799526508",
            member: "1258513061799526507"
        },


        dept: {
            lspd: "",
            bcso: "",
            sasp: "1248799944396111874",
            safr: "",
            civ: "",
            comms: "",
            rnt: "1376451975759138877",
            dev: "",
            media: "",
        },
        
        staffguild: {
            admin: "1362334768297021562",
            jadmin: "1362334776245358664",
            sstaff: "1362334787221590108",
            staff: "1362334792435372203",
            sit: "1362334796990124124"
        }
    },

    guilds: {
        mainGuild: "1347954357357772901",
        devGuild: "",
        fanGuild: "1258513061556523080",
        staffGuild: "1307888458466857000",
    },

    mute: {
        catagory: "1347954357852962907",
        role: "Coventry"
    },

    channels: {
        logs: "1373986522633867264",
        leaveLogs: "1373986522633867264",
        ticketCategory: "1347954357852962907",
    },
}

export default config;
