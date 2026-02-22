import { Client, TextChannel, Message, EmbedBuilder, ColorResolvable } from "discord.js";
import axios from "axios";
import config from "../config";

type FiveMPlayer = {
  id: number;
  name: string;
  ping: number;
};

type FiveMInfo = {
  vars?: {
    sv_maxClients?: string;
    sv_maxclients?: string;
  };
};

module.exports = {
  name: "ready",
  once: true,

  async execute(client: Client) {
    const http = axios.create({ timeout: 10000 });

    async function getChannel(): Promise<TextChannel | null> {
      const channel = await client.channels
        .fetch(config.channels.serverstatus)
        .catch(() => null);

      if (!channel || !channel.isTextBased()) return null;
      return channel as TextChannel;
    }

    async function findBotMessage(channel: TextChannel): Promise<Message | null> {
      const messages = await channel.messages
        .fetch({ limit: 20 })
        .catch(() => null);

      if (!messages) return null;
      return messages.find(m => m.author.id === client.user?.id) ?? null;
    }

    async function updateStatus() {
      const channel = await getChannel();
      if (!channel) return;

      let players: FiveMPlayer[] = [];
      let maxPlayers = 0;
      let online = false;

      try {
        const [playersRes, infoRes] = await Promise.all([
          http.get<FiveMPlayer[]>(`http://${config.server.fivemip}/players.json`),
          http.get<FiveMInfo>(`http://${config.server.fivemip}/info.json`)
        ]);

        players = Array.isArray(playersRes.data) ? playersRes.data : [];

        const vars = infoRes.data?.vars ?? {};
        maxPlayers = Number(
          vars.sv_maxClients ?? vars.sv_maxclients ?? 0
        );

        online = true;
      } catch {
        online = false;
      }

      const playerCount = players.length;

      const visiblePlayers = players.slice(0, 5);

      while (visiblePlayers.length < 5) {
        visiblePlayers.push({
          id: 0,
          name: "Empty Slot",
          ping: 0
        });
      }

      const playerList = visiblePlayers
        .map(p =>
          p.name === "Empty Slot"
            ? "• Empty Slot"
            : `• ${p.name} (${p.ping}ms)`
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(config.server.name)
        .setColor(config.bot.settings.embedcolor as ColorResolvable)
        .setThumbnail(config.server.logo)
        .addFields(
          {
            name: "Status",
            value: `\`\`\`${online ? "🟢 Online" : "🔴 Offline"}\`\`\``,
          },
          {
            name: "Clients",
            value: `\`\`\`${playerCount} / ${maxPlayers}\`\`\``,
          },
          {
            name: "Players List (Truncated)",
            value: `\`\`\`\n${playerList}\n\`\`\``,
          }
        )
        .setFooter({ text: `Updated every minute`, iconURL: config.server.logo })
        .setTimestamp();

      const existing = await findBotMessage(channel);

      if (existing) {
        await existing.edit({ embeds: [embed] }).catch(() => {});
      } else {
        await channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    await updateStatus();
    setInterval(updateStatus, 60000);
  },
};
