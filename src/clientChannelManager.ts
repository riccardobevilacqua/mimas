import * as Discord from 'discord.js';
import { GuildRegistry, IGuildInfo } from './guildRegistry';

export class ClientChannelManager extends Discord.Client {
    private guildRegistry: GuildRegistry = new GuildRegistry()

    getVoiceChannelClones(originalChannel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return <Discord.VoiceChannel[]>originalChannel.guild.channels
            .filter(item => {
                return item.type === 'voice' 
                    && item.name === originalChannel.name 
                    && item.id !== originalChannel.id 
                    && item.parentID === originalChannel.parentID
            })
            .array();
    }
    
    getEmptyVoiceChannelClones(voiceChannel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return this.getVoiceChannelClones(voiceChannel).filter(item => item.members.size === 0);
    }
    
    hasPermissions(voiceChannel: Discord.VoiceChannel): boolean {
        const categoryPermissions: Readonly<Discord.Permissions> = voiceChannel.parent.permissionsFor(this.user);
        const channelPermissions: Readonly<Discord.Permissions> = voiceChannel.permissionsFor(this.user);
        
        if (categoryPermissions.has('MANAGE_CHANNELS') && channelPermissions.has('VIEW_CHANNEL')) {
            return true;
        }
    
        return false;
    }

    comparePosition(a: Discord.GuildChannel, b: Discord.GuildChannel): number {
        if (a.position < b.position) {
            return -1;
        } else if (a.position > b.position) {
            return 1;
        }

        return 0;
    }

    getCategoryVoiceChannels(channel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return <Discord.VoiceChannel[]>channel.parent.children
            .array()
            .filter(guildChannel => guildChannel.type === 'voice')
            .sort(this.comparePosition);
    }

    getUniqueChannels(channel: Discord.VoiceChannel): string[] {
        const categoryChannelNames: string[] = this
            .getCategoryVoiceChannels(channel)
            .map(item => item.name);
        return [...new Set(categoryChannelNames)];
    }

    getLastVoiceChannelClone(voiceChannel: Discord.VoiceChannel): Discord.VoiceChannel {
        const categoryVoiceChannels: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];

        return categoryVoiceChannels.filter(item => item.id !== voiceChannel.id && item.name === voiceChannel.name && item.members.size > 0).pop();
    }

    async injectVoiceChannel(voiceChannel: Discord.VoiceChannel, previousChannels: string[]) {
        const categoryVoiceChannels: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];
        const categoryEmptyVoiceChannels: Discord.VoiceChannel[] = [...categoryVoiceChannels.filter(item => item.members.size === 0)];
        const categoryPopulatedVoiceChannels: Discord.VoiceChannel[] = [...categoryVoiceChannels.filter(item => item.members.size > 0)];

        const lastVoiceChannelClone: Discord.VoiceChannel = this.getLastVoiceChannelClone(voiceChannel);

        if (categoryPopulatedVoiceChannels.length === 1) {
            // voiceChannel is the only populated one therefore slides to last position
            voiceChannel.edit({position: categoryVoiceChannels.pop().position + 1});
        } else if (lastVoiceChannelClone) {
            // voiceChannel slides beneath its last populated clone
            voiceChannel.edit({position: lastVoiceChannelClone.position + 1});
        } else {
            if (previousChannels.length === 0) {
                // voiceChannel slides beneath empty channels if no populated previous channel exists
                voiceChannel.edit({position: categoryEmptyVoiceChannels.pop().position + 1});
            } else {
                const probe: string = previousChannels.pop();
                const eligibleVoiceChannels: Discord.VoiceChannel[] = categoryPopulatedVoiceChannels.filter(item => item.name === probe);
    
                if (eligibleVoiceChannels.length > 0) {
                    // voice channel slides beneath the last clone of a populated previous channel
                    voiceChannel.edit({position: eligibleVoiceChannels.pop().position + 1});
                } else {
                    // recursed call to this method
                    this.injectVoiceChannel(voiceChannel, previousChannels);
                }
            }
        }
    }

    moveJoinedChannel(voiceChannel: Discord.VoiceChannel): void {
        const uniqueChannels: string[] = this.getUniqueChannels(voiceChannel);
        const previousChannels: string[] = uniqueChannels.slice(0, uniqueChannels.indexOf(voiceChannel.name));
        
        this.injectVoiceChannel(voiceChannel, previousChannels);
    }

    isLastVoiceChannel(voiceChannel: Discord.VoiceChannel): boolean {
        const channelsList: Discord.VoiceChannel[] = this.getCategoryVoiceChannels(voiceChannel);

        if (channelsList && channelsList.length > 0 && voiceChannel && voiceChannel.position === channelsList[channelsList.length - 1].position) {
            return true;
        }

        return false;
    }

    async cloneVoiceChannel(voiceChannel: Discord.VoiceChannel) {
        try {
            const self: ClientChannelManager = this;
            if (voiceChannel && self.hasPermissions(voiceChannel)) {
                self.guildRegistry.addGuild(voiceChannel.guild.id);

                const registeredGuild: IGuildInfo = self.guildRegistry.findGuild(voiceChannel.guild.id);
                    
                if (voiceChannel.members.size > 0 
                    && self.getEmptyVoiceChannelClones(voiceChannel).length < 1 
                    && !registeredGuild.cloningLock) {
                    self.guildRegistry.toggleCloningLock(registeredGuild.id);

                    await voiceChannel.guild.createChannel(voiceChannel.name, {
                        type: 'voice',
                        position: voiceChannel.position,
                        userLimit: voiceChannel.userLimit,
                        parent: voiceChannel.parentID
                    }).catch(error => console.log(error));
    
                    self.moveJoinedChannel(voiceChannel);
                
                    await self.guildRegistry.toggleCloningLock(registeredGuild.id);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    removeCloneVoiceChannel(voiceChannel: Discord.VoiceChannel): void {
        try {
            if (voiceChannel 
                && voiceChannel.members.size === 0 
                && this.getEmptyVoiceChannelClones(voiceChannel).length > 0) {
                voiceChannel.delete();
            }
        } catch(error) {
            console.log(error);
        }
    }

    removeGuild(id: string): void {
        this.guildRegistry.removeGuild(id);
    }
}