import * as Fetch from 'node-fetch';
import * as Discord from 'discord.js';
import { token } from './token';
import { config } from './config';

let cloningLock = false;
const client: Discord.Client = new Discord.Client();

const getVoiceChannelClones = (voiceChannel: Discord.VoiceChannel): Discord.Collection<string, Discord.GuildChannel> => {
    return voiceChannel.guild.channels
        .filter((channel: Discord.GuildChannel) => channel.type === 'voice')
        .filter((channel: Discord.VoiceChannel) => channel.name === voiceChannel.name && channel.id !== voiceChannel.id);
};

const getEmptyVoiceChannelClones = (voiceChannel: Discord.VoiceChannel): Discord.Collection<string, Discord.GuildChannel> => {
    return getVoiceChannelClones(voiceChannel).filter((channel: Discord.VoiceChannel) => channel.members.size < 1);
};

const hasCloningPermissions = (voiceChannel: Discord.VoiceChannel): boolean => {
    let result = false;

    if (voiceChannel.guild.member(client.user).permissions.has('MANAGE_CHANNELS')) {
        result = true;
    }

    return result;
};

const cloneVoiceChannel = (voiceChannel: Discord.VoiceChannel) => {
    try {
        if (!!voiceChannel && voiceChannel.members.size > 0 && getEmptyVoiceChannelClones(voiceChannel).size < 1 && !cloningLock && hasCloningPermissions(voiceChannel)) {
            cloningLock = true;

            voiceChannel.clone()
                .then((clonedChannel: Discord.VoiceChannel) => {
                    clonedChannel.setParent(voiceChannel.parentID);
                    clonedChannel.edit({
                        userLimit: voiceChannel.userLimit,
                        position: voiceChannel.position
                    });
                })
                .then(() => cloningLock = false)
                .catch((error: Error) => console.log(error));
        }
    } catch (error) {
        console.log(error);
    }
};

client.on('message', (message: Discord.Message) => {
    if (message.content === '!channels') {
        message.guild.channels.forEach((channel: Discord.GuildChannel) => message.channel.send(`${channel.name} - ${channel.position}`));
    }
});

client.on('guildCreate', (guild: Discord.Guild) => {
    if (guild.available) {
        console.log(`Mimas joined ${guild.name}`);
        // guild.channels.filter((channel: Discord.Channel) => channel.type === 'voice')
        //     .forEach((voiceChannel: Discord.GuildChannel) => {
        //         voiceChannel.edit({position: (voiceChannel.position + 1) * 100});
        //         console.log(`Channel: ${voiceChannel.name} Position: ${voiceChannel.position} Parent: ${voiceChannel.parent} ParentID: ${voiceChannel.parentID}`);
        //     });
    }
});

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    const newVoiceChannel: Discord.VoiceChannel = newMember.voiceChannel;
    const oldVoiceChannel: Discord.VoiceChannel = oldMember.voiceChannel;
    
    cloneVoiceChannel(newVoiceChannel);

    if (!!oldVoiceChannel && oldVoiceChannel.members.size < 1 && getEmptyVoiceChannelClones(oldVoiceChannel).size > 0) {
        oldVoiceChannel.delete();
    }
});

client.once('ready', () => console.log('Ready!'));

client.login(token);