import * as Eris from 'eris';
import { token } from './token';
import { ClientChannelManager } from './clientChannelManager';

const client: ClientChannelManager = new ClientChannelManager(token);

client.on('messageCreate', (message: Eris.Message) => {
    if (message.content === '!channels') {
        const textChannel: Eris.TextChannel = (<Eris.TextChannel>message.channel);
        textChannel.guild.channels
            .filter((channel: Eris.AnyGuildChannel) => channel.type === 2)
            .forEach((channel: Eris.AnyGuildChannel) => 
                textChannel.createMessage(`${channel.name} -> POS [${channel.position}]`)
            );
    }
});

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
    try {
        if (!guild.unavailable) {
            console.log(`Mimas joined ${guild.name}`);
        }
    } catch(error) {
        console.log(error);
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