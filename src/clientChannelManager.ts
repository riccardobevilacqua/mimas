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

    // sortChannels(channel: Eris.VoiceChannel): void {
    //     const voiceChannels: Eris.VoiceChannel[] = <Eris.VoiceChannel[]>channel.guild.channels
    //         .filter((guildChannel: Eris.AnyGuildChannel) => guildChannel.type === 2 && channel.parentID === guildChannel.parentID)
    //         .sort(this.comparePosition);

    //     const groups: object[] = voiceChannels.reduce((acc: channelGroup[], current: Eris.VoiceChannel) => {
    //             const groupIndex: number = acc.findIndex((item: channelGroup) => item.name === current.name);
                
    //             if (groupIndex === -1) {
    //                 acc.push(<channelGroup>{
    //                     name: current.name,
    //                     children: [current]
    //                 })
    //             } else {
    //                 acc[groupIndex].children.push(current);
    //             }

    //             return acc;
    //         }, []);

    //     // groups.forEach((group: channelGroup, index: number) => {
    //     //     group.children.forEach((child: Eris.VoiceChannel, childIndex: number) => {
    //     //         // const newPosition: number = (index + 1) * 100 + childIndex;
    //     //         const newPosition: number = index + childIndex;
    //     //         console.log(`THEORETICAL -> CHANNEL [${child.name}] -> OLD POSITION [${child.position}] | NEW POSITION [${newPosition}]`);
    //     //         child.editPosition(newPosition);

    //     //         console.log(`REAL -> CHANNEL [${child.name}] -> NEW POSITION [${newPosition}]`)

    //     //     });
    //     // });

    //     // const uniqueVoiceChannels: string[] = [...new Set(voiceChannels.map((voiceChannel: Eris.VoiceChannel) => voiceChannel.name))];

    //     // console.log('UNIQUE CHANNELS', uniqueVoiceChannels);

    //     // voiceChannels.forEach((voiceChannel: Eris.VoiceChannel) => {
    //     //     const basePosition: number = uniqueVoiceChannels.indexOf(voiceChannel.name);
    //     //     const newPosition: number = (basePosition + 1) * 1000;

    //     //     console.log(`CHANNEL [${voiceChannel.name}] -> OLD POSITION [${voiceChannel.position}] | NEW POSITION [${newPosition}]`);
    //     //     console.log('=============================');

    //     //     voiceChannel.editPosition(newPosition)
    //     //         .then(()=> console.log(`CHANNEL [${voiceChannel.name}] | POSITION [${voiceChannel.position}]`));
    //     // });
    // }

    getChannelGroups(channel: Discord.VoiceChannel): channelGroup[] {
        const voiceChannels: Discord.VoiceChannel[] = <Discord.VoiceChannel[]>channel.guild.channels
            .filter((guildChannel: Discord.GuildChannel) => guildChannel.type === 'voice' && channel.parentID === guildChannel.parentID)
            .sort(this.comparePosition)
            .array();

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
            if (!!voiceChannel) {
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
                            createdChannel.setParent(voiceChannel.parentID);
                            createdChannel.edit({
                                userLimit: voiceChannel.userLimit
                            });                            
                            
                            const channelList: Discord.VoiceChannel[] = self.getChannelGroups(createdChannel)
                                .find((group: channelGroup) => group.name === createdChannel.name)
                                .children;
                            
                            const newPosition: number = channelList[channelList.length - 2].position + 1;
                            
                            createdChannel.setPosition(newPosition);
                            
                            console.log(`Created ${createdChannel.name} with max [${createdChannel.userLimit}] users in position [${createdChannel.position}]`);
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