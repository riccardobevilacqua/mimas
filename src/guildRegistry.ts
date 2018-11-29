export interface IGuildInfo {
    id: string
    cloningLock: boolean
};

export class GuildRegistry {
    guildList: IGuildInfo[] = []

    findGuild(id: string): IGuildInfo {
        return this.guildList.find((guildInfo: IGuildInfo) => guildInfo.id === id);
    }

    findGuildIndex(id: string): number {
        return this.guildList.findIndex((guildInfo: IGuildInfo) => guildInfo.id === id);
    }

    addGuild(id: string): void {
        if (this.findGuildIndex(id) === -1) {
            this.guildList.push(<IGuildInfo>{
                id,
                cloningLock: false
            });
        }
    }

    removeGuild(id: string): void {
        const guildIndex: number = this.findGuildIndex(id);
        
        if (guildIndex > -1) {
            this.guildList.splice(guildIndex, 1);
        }
    }

    toggleCloningLock(id: string): void {
        const guildIndex: number = this.findGuildIndex(id);

        this.guildList = [
            ...this.guildList.slice(0, guildIndex),
            {
                id: this.guildList[guildIndex].id,
                cloningLock: !this.guildList[guildIndex].cloningLock
            },
            ...this.guildList.slice(guildIndex + 1)
        ];
    }
};