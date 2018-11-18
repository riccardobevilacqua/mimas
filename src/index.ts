import * as Discord from 'discord.js';
import { token } from './token';

const client: Discord.Client = new Discord.Client();

client.once('ready', () => console.log('Ready!'));

client.on('message', (message: Discord.Message): void => {
    if (message.content === '!channels') {
        client.channels
            .filter((channel: Discord.Channel) => channel.type === 'voice')
            .forEach((channel: Discord.Channel) => {
                message.channel.send(channel.id + ' | ' + channel.type);
            });
    }
});

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    if (oldMember.voiceChannel === undefined && newMember.voiceChannel !== undefined) {
        console.log('A user has just joined channel ' + newMember.voiceChannelID);
    } else if (newMember.voiceChannel === undefined) {
        console.log('A user has just left channel ' + newMember.voiceChannelID);
    }
});

client.login(token);