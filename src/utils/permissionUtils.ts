import { Guild, GuildMember } from 'discord.js';
import { client } from '../index';
import config from '../config';
// ! ill prob utilize this in the future just here for now idc enough to change everything
// * This Should work for now until i need to update it for some more stuff in the future
export enum PermissionLevels {
    NOBODY = 0,
    RECRUIT = 1,
    MEMBER = 2,
    SIT = 3,
    STAFF = 4,
    SRSTAFF = 5,
    JRADMIN = 6,
    ADMIN = 7,
    IA = 8,
    HEADADMIN = 9,
    SUPER = 99,
}

export function isBotDeveloper(userID: string): boolean {
    return config.OwnerUserIDs?.includes(userID) ?? false;
}

export async function getPermissionLevel(userID: string): Promise<number> {
    if (isBotDeveloper(userID)) return PermissionLevels.SUPER;

    try {
        const guild: Guild = await client.guilds.fetch(config.guilds.mainGuild);
        const member: GuildMember = await guild.members.fetch(userID);

        const roles = member.roles.cache;

        if (roles.has(config.roles.leadership)) return PermissionLevels.HEADADMIN;
        if (roles.has(config.roles.ia)) return PermissionLevels.IA;
        if (roles.has(config.roles.admin)) return PermissionLevels.ADMIN;
        if (roles.has(config.roles.jadmin)) return PermissionLevels.JRADMIN;
        if (roles.has(config.roles.sstaff)) return PermissionLevels.SRSTAFF;
        if (roles.has(config.roles.staff)) return PermissionLevels.STAFF;
        if (roles.has(config.roles.sit)) return PermissionLevels.SIT;
        if (roles.has(config.roles.member)) return PermissionLevels.MEMBER;
        // if ( // not used currently
        //     roles.has(config.r.CIV) ||
        //     roles.has(config.recruitRoles.LEO) ||
        //     roles.has(config.recruitRoles.FIRE) ||
        //     roles.has(config.recruitRoles.COMMS)
        // ) return PermissionLevels.RECRUIT;

        return PermissionLevels.NOBODY;
    } catch (err) {
        return PermissionLevels.NOBODY;
    }
}

export async function hasPermissionLevel(userID: string, minLevel: number): Promise<boolean> {
    const level = await getPermissionLevel(userID);
    return level >= minLevel;
}
