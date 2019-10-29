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

    async injectVoiceChannel(voiceChannel: Discord.VoiceChannel, prevChannelList: string[]) {
        const categoryVoiceChannels: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];
        const categoryEmptyVoiceChannels: Discord.VoiceChannel[] = categoryVoiceChannels.filter(item => item.members.size === 0);

        if (prevChannelList.length > 0) {
            const refChannelName: string = prevChannelList.pop();
            const refChannels: Discord.VoiceChannel[] = categoryVoiceChannels
                .filter(item => 
                    item.name === refChannelName && item.id !== voiceChannel.id && item.members.size > 0
                );
            
            if (refChannels.length > 0) {
                await voiceChannel.setPosition(refChannels.pop().position);
            } else {
                this.injectVoiceChannel(voiceChannel, prevChannelList);
            }
        } else {
            const lastChannel = categoryEmptyVoiceChannels.pop();
            await voiceChannel.setPosition(lastChannel.position);
        }
    }

    moveJoinedChannel(voiceChannel: Discord.VoiceChannel): void {
        const uniqueChannels: string[] = this.getUniqueChannels(voiceChannel);
        const prevChannelList: string[] = uniqueChannels.slice(0, uniqueChannels.indexOf(voiceChannel.name)).reverse();

        uniqueChannels.forEach(item => console.log(`DETECTED UNIQUE CHANNEL [${item}]`));
        prevChannelList.forEach(item => console.log(`DETECTED PREVIOUS CHANNEL [${item}]`));
        
        this.injectVoiceChannel(voiceChannel, prevChannelList);
    }

    isLastVoiceChannel(voiceChannel: Discord.VoiceChannel): boolean {
        const channelsList: Discord.VoiceChannel[] = [...this.getCategoryVoiceChannels(voiceChannel)];

        if (channelsList && channelsList.length > 0 && voiceChannel.position === channelsList.pop().position) {
            console.log(`CHANNEL [${voiceChannel.name}] is the last`);
            return true;
        }

        console.log(`CHANNEL [${voiceChannel.name}] is NOT the last`);

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
                    });

                    if (!self.isLastVoiceChannel(voiceChannel)) {
                        self.moveJoinedChannel(voiceChannel);
                    }

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