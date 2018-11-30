import * as Discord from 'discord.js';
import { GuildRegistry } from './guildRegistry';

interface channelGroup {
    name: string
    children: Discord.VoiceChannel[]
};

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
    
    hasCloningPermissions(voiceChannel: Discord.VoiceChannel): boolean {
        let result = false;
    
        if (voiceChannel.permissionsFor(this.user).has('MANAGE_CHANNELS')) {
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

    getChannelGroups(channel: Discord.VoiceChannel): channelGroup[] {
        const voiceChannels: Discord.VoiceChannel[] = <Discord.VoiceChannel[]>channel.guild.channels
            .array()
            .filter((guildChannel: Discord.GuildChannel) => guildChannel.type === 'voice' && channel.parentID === guildChannel.parentID)
            .sort(this.comparePosition);

        const groups: channelGroup[] = voiceChannels.reduce((acc: channelGroup[], current: Discord.VoiceChannel) => {
            const groupIndex: number = acc.findIndex((item: channelGroup) => item.name === current.name);
            
            if (groupIndex === -1) {
                acc.push(<channelGroup>{
                    name: current.name,
                    children: [current]
                })
            } else {
                acc[groupIndex].children.push(current);
            }

            return acc;
        }, []);

        return groups;
    }

    cloneVoiceChannel(voiceChannel: Discord.VoiceChannel): void {
        try {
            const self: ClientChannelManager = this;
            if (voiceChannel) {
                self.guildRegistry.addGuild(voiceChannel.guild.id);
                const registeredGuild = self.guildRegistry.findGuild(voiceChannel.guild.id);
                        
                if (voiceChannel.members.size > 0 
                    && self.getEmptyVoiceChannelClones(voiceChannel).length < 1 
                    && self.hasCloningPermissions(voiceChannel) 
                    && !registeredGuild.cloningLock) {
                    self.guildRegistry.toggleCloningLock(registeredGuild.id);
                    
                    voiceChannel
                        .clone()
                        .then((createdChannel: Discord.VoiceChannel) => {
                            createdChannel.setParent(voiceChannel.parentID)
                                .then((value: Discord.VoiceChannel) => {
                                    value.edit({
                                        userLimit: voiceChannel.userLimit
                                    })
                                    .then(() => {
                                        self.getChannelGroups(voiceChannel)    
                                            .reduce((acc: Discord.VoiceChannel[], current: channelGroup) => 
                                                [...acc, ...current.children],
                                                []
                                            )
                                            .forEach((channel: Discord.VoiceChannel, index: number) => {                                            
                                                channel.edit({
                                                    position: index + 1
                                                });
                                            });
                                    });
                                });

                        })
                        .then(() => self.guildRegistry.toggleCloningLock(registeredGuild.id))
                        .catch((error) => console.log(error));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    removeCloneVoiceChannel(voiceChannel: Discord.VoiceChannel): void {
        try {
            if (voiceChannel && voiceChannel.members.size === 0 && this.getEmptyVoiceChannelClones(voiceChannel).length > 0) {
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