import { QueryProtocol, ResponseError, TeamSpeak, TeamSpeakClient } from 'ts3-nodejs-scentral';
import {
    ClientMoved,
} from 'ts3-nodejs-scentral/lib/types/Events';
import { Logger } from '../index';
import config from '../config';
let tsClient: TeamSpeak;

export async function startNewTs3Bot(): Promise<void> {
    if (!config.features.teamspeak) return;
    Logger.warn('TS3 | Starting');
    tsClient = await TeamSpeak.connect({
        host: config.ts3.host,
        protocol: QueryProtocol.RAW,
        queryport: config.ts3.queryport,
        serverport: config.ts3.serverport,
        username: config.ts3.username,
        password: config.ts3.password,
    });

    tsClient.on('flooding', () => {
        Logger.info('TS3 | Flooding!');
    });
    tsClient.on('clientmoved' as never, clientMoved as never);

    setInterval(updateRTOChannelLimits, 60000);
    setInterval(checkAllMuteTags, 60000);
    checkAllMuteTags();
    tsClient
    .clientUpdate({ clientNickname: config.ts3.nickname })
    .catch((err: ResponseError) => {
        if (Number(err.id) === 513)
            tsClient.clientUpdate({
                clientNickname: `${config.ts3.nickname}${Math.floor(
                    Math.random() * 257
                )}`,
            });
        else Logger.error(err);
    });
    Logger.info('TS3 | Bot Online');
}

async function clientMoved(eventData: ClientMoved): Promise<void> {
    /* Update RTO Channel Limits */ void updateRTOChannelLimits();
    const toPokeDbIds: Array<number> = [];

    if (eventData.channel.name.toLowerCase().includes('waiting room')) {
        const parentChannelId = eventData.channel.pid;

        const allClients = await tsClient.clientList();
        const clientsInParent = allClients.filter(
            (client) => Number(client.cid) === Number(parentChannelId)
        );

        if (clientsInParent.length === 0) {
            await tsClient.clientPoke(
                eventData.client,
                "[color=red]The person you're looking for isn't online![/color]"
            );
            return;
        }

        for (const client of clientsInParent) {
            await tsClient.clientPoke(
                client,
                '[i][color=red] Someone is in your waiting room![/color][/i]'
            );
        }

        await tsClient.clientPoke(
            eventData.client,
            '[i][color=green]The person in the office has been notified.[/color][/i]'
        );
    }

    if (
        config.ts3.fastTravelChannels &&
        config.ts3.fastTravelChannels[1] &&
        Number(eventData.channel.cid) === config.ts3.fastTravelChannels[0]
    ) {
        await tsClient.clientMove(
            eventData.client,
            String(config.ts3.fastTravelChannels[1]),
            '',
            true
        );
    }
}



async function checkAllMuteTags(): Promise<void> {
    const allClients = (await tsClient.clientList());
    for(const client of allClients) {
        const newClient = client as TeamSpeakClient;
        if(await hasMuteTag(newClient.uniqueIdentifier) && !config.ts3.whitelistedChannelIds.includes(Number(newClient.cid)) && !config.ts3.whitelistedWaitingRoomIds.includes(Number(newClient.cid))) {
            newClient.poke("You have a tag requiring your attention!");
        }
    }
}

export async function hasMuteTag(uniqueId: string): Promise<boolean> {
    const client = await tsClient.getClientByUid(uniqueId);
    if (!client) return Promise.reject('NO_CLIENT');
    const clientServerGroups =
        typeof client !== 'number'
            ? client.servergroups.map((x) => Number(x))
            : (await tsClient.serverGroupsByClientId(client as never)).map(
                  (x) => Number(x.sgid)
              );
    if(clientServerGroups.includes(config.ts3.groupIDs["SEESTAFF"] ?? 0) || clientServerGroups.includes(config.ts3.groupIDs["SEEADMIN"] ?? 0) || clientServerGroups.includes(config.ts3.groupIDs["SEEHA"] ?? 0) || clientServerGroups.includes(config.ts3.groupIDs["SEEIA"] ?? 0)) {
        return true;
    }
    return false;
}

/**
 * Sets the AOP in the specified server
 * @param aop New AOP to set
 * @param setBy Person the AOP was set by
 * @param server Server to set the AOP for | Default: server1
 */
export async function setAOP(
    aop: string,
    setBy?: string,
    server?: 's1' | 's2'
): Promise<void> {
        if (!config.features.teamspeak) return;
    if (config.ts3.aopChannels) {
        if (aop.length > 26) return Promise.reject('TOO_LONG_AOP');
        const serverSelection = config.ts3.aopChannels[server ?? 's1'];
        if (serverSelection)
            await tsClient.channelEdit(
                String(
                    (
                        await tsClient.getChannelById(String(serverSelection))
                    )?.cid
                ),
                {
                    channelName: `[cspacer]AOP: ${aop}`,
                    channelDescription: `[center][b][size=14]AOP: ${aop}[/b]\n[b][size=12]Set By: ${
                        setBy ?? 'N/A'
                    }`,
                }
            );
    } else return Promise.reject('NO_AOP_CONFIG');
}

/**
 * Adds a "See X" group to the specified user by Unique ID
 * @param uniqueID Teamspeak3 Unique Identifier
 * @param groupType The "see group" to add, or none
 */
export async function addActionGroup(
    uniqueID: string,
    groupType: 'SEESTAFF' | 'SEEADMIN' | 'SEEHA' | 'SEEIA' | 'NONE'
): Promise<void> {
    const client = await tsClient.getClientByUid(uniqueID);
    if (!client) return Promise.reject('NO_CLIENT');
    const clientServerGroups =
        typeof client !== 'number'
            ? client.servergroups.map((x) => Number(x))
            : (await tsClient.serverGroupsByClientId(client as never)).map(
                  (x) => Number(x.sgid)
              );
    let seeGroupID: number | 'NONE';
    if (
        groupType != 'NONE' &&
        Object.keys(config.ts3.groupIDs).includes(groupType)
    ) {
        seeGroupID =
            config.ts3.groupIDs[
                groupType as keyof { [key: string]: number }
            ] ?? 'NONE';
    } else seeGroupID = 'NONE';
    for (const groupID of clientServerGroups) {
        if (
            Object.keys(config.ts3.groupIDs).find(
                (key) =>
                    config.ts3.groupIDs[key] === groupID &&
                    key.startsWith('SEE')
            ) &&
            groupType === 'NONE'
        )
            await tsClient.serverGroupDelClient(
                client as never,
                String(groupID)
            );
    }
    if (seeGroupID && seeGroupID != 'NONE') {
        await tsClient.serverGroupAddClient(
            client as never,
            String(seeGroupID)
        );
    }
}

export async function addQueueBypassGroup(uniqueId: string): Promise<void> {
    const client = await tsClient.getClientByUid(uniqueId);
    if (!client) return Promise.reject('NO_CLIENT');
    tsClient
        .serverGroupAddClient(
            client as never,
            String(config.ts3.groupIDs['QUEUEBYPASS'])
        )
        .catch((err) => {
            return Promise.reject(err);
        });
}

export async function removeQueueBypassGroup(uniqueId: string): Promise<void> {
    const client = await tsClient.getClientByUid(uniqueId);
    if (!client) return Promise.reject('NO_CLIENT');
    tsClient
        .serverGroupDelClient(
            client as never,
            String(config.ts3.groupIDs['QUEUEBYPASS'])
        )
        .catch((err) => {
            return Promise.reject(err);
        });
}

/**
 * Generates a temporary TS3 Password that lasts 5 minutes from creation
 * @returns Temporary Password
 */
export async function generateTempTSPassword(): Promise<string> {
    const tempPassword = Math.random().toString(36).slice(-8);
    await tsClient.serverTempPasswordAdd({
        pw: tempPassword,
        desc: 'Automatically generated password',
        duration: 300 /* 5 Minutes */,
    });
    Logger.warn(`TS3 | Generated Password ${tempPassword}`);
    return Promise.resolve(tempPassword);
}

/**
 * Removes all tags except server admin from a user
 * @param uniqueID UniqueID to find user
 */
export async function resetUser(uniqueID: string): Promise<void> {
    const client = await tsClient.getClientByUid(uniqueID);
    if (!client) return Promise.reject('NO_CLIENT');
    const clientServerGroups =
        typeof client !== 'number'
            ? client.servergroups.map((x) => Number(x))
            : (await tsClient.serverGroupsByClientId(client as never)).map(
                  (x) => Number(x.sgid)
              );
    if (clientServerGroups.length === 0) return;
    for (const serverGroupID of clientServerGroups) {
        if (serverGroupID === 9 || serverGroupID === 10) continue;
        await tsClient.serverGroupDelClient(
            client as never,
            String(serverGroupID)
        );
    }
}

/**
 * Check if the mentioned user is dispatching in *any* channel
 * @param uniqueID UniqueID of user to check
 */
export async function isDispatching(uniqueID: string): Promise<boolean> {
    const client = await tsClient.getClientByUid(uniqueID);
    if (!client || typeof client === 'number') return Promise.resolve(false);
    for (const nameTag of config.ts3.dispatchTags) {
        if (client.nickname.includes(nameTag)) return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

/**
 * Updates the limits to all RTO Channels based on dispatch count and base offset
 */
export async function updateRTOChannelLimits(): Promise<void> {
    const baseMaxCount = 32;
    if (config.ts3.RTOChannels) {
        for (const channelID of Array.from(
            Object.values(config.ts3.RTOChannels)
        )) {
            const channel = await tsClient.getChannelById(String(channelID));
            if (!channel) continue;
            let dispatchCount = 0;
            const channelClients = await channel.getClients();
            for (const channelClient of channelClients) {
                for (const nameTag of config.ts3.dispatchTags.concat(
                    config.ts3.addonTags ?? []
                )) {
                    if (
                        channelClient.nickname.toUpperCase().includes(nameTag)
                    ) {
                        dispatchCount++;
                    }
                }
            }
            if (channel.maxclients !== baseMaxCount + dispatchCount)
                await tsClient.channelEdit(channel, {
                    channelMaxclients: baseMaxCount + dispatchCount,
                });
        }
    } else return Promise.reject('NO_RTO_CONFIG');
}

function handleGenericError(error: ResponseError): [] {
    if (error.id) {
        switch (Number(error.id)) {
            case 1281:
                return [];
            default:
                Logger.error(
                    `TS3 | Came across unknown error while trying to handle generic errors! \n ${error}`
                );
                return [];
        }
    } else {
        Logger.error('TS3 | ');
        return [];
    }
}
