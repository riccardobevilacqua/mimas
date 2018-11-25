import * as Eris from 'eris';
import { token } from './token';
import { IGuildInfo } from './interfaces';
import { getVoiceChannelClones, getEmptyVoiceChannelClones, hasCloningPermissions, getUserMember } from './util';

const client: Eris.Client = new Eris.Client(token);
let guildList: IGuildInfo[] = [];

const cloneVoiceChannel = (voiceChannel: Eris.VoiceChannel) => {
    try {
        let cloningLock: boolean = guildList.find((guildInfo: IGuildInfo) => guildInfo.id === voiceChannel.guild.id).cloningLock;
        if (!!voiceChannel && voiceChannel.voiceMembers.size > 0 && getEmptyVoiceChannelClones(voiceChannel).length < 1 && hasCloningPermissions(voiceChannel, client.user) && !cloningLock) {
            guildList.map((guildInfo: IGuildInfo) => {
                if (guildInfo.id === voiceChannel.guild.id) {
                    guildInfo.cloningLock = true;
                }

                return guildInfo;
            });
            
            voiceChannel.guild
                .createChannel(voiceChannel.name, '2', voiceChannel.parentID)
                .then((channel: Eris.AnyGuildChannel) => {
                    channel.editPosition(voiceChannel.position);
                })
                .then(() => {
                    guildList.map((guildInfo: IGuildInfo) => {
                        if (guildInfo.id === voiceChannel.guild.id) {
                            guildInfo.cloningLock = true;
                        }
        
                        return guildInfo;
                    });
                })
                .catch((error) => console.log(error));
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
                cloningLock: false
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

            cloneVoiceChannel(newVoiceChannel);

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