import * as Discord from 'discord.js';
import { token } from './token';

const client: Discord.Client = new Discord.Client();

client.once('ready', () => console.log('Ready!'));

client.on('voiceStateUpdate', (oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    const newVoiceChannel: Discord.VoiceChannel = newMember.voiceChannel;
    const oldVoiceChannel: Discord.VoiceChannel = oldMember.voiceChannel;
    
    if (!!newVoiceChannel && newVoiceChannel.members.size > 0) {
        newVoiceChannel.clone()
            .then((clonedChannel: Discord.VoiceChannel) => {
                clonedChannel.setParent(newVoiceChannel.parentID);
            })
            .catch((error: Error) => console.log(error));
    }

    if (oldVoiceChannel && oldVoiceChannel.members.size < 1) {
        oldVoiceChannel.delete();
    }
});

client.login(token);