import { TeamSpeak, QueryProtocol, TeamSpeakClient } from "ts3-nodejs-library";
import axios from "axios";
import config from "../config";
import { logToDiscord } from "../extra/utilites";
// im ngl vox i was too lazy to use the imports from utilites.ts
// and i really just ripped ur IP check code and put it in here and it worked
(async () => {
  try {
    const ts3 = await TeamSpeak.connect({
      host: config.ts3.host,
      queryport: config.ts3.queryport,
      serverport: config.ts3.serverport,
      username: config.ts3.username,
      password: config.ts3.password,
      nickname: config.ts3.nickname,
      protocol: QueryProtocol.RAW,
    });

    ts3.on("clientconnect", async (event) => {
      if (!event.client) return;

      const client: TeamSpeakClient = event.client;
      const ip = client.connectionClientIp;

      if (!ip) {
        console.warn(`No IP found for ${client.nickname} (${client.uniqueIdentifier})`);
        return;
      }

      try {
        const response = await axios.get(`https://v2.api.iphub.info/ip/${ip}`, {
          headers: {
            "X-Key": config.vpnApiKey, 
          },
        });

        if (response.data.block === 1 || response.data.block === 2) {
          await logToDiscord("VPN Detected - User Kicked", [
            { name: "Nickname", value: client.nickname, inline: true },
            { name: "IP Address", value: `||${ip}||`, inline: true },
            { name: "Unique ID", value: client.uniqueIdentifier, inline: false },
            { name: "Reason", value: "VPN/Proxy detected. Kicked from server.", inline: false },
          ]);

          await client.kickFromServer("VPNs are not allowed on this server.");
        } else {
          await logToDiscord("VPN Check Passed", [
            { name: "Nickname", value: client.nickname, inline: true },
            { name: "IP Address", value: `||${ip}||`, inline: true },
            { name: "Unique ID", value: client.uniqueIdentifier, inline: false },
          ]);
        }
      } catch (error) {
        console.error("Error checking VPN status:", error);
      }
    });
  } catch (error) {
    console.error("Failed to connect to TeamSpeak:", error);
  }
})();
