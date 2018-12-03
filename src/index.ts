import * as Http from 'http';
import * as Dotenv from 'dotenv';
import * as Discord from 'discord.js';
import { ClientChannelManager } from './clientChannelManager';

Dotenv.config();
Http.createServer().listen(3000);

const client: ClientChannelManager = new ClientChannelManager();

let token: string = process.env.TOKEN_DEV;

if (process.env.NODE_ENV === 'production') {
    token = process.env.TOKEN;
}

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => {
    try {    
        if (newMember.voiceChannel) {
            client.cloneVoiceChannel(newMember.voiceChannel);
        }
        
        if (oldMember.voiceChannel) {
            client.removeCloneVoiceChannel(oldMember.voiceChannel);
        }
    } catch(error) {
        console.log(error);
    }
});

client.on('guildCreate', (guild: Discord.Guild) => {
    try {
        if (guild.available) {
            console.log(`Mimas joined ${guild.name}`);
        }
    } catch(error) {
        console.log(error);
    }
});

client.on('guildDelete', (guild: Discord.Guild) => {
    try {
        client.removeGuild(guild.id);
    
        console.log(`Mimas left ${guild.name}`);
    } catch(error) {
        console.log(error);
    }
});

client.on('ready', () => console.log('Ready!'));

client.login(token);