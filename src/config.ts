export interface Config {
    expression: RegExp;
    exclude: string;
    scanOnSave: boolean;
    name?: string;
    trello: TrelloConfig;
    slack: SlackConfig;
    scheme: 'vscode' | 'vscode-insiders';
    enableCommentFormatting: boolean;
}

export interface TrelloConfig {
    token?: string;
    defaultList?: string;
}

export interface SlackConfig {
    channelId?: string;
    token?: string;
}
