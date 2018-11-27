import * as Eris from 'eris';
import { GuildRegistry } from './guildRegistry';

interface channelGroup {
    name: string
    children: Eris.VoiceChannel[]
};

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

    comparePosition(a: Eris.AnyGuildChannel, b: Eris.AnyGuildChannel): number {
        let result: number = 0;

        if (a.position < b.position) {
            result = -1;
        } else if (a.position > b.position) {
            result = 1;
        }

        return result;
    }

    sortChannels(channel: Eris.VoiceChannel): void {
        const voiceChannels: Eris.VoiceChannel[] = <Eris.VoiceChannel[]>channel.guild.channels
            .filter((guildChannel: Eris.AnyGuildChannel) => guildChannel.type === 2 && channel.parentID === guildChannel.parentID)
            .sort(this.comparePosition);

        const groups: object[] = voiceChannels.reduce((acc: channelGroup[], current: Eris.VoiceChannel) => {
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

        groups.forEach((group: channelGroup, index: number) => {
            group.children.forEach((child: Eris.VoiceChannel, childIndex: number) => {
                const newPosition: number = (index + 1) * 1000 + childIndex;
                console.log(`THEORETICAL -> CHANNEL [${child.name}] -> OLD POSITION [${child.position}] | NEW POSITION [${newPosition}]`);
                child.editPosition(newPosition);

                console.log(`REAL -> CHANNEL [${child.name}] -> NEW POSITION [${newPosition}]`);
            });
        });

        // const uniqueVoiceChannels: string[] = [...new Set(voiceChannels.map((voiceChannel: Eris.VoiceChannel) => voiceChannel.name))];

        // console.log('UNIQUE CHANNELS', uniqueVoiceChannels);

        // voiceChannels.forEach((voiceChannel: Eris.VoiceChannel) => {
        //     const basePosition: number = uniqueVoiceChannels.indexOf(voiceChannel.name);
        //     const newPosition: number = (basePosition + 1) * 1000;

        //     console.log(`CHANNEL [${voiceChannel.name}] -> OLD POSITION [${voiceChannel.position}] | NEW POSITION [${newPosition}]`);
        //     console.log('=============================');

        //     voiceChannel.editPosition(newPosition)
        //         .then(()=> console.log(`CHANNEL [${voiceChannel.name}] | POSITION [${voiceChannel.position}]`));
        // });
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

                            self.sortChannels(<Eris.VoiceChannel>channel);
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