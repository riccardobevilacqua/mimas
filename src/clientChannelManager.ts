import * as Discord from 'discord.js';
import { GuildRegistry, IGuildInfo } from './guildRegistry';

export class ClientChannelManager extends Discord.Client {
    private guildRegistry: GuildRegistry = new GuildRegistry()

    getVoiceChannelClones(originalChannel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return <Discord.VoiceChannel[]>originalChannel.guild.channels
            .filter((channel: Discord.GuildChannel) => {
                return channel.type === 'voice' 
                    && channel.name === originalChannel.name 
                    && channel.id !== originalChannel.id 
                    && channel.parentID === originalChannel.parentID
            })
            .array();
    }
    
    getEmptyVoiceChannelClones(originalChannel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return this.getVoiceChannelClones(originalChannel)
            .filter((channel: Discord.VoiceChannel) => channel.members.size === 0);
    }
    
    hasPermissions(voiceChannel: Discord.VoiceChannel): boolean {
        const categoryPermissions: Readonly<Discord.Permissions> = voiceChannel.parent.permissionsFor(this.user);
        const channelPermissions: Readonly<Discord.Permissions> = voiceChannel.permissionsFor(this.user);
        let result = false;
        
        if (categoryPermissions.has('MANAGE_CHANNELS') && channelPermissions.has('VIEW_CHANNEL')) {
            result = true;
        }
    
        return result;
    }

    comparePosition(a: Discord.GuildChannel, b: Discord.GuildChannel): number {
        let result: number = 0;

        if (a.position < b.position) {
            result = -1;
        } else if (a.position > b.position) {
            result = 1;
        }

        return result;
    }

    getCategoryVoiceChannels(channel: Discord.VoiceChannel): Discord.VoiceChannel[] {
        return <Discord.VoiceChannel[]>channel.parent.children
            .array()
            .filter((guildChannel: Discord.GuildChannel) => guildChannel.type === 'voice')
            .sort(this.comparePosition);
    }

    getUniqueChannels(channel: Discord.VoiceChannel): string[] {
        const categoryChannelNames: string[] = this
            .getCategoryVoiceChannels(channel)
            .map((item: Discord.VoiceChannel) => item.name);
        return [...new Set(categoryChannelNames)];
    }

    injectVoiceChannel(voiceChannel: Discord.VoiceChannel, prevChannelList: string[]) {
        const categoryVoiceChannels: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];
        const categoryEmptyVoiceChannels: Discord.VoiceChannel[] = categoryVoiceChannels.filter((item: Discord.VoiceChannel) => item.members.size === 0);

        console.info(`CATEGORY VOICE CHANNELS: ${categoryVoiceChannels}`);
        console.info(`CATEGORY EMPTY VOICE CHANNELS: ${categoryEmptyVoiceChannels}`);
        if (prevChannelList.length > 0) {
            console.log('PREV CHANNELS DETECTED');
            const refChannelName: string = prevChannelList.pop();
            console.log(`REF CHANNEL: ${refChannelName}`);
            const refChannels: Discord.VoiceChannel[] = categoryVoiceChannels
                .filter((item: Discord.VoiceChannel) => 
                    item.name === refChannelName && item.id !== voiceChannel.id && item.members.size > 0
                );

            console.info(`REF CHANNELS: ${refChannels}`);
            
            if (refChannels.length > 0) {
                voiceChannel.edit({position: refChannels.pop().position});
            } else {
                this.injectVoiceChannel(voiceChannel, prevChannelList);
            }
        } else {
            const lastChannel = categoryEmptyVoiceChannels.pop();
            console.log(`LAST CHANNEL [${lastChannel}] | POS [${lastChannel.position}]`);
            voiceChannel.edit({position: lastChannel.position});
        }
    }

    moveJoinedChannel(voiceChannel: Discord.VoiceChannel): void {
        const uniqueChannels: string[] = this.getUniqueChannels(voiceChannel);
        const prevChannelList: string[] = uniqueChannels.slice(0, uniqueChannels.indexOf(voiceChannel.name)).reverse();
        console.info(`UNIQUE CHANNELS: ${uniqueChannels}`);
        console.info(`PREV CHANNELS: ${prevChannelList}`);
        this.injectVoiceChannel(voiceChannel, prevChannelList);
    }

    isLastVoiceChannel(voiceChannel: Discord.VoiceChannel): boolean {
        const channelsList: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];
        let result = false;

        if (channelsList && channelsList.length > 0 && voiceChannel.position === channelsList.pop().position) {
            result = true;
        }

        return result;
    }

    cloneVoiceChannel(voiceChannel: Discord.VoiceChannel): void {
        try {
            const self: ClientChannelManager = this;
            if (voiceChannel && self.hasPermissions(voiceChannel)) {
                self.guildRegistry.addGuild(voiceChannel.guild.id);

                const registeredGuild: IGuildInfo = self.guildRegistry.findGuild(voiceChannel.guild.id);
                    
                if (voiceChannel.members.size > 0 
                    && self.getEmptyVoiceChannelClones(voiceChannel).length < 1 
                    && !registeredGuild.cloningLock) {
                    self.guildRegistry.toggleCloningLock(registeredGuild.id);

                    voiceChannel
                        .clone()
                        .then((createdChannel: Discord.VoiceChannel) => {
                            createdChannel
                                .setUserLimit(voiceChannel.userLimit)
                                .then(value => {
                                    value
                                        .setParent(voiceChannel.parentID)
                                        .then(value => {
                                            value
                                                .setPosition(voiceChannel.position)
                                                .then(() => {
                                                    console.log('===================');
                                                    if (!self.isLastVoiceChannel(voiceChannel)) {
                                                        self.moveJoinedChannel(voiceChannel);
                                                    }
                                                })
                                        });
                                })
                                .catch((error) => console.log(error));
                        })
                        .then(() => self.guildRegistry.toggleCloningLock(registeredGuild.id))
                        .catch((error) => {
                            self.guildRegistry.toggleCloningLock(registeredGuild.id);
                            console.log(error);
                        });
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