import * as Discord from 'discord.js';
import { token } from './token';

const client: Discord.Client = new Discord.Client();

client.once('ready', () => console.log('Ready!'));

const getEmptyVoiceChannelClones = (voiceChannel: Discord.VoiceChannel): Discord.Collection<string, Discord.GuildChannel> => {
    return voiceChannel.guild.channels.filter((channel: Discord.VoiceChannel) => channel.name === voiceChannel.name && channel.id !== voiceChannel.id && voiceChannel.members.size < 1);
}

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    const newVoiceChannel: Discord.VoiceChannel = newMember.voiceChannel;
    const oldVoiceChannel: Discord.VoiceChannel = oldMember.voiceChannel;
    
    if (!!newVoiceChannel && newVoiceChannel.members.size > 0 && getEmptyVoiceChannelClones(newVoiceChannel).size < 1) {
        newVoiceChannel.clone()
            .then((clonedChannel: Discord.VoiceChannel) => {
                clonedChannel.setParent(newVoiceChannel.parentID);
                clonedChannel.setUserLimit(newVoiceChannel.userLimit);
            })
            .catch((error: Error) => console.log(error));
    }

    if (!!oldVoiceChannel && oldVoiceChannel.members.size < 1 && getEmptyVoiceChannelClones(oldVoiceChannel).size > 1) {
        oldVoiceChannel.delete();
    }
});

client.login(token);