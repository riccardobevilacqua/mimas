import * as Eris from 'eris';
import { token } from './token';
import { IGuildInfo } from './interfaces';
import { GuildRegistry } from './guildRegistry';
import { getVoiceChannelClones, getEmptyVoiceChannelClones, hasCloningPermissions, getUserMember } from './util';

const client: Eris.Client = new Eris.Client(token);
const guildRegistry: GuildRegistry = new GuildRegistry();

const cloneVoiceChannel = (voiceChannel: Eris.VoiceChannel): void => {
    try {
        if (!!voiceChannel) {
            guildRegistry.addGuild(voiceChannel.guild.id);
            const registeredGuild = guildRegistry.findGuild(voiceChannel.guild.id);
                    
            if (voiceChannel.voiceMembers.size > 0 
                && getEmptyVoiceChannelClones(voiceChannel).length < 1 
                && hasCloningPermissions(voiceChannel, client.user) 
                && !registeredGuild.cloningLock) {
                guildRegistry.toggleCloningLock(registeredGuild.id);
    
                client.createChannel(registeredGuild.id, voiceChannel.name, 2, null, voiceChannel.parentID)
                    .then((channel: Eris.AnyGuildChannel) => {
                        (<Eris.VoiceChannel>channel).edit({
                            userLimit: voiceChannel.userLimit
                        });
                        // channel.editPosition(voiceChannel.position);
                    })
                    .then(() => {
                        guildRegistry.toggleCloningLock(registeredGuild.id);
                    })
                    .catch((error) => console.log(error));
            }
        }
    } catch (error) {
        console.log(error);
    }
};

const removeCloneVoiceChannel = (voiceChannel: Eris.VoiceChannel): void => {
    try {
        if (!!voiceChannel) {
            if (!!voiceChannel && voiceChannel.voiceMembers.size < 1 && getEmptyVoiceChannelClones(voiceChannel).length > 0) {
                voiceChannel.delete();
            }
        }
    } catch(error) {
        console.log(error);
    }
}

client.on('voiceChannelJoin', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel): void => {
    try {
        cloneVoiceChannel(newVoiceChannel);
    } catch(error) {
        console.log(error);
    }
});

client.on('voiceChannelLeave', (member: Eris.Member, oldVoiceChannel: Eris.VoiceChannel): void => {
    try {
        removeCloneVoiceChannel(oldVoiceChannel);
    } catch(error) {
        console.log(error);
    }
});

client.on('voiceChannelSwitch', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel, oldVoiceChannel: Eris.VoiceChannel): void => {
    try {
        cloneVoiceChannel(newVoiceChannel);
        removeCloneVoiceChannel(oldVoiceChannel);
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
        guildRegistry.removeGuild(guild.id);
    
        console.log(`Mimas left ${guild.name}`);
    } catch(error) {
        console.log(error);
    }
});

client.on('ready', () => console.log('Ready!'));

client.connect();