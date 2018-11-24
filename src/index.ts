import * as Eris from 'eris';
import { token } from './token';

const client: Eris.Client = new Eris.Client(token);

const getVoiceChannelClones = (voiceChannel: Eris.VoiceChannel): Eris.AnyGuildChannel[] => {
    return voiceChannel.guild.channels
        .filter((channel: Eris.AnyGuildChannel) => channel.type === 2)
        .filter((channel: Eris.AnyGuildChannel) => channel.name === voiceChannel.name && channel.id !== voiceChannel.id);
};

const getEmptyVoiceChannelClones = (voiceChannel: Eris.VoiceChannel): Eris.AnyGuildChannel[] => {
    return getVoiceChannelClones(voiceChannel)
        .filter((channel: Eris.AnyGuildChannel) => (<Eris.VoiceChannel>channel).voiceMembers.size < 1);
};

const getClientMember = (guild: Eris.Guild): Eris.Member => {
    return guild.members.find((member: Eris.Member) => member.user === client.user);
}

const hasCloningPermissions = (voiceChannel: Eris.VoiceChannel): boolean => {
    const clientMember: Eris.Member = getClientMember(voiceChannel.guild);
    let result = false;

    if (voiceChannel.permissionsOf(clientMember.id).has('MANAGE_CHANNELS')) {
        result = true;
    }

    return result;
};

client.on('ready', () => console.log('Ready!'));

client.on('guildCreate', (guild: Eris.Guild) => {
    if (!guild.unavailable) {
        console.log(`Mimas joined ${guild.name}`);
    }
});

client.on('voiceStateUpdate', (member: Eris.Member, oldState: Eris.VoiceState): void => {
    try {
        if (!!member.voiceState.channelID) {
            const newVoiceChannel: Eris.VoiceChannel = <Eris.VoiceChannel>client.getChannel(member.voiceState.channelID);
            const oldVoiceChannel: Eris.VoiceChannel = <Eris.VoiceChannel>client.getChannel(oldState.channelID);

            // cloneVoiceChannel(newVoiceChannel);

            if (!!oldVoiceChannel && oldVoiceChannel.voiceMembers.size < 1 && getEmptyVoiceChannelClones(oldVoiceChannel).length > 0) {
                oldVoiceChannel.delete();
            }
        }
    } catch(error) {
        console.log(error);
    }
});

client.connect();