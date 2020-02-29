export interface Config {
    expression: RegExp;
    exclude: string;
    include: string;
    scanOnSave: boolean;
    name?: string;
    trello: TrelloConfig;
    github: GitHubConfig;
    scheme: 'vscode' | 'vscode-insiders';
    enableCommentFormatting: boolean;
    enableTelemetry: boolean;
    actionTypes: Array<string>;
    enabledCodeActions: boolean;
}

export interface TrelloConfig {
    token?: string;
    defaultList?: string;
}

export interface GitHubConfig {
    auth?: string;
    storeCredentials?: boolean;
}
