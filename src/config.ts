export interface Config {
    expression: RegExp;
    exclude: string;
    scanOnSave: boolean;
    name?: string;
    trello: TrelloConfig;
}

export interface TrelloConfig {
    token?: string;
    defaultList?: string;
}
