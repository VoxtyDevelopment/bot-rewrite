# Vox Development Bot

A rewritten bot by Vox Development, built with TypeScript. This project is designed to be a rewrite of our last external security bot written in Javascript.

## Setup Instructions

1. Clone or Download the repository:
   ```
   git clone https://github.com/VoxtyDevelopment/bot-rewrite.git
   cd bot-rewrite
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the environment:
   - Open `src/config.ts` and set up the required configuration options:
     - **Discord Bot Token:** Add your bot token to connect to Discord.
     - **Database Configuration:** Set up MySQL credentials (host, user, password, database).
     - **Other Settings:** Change all of the Other required settings.
   - Save the file after making changes.

4. Build the project to JavaScript:
   ```
   npm run build
   ```
   This will compile the TypeScript code into JavaScript in the `dist` folder.

5. Run in development mode (TypeScript):
   ```
   npm run dev
   ```
   This will start the bot using TypeScript with live reloading.

6. If built in Javascript, run the compiled JavaScript:
   ```
   node dist/index.js
   ```

### Commands
The bot includes a variety of commands for server management. Below is a list of included commands:

- **Moderation:**
  - `clear` - Purges messages in a channel.
  - `massban` - Bans user from all guilds.
  - `masskick` - Kicks user from all guilds.
  - `massmute` - Mutes a users in all guilds.
  - `massunmute` - Unmutes a users in all guild.
  - `massunban` - Unbans user from all guilds.
  - `seeia` - Mutes a users in all guilds.
  - `resign` - Handle resignations.
    
- **Utility:**
  - `invite` - Generates a temp invites.
  - `lookup` - Lookup a user in the DB.
  - `serverstatus` - Check server status.
  - `onboard` - Onboard a user into the database.
  - `patrol` - Sends a patrol notification.
  - `transfer-user` - Transfer's a users department.
  - `massnick` - Changes nickname in all guilds.
  - `tspass` - Creates a Temporary TSPass.
  - `update-user` - Updates a user in the Database.

## Developers

- [@voxty](https://github.com/voxty)
- [@ebt-mhm](https://github.com/ebt-mhm)

--- 
