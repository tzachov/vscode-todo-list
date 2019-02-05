import * as vscode from 'vscode';
import * as path from 'path';
import { existsSync } from 'fs';

import { ActionCommentCollection } from '../models/action-comment-collection';
import { ActionComment } from '../models/action-comment';

export function createTree(comments: ActionCommentCollection) {
    const actions: ActionCommentCollection = {};

    Object.keys(comments)
        .map(filename => comments[filename].forEach(actionComment => {
            if (!actions[actionComment.commentType]) {
                actions[actionComment.commentType] = [];
            }
            actionComment.uri = actionComment.uri;
            actionComment.command = new OpenFileCommand(actionComment.uri, actionComment.position);
            actionComment.type = 'Value';
            actionComment.iconPath = {
                light: getIconPath(actionComment.commentType, 'light'),
                dark: getIconPath(actionComment.commentType, 'dark')
            };
            actions[actionComment.commentType].push(actionComment);
        }));
    const topLevel = Object.keys(actions)
        .map(action => new ActionComment(action, vscode.TreeItemCollapsibleState.Expanded, '$GROUP'));
    return { items: topLevel, actions };
}

class OpenFileCommand implements vscode.Command {
    command = 'extension.openFile';
    title = 'Open File';
    arguments?: any[];

    constructor(uri: vscode.Uri, position: number) {
        this.arguments = [uri, position];
    }
}

function getIconPath(type: string, theme: 'light' | 'dark') {
    const iconPath = path.join(__filename, '..', '..', '..', '..', 'icons', theme, type.toLowerCase() + '.svg');
    if (existsSync(iconPath)) {
        return iconPath;
    }

    return path.join(__filename, '..', '..', '..', '..', 'icons', theme, 'todo.svg');
}