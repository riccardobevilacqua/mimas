import * as Discord from 'discord.js';
import { token } from './token';

const client: Discord.Client = new Discord.Client();

const getVoiceChannelClones = (voiceChannel: Discord.VoiceChannel): Discord.Collection<string, Discord.GuildChannel> => {
    return voiceChannel.guild.channels
        .filter((channel: Discord.GuildChannel) => channel.type === 'voice')
        .filter((channel: Discord.VoiceChannel) => channel.name === voiceChannel.name && channel.id !== voiceChannel.id);
};

const getEmptyVoiceChannelClones = (voiceChannel: Discord.VoiceChannel): Discord.Collection<string, Discord.GuildChannel> => {
    return getVoiceChannelClones(voiceChannel).filter((channel: Discord.VoiceChannel) => channel.members.size < 1);
};

const cloneVoiceChannel = (voiceChannel: Discord.VoiceChannel) => {
    if (!!voiceChannel && voiceChannel.members.size > 0 && getEmptyVoiceChannelClones(voiceChannel).size < 1) {
        voiceChannel.clone()
            .then((clonedChannel: Discord.VoiceChannel) => {
                clonedChannel.setParent(voiceChannel.parentID);
                clonedChannel.edit({
                    userLimit: voiceChannel.userLimit,
                    position: voiceChannel.position + 1
                });
            })
            .catch((error: Error) => console.log(error));
    }
};

client.once('ready', () => {
    console.log('Ready!');
    client.guilds.forEach((guild: Discord.Guild) => {
        if (guild.available) {
            guild.channels.filter((channel: Discord.Channel) => channel.type === 'voice')
                .forEach((voiceChannel: Discord.GuildChannel) => {
                    voiceChannel.edit({position: (voiceChannel.position + 1) * 100});
                });
        }
    });
});

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    const newVoiceChannel: Discord.VoiceChannel = newMember.voiceChannel;
    const oldVoiceChannel: Discord.VoiceChannel = oldMember.voiceChannel;
    
    cloneVoiceChannel(newVoiceChannel);

    if (!!oldVoiceChannel && oldVoiceChannel.members.size < 1 && getEmptyVoiceChannelClones(oldVoiceChannel).size > 0) {
        oldVoiceChannel.delete();
    }
});

client.login(token);