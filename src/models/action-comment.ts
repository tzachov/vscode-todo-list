import * as vscode from 'vscode';

// export interface ActionComment {
//     text: string;
//     position: number;
//     commentType: string;
//     uri: vscode.Uri;
// }

export class ActionComment extends vscode.TreeItem {
    contextValue = '';
    type: 'Action' | 'Value';
    length: number;
    commentType: string;
    position: number;
    uri: vscode.Uri;
    createdBy?: string;

    constructor(label: string, collapsibleState?: vscode.TreeItemCollapsibleState, contextValue: string = '') {
        super(label, collapsibleState);
        this.contextValue = contextValue;
    }
}