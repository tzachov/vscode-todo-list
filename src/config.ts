export interface Config {
    expression: RegExp;
    exclude: string;
    scanOnSave: boolean;
    name?: string;
    trello: TrelloConfig;
    scheme: 'vscode' | 'vscode-insiders';
    enableCommentFormatting: boolean;
    enableTelemetry: boolean;
}

export interface TrelloConfig {
    token?: string;
    defaultList?: string;
}
