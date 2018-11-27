import * as Eris from 'eris';
import { GuildRegistry } from './guildRegistry';

export class ClientChannelManager extends Eris.Client {
    private guildRegistry: GuildRegistry = new GuildRegistry()

    constructor(token: string) {
        super(token);
    }

    getVoiceChannelClones(voiceChannel: Eris.VoiceChannel): Eris.VoiceChannel[] {
        return <Eris.VoiceChannel[]>voiceChannel.guild.channels
            .filter((channel: Eris.AnyGuildChannel) => {
                return channel.type === 2 && channel.name === voiceChannel.name && channel.id !== voiceChannel.id
            });
    }
    
    getEmptyVoiceChannelClones(voiceChannel: Eris.VoiceChannel): Eris.VoiceChannel[] {
        return this.getVoiceChannelClones(voiceChannel)
            .filter((channel: Eris.VoiceChannel) => channel.voiceMembers.size < 1);
    }
    
    hasCloningPermissions(voiceChannel: Eris.VoiceChannel, user: Eris.User): boolean {
        const clientMember: Eris.Member = this.getUserMember(voiceChannel.guild, user);
        let result = false;
    
        if (voiceChannel.permissionsOf(clientMember.id).has('manageChannels')) {
            result = true;
        }
    
        return result;
    }
    
    getUserMember(guild: Eris.Guild, user: Eris.User): Eris.Member {
        return guild.members.find((member: Eris.Member) => member.user === user);
    }

    sortChannels(guild: Eris.Guild): void {
        const voiceChannels: Eris.VoiceChannel[] = <Eris.VoiceChannel[]>guild.channels
            .filter((channel: Eris.AnyGuildChannel) => channel.type === 2)
            .sort((a: Eris.AnyGuildChannel, b: Eris.AnyGuildChannel) => {
                let result: number = 0;

                if (a.createdAt < b.createdAt) {
                    result = -1;
                } else if (a.createdAt > b.createdAt) {
                    result = 1;
                }

                return result;
            });

        const uniqueVoiceChannels: string[] = [...new Set(voiceChannels)]
            .map((voiceChannel: Eris.VoiceChannel) => {
                return voiceChannel.name;
            });

        voiceChannels.forEach((channel: Eris.VoiceChannel) => {
            const basePosition: number = uniqueVoiceChannels.indexOf(channel.name);

            channel.editPosition(basePosition + 1);
        });
    }

    cloneVoiceChannel(voiceChannel: Eris.VoiceChannel): void {
        try {
            const self: ClientChannelManager = this;
            if (!!voiceChannel) {
                self.guildRegistry.addGuild(voiceChannel.guild.id);
                const registeredGuild = self.guildRegistry.findGuild(voiceChannel.guild.id);
                        
                if (voiceChannel.voiceMembers.size > 0 
                    && self.getEmptyVoiceChannelClones(voiceChannel).length < 1 
                    && self.hasCloningPermissions(voiceChannel, self.user) 
                    && !registeredGuild.cloningLock) {
                    this.guildRegistry.toggleCloningLock(registeredGuild.id);
        
                    self.createChannel(registeredGuild.id, voiceChannel.name, 2, null, voiceChannel.parentID)
                        .then((channel: Eris.AnyGuildChannel) => {
                            (<Eris.VoiceChannel>channel).edit({
                                userLimit: voiceChannel.userLimit
                            });

                            self.sortChannels(channel.guild);
                            self.guildRegistry.toggleCloningLock(registeredGuild.id)
                        })
                        .catch((error) => console.log(error));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    removeCloneVoiceChannel(voiceChannel: Eris.VoiceChannel): void {
        try {
            if (!!voiceChannel) {
                if (!!voiceChannel && voiceChannel.voiceMembers.size < 1 && this.getEmptyVoiceChannelClones(voiceChannel).length > 0) {
                    voiceChannel.delete();
                }
            }
        } catch(error) {
            console.log(error);
        }
    }

    removeGuild(id: string): void {
        this.guildRegistry.removeGuild(id);
    }
}