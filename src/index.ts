import * as Discord from 'discord.js';
import { token } from './token';

const client = new Discord.Client();

client.once('ready', () => console.log('Ready!'));

client.login(token);