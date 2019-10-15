import * as Http from 'http';
import * as Dotenv from 'dotenv';
import * as Discord from 'discord.js';
import { ClientChannelManager } from './clientChannelManager';

Dotenv.config();
Http.createServer().listen(3000);

const client: ClientChannelManager = new ClientChannelManager();

client.on('voiceStateUpdate', (oldState: Discord.GuildMember, newState: Discord.GuildMember) => {
    try {
        if (newState.voiceChannelID !== oldState.voiceChannelID) {
            if (newState.voiceChannel) {
                client.cloneVoiceChannel(newState.voiceChannel);
            }
            
            if (oldState.voiceChannel) {
                client.removeCloneVoiceChannel(oldState.voiceChannel);
            }
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

client.login(process.env.TOKEN);