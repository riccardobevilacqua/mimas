import * as Discord from 'discord.js';
import { token } from './token';
import { ClientChannelManager } from './clientChannelManager';

const client: ClientChannelManager = new ClientChannelManager();

// client.on('voiceChannelJoin', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel): void => {
//     try {
//         client.cloneVoiceChannel(newVoiceChannel);
//     } catch(error) {
//         console.log(error);
//     }
// });

// client.on('voiceChannelLeave', (member: Eris.Member, oldVoiceChannel: Eris.VoiceChannel): void => {
//     try {
//         client.removeCloneVoiceChannel(oldVoiceChannel);
//     } catch(error) {
//         console.log(error);
//     }
// });

// client.on('voiceChannelSwitch', (member: Eris.Member, newVoiceChannel: Eris.VoiceChannel, oldVoiceChannel: Eris.VoiceChannel): void => {
//     try {
//         client.cloneVoiceChannel(newVoiceChannel);
//         client.removeCloneVoiceChannel(oldVoiceChannel);
//     } catch(error) {
//         console.log(error);
//     }
// });

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember) => {
    try {    
        if (oldMember.voiceChannel && newMember.voiceChannel) {
            // Join channel
        }
        
        if (oldMember.voiceChannel && !newMember.voiceChannel) {
            client.removeCloneVoiceChannel(oldMember.voiceChannel);
        }
    } catch(error) {
        console.log(error);
    }
});

client.on('guildCreate', (guild: Discord.Guild) => {
    try {
        if (guild.available) {
            console.log(`Mimas joined ${guild.name}`);
        }
    } catch(error) {
        console.log(error);
    }
});

client.on('guildDelete', (guild: Discord.Guild) => {
    try {
        client.removeGuild(guild.id);
    
        console.log(`Mimas left ${guild.name}`);
    } catch(error) {
        console.log(error);
    }
});

client.on('ready', () => console.log('Ready!'));

client.login(token);