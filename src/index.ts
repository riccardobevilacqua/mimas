import * as Eris from 'eris';
import { token } from './token';
import { ClientChannelManager } from './clientChannelManager';

const client: ClientChannelManager = new ClientChannelManager(token);

client.on('voiceChannelJoin', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel): void => {
    try {
        client.cloneVoiceChannel(newVoiceChannel);
    } catch(error) {
        console.log(error);
    }
});

client.on('voiceChannelLeave', (member: Eris.Member, oldVoiceChannel: Eris.VoiceChannel): void => {
    try {
        client.removeCloneVoiceChannel(oldVoiceChannel);
    } catch(error) {
        console.log(error);
    }
});

client.on('voiceChannelSwitch', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel, oldVoiceChannel: Eris.VoiceChannel): void => {
    try {
        client.cloneVoiceChannel(newVoiceChannel);
        client.removeCloneVoiceChannel(oldVoiceChannel);
    } catch(error) {
        console.log(error);
    }
});

client.on('guildCreate', (guild: Eris.Guild) => {
    if (!guild.unavailable) {
        console.log(`Mimas joined ${guild.name}`);
    }
});

client.on('guildDelete', (guild: Eris.Guild) => {
    try {
        client.removeGuild(guild.id);
    
        console.log(`Mimas left ${guild.name}`);
    } catch(error) {
        console.log(error);
    }
});

client.on('ready', () => console.log('Ready!'));

client.connect();