import * as Http from 'http';
import * as Dotenv from 'dotenv';
import * as Discord from 'discord.js';
import { ClientChannelManager } from './clientChannelManager';

Dotenv.config();
Http.createServer().listen(3000);

const client: ClientChannelManager = new ClientChannelManager();

client.on('voiceStateUpdate', (oldState: Discord.VoiceState, newState: Discord.VoiceState) => {
    try {
        if (newState.channel !== oldState.channel) {
            if (newState.channel) {
                client.cloneVoiceChannel(newState.channel);
            }
            
            if (oldState.channel) {
                client.removeCloneVoiceChannel(oldState.channel);
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