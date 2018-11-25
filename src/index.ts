import * as Eris from 'eris';
import { token } from './token';
import { IGuildInfo } from './interfaces';
import { getVoiceChannelClones, getEmptyVoiceChannelClones, hasCloningPermissions, getUserMember } from './util';

const client: Eris.Client = new Eris.Client(token);
let guildList: IGuildInfo[] = [];

const cloneVoiceChannel = (voiceChannel: Eris.VoiceChannel) => {
    try {
        if (!!voiceChannel && voiceChannel.voiceMembers.size > 0 && getEmptyVoiceChannelClones(voiceChannel).length < 1 && !cloningLock && hasCloningPermissions(voiceChannel, client.user)) {
            // cloningLock = true;

            // voiceChannel.clone()
            //     .then((clonedChannel: Discord.VoiceChannel) => {
            //         clonedChannel.setParent(voiceChannel.parentID);
            //         clonedChannel.edit({
            //             userLimit: voiceChannel.userLimit,
            //             position: voiceChannel.position
            //         });
            //     })
            //     .then(() => cloningLock = false)
            //     .catch((error: Error) => console.log(error));
        }
    } catch (error) {
        console.log(error);
    }
};

client.on('guildCreate', (guild: Eris.Guild) => {
    if (!guild.unavailable) {
        console.log(`Mimas joined ${guild.name}`);

        if (guildList.findIndex((guildInfo: IGuildInfo) => guildInfo.id === guild.id) === -1) {
            guildList.push({
                id: guild.id,
                channelLock: false
            });
        }
    }
});

client.on('guildDelete', (guild: Eris.Guild) => {
    try {
        const guildIndex: number = guildList.findIndex((guildInfo: IGuildInfo) => guildInfo.id === guild.id);
    
        console.log(`Mimas left ${guild.name}`);
        
        if (guildIndex > -1) {
            guildList.splice(guildIndex, 1);
        }
    } catch(error) {
        console.log(error);
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

client.on('ready', () => console.log('Ready!'));

client.connect();