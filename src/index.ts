import * as Discord from 'discord.js';
import { token } from './token';

const client = new Discord.Client();

client.once('ready', () => console.log('Ready!'));

client.on('message', message => {
    if (message.content === '!channels') {
        client.channels
            .filter(channel => channel.type === 'voice')
            .forEach(channel => {
                message.channel.send(channel.id + ' | ' + channel.type);
            });
    }
});

client.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel


    if(oldUserChannel === undefined && newUserChannel !== undefined) {
        console.log('A user has just joined channel ' + newMember.voiceChannelID);
    } else if(newUserChannel === undefined){
        console.log('A user has just left channel ' + newMember.voiceChannelID);
    }
});

client.login(token);