export interface Config {
    expression: RegExp;
    exclude: string;
    include: string;
    scanOnSave: boolean;
    name?: string;
    trello: TrelloConfig;
    scheme: 'vscode' | 'vscode-insiders';
    enableCommentFormatting: boolean;
    enableTelemetry: boolean;
    actionTypes: Array<string>;
}

export interface TrelloConfig {
    token?: string;
    defaultList?: string;
}
