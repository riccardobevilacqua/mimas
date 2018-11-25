import * as Eris from 'eris';

export function getVoiceChannelClones(voiceChannel: Eris.VoiceChannel): Eris.AnyGuildChannel[] {
    return voiceChannel.guild.channels
        .filter((channel: Eris.AnyGuildChannel) => channel.type === 2)
        .filter((channel: Eris.AnyGuildChannel) => channel.name === voiceChannel.name && channel.id !== voiceChannel.id);
};

export function getEmptyVoiceChannelClones(voiceChannel: Eris.VoiceChannel): Eris.AnyGuildChannel[] {
    return getVoiceChannelClones(voiceChannel)
        .filter((channel: Eris.AnyGuildChannel) => (<Eris.VoiceChannel>channel).voiceMembers.size < 1);
};

export function hasCloningPermissions(voiceChannel: Eris.VoiceChannel, user: Eris.User): boolean {
    const clientMember: Eris.Member = getUserMember(voiceChannel.guild, user);
    let result = false;

    if (voiceChannel.permissionsOf(clientMember.id).has('manageChannels')) {
        result = true;
    }

    return result;
};

export function getUserMember(guild: Eris.Guild, user: Eris.User): Eris.Member {
    return guild.members.find((member: Eris.Member) => member.user === user);
}