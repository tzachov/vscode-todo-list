import * as vscode from 'vscode';
import { readFileSync } from 'fs';

import { ActionCommentCollection } from "../models/action-comment-collection";
import { ActionComment } from '../models/action-comment';
import { Config } from '../config';

export async function readComments(config: Config): Promise<ActionCommentCollection> {
    try {
        const result: ActionCommentCollection = {};
        const files = await vscode.workspace.findFiles('**/*.{ts,js}', config.exclude);
        files.forEach(file => {
            const key = vscode.workspace.asRelativePath(file, true);
            const comments = readCommentsInFile(config.expression, file);
            if (!!comments) {
                result[key] = comments;
            }
        });

        return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

export function readCommentsInFile(expression: RegExp, file: vscode.Uri) {
    const fileContent = readFileSync(file.fsPath, 'utf8');
    const hasBOM = /^\uFEFF/.test(fileContent);

    let res: RegExpExecArray;
    const currentFileActions: Array<ActionComment> = [];
    while (res = expression.exec(fileContent)) {
        const groups = {
            type: res[1],
            name: res[2],
            text: res[res.length - 1]
        };
        if (res.length < 4) {
            groups.name = null;
        }
        const label = groups.text.replace(/[ ]?\*\/$/, '');
        const commentType = (groups.type || 'TODO').toUpperCase();
        const comment: ActionComment = new ActionComment(label);
        const tooltip = [];
        if (groups.name) {
            tooltip.push(`Created by ${groups.name}`);
            comment.createdBy = groups.name;
        }
        tooltip.push(file.fsPath);

        let position = expression.lastIndex - res[0].length;
        if (hasBOM) {
            position--;
        }

        currentFileActions.push({
            ...comment,
            commentType,
            position,
            uri: file,
            type: 'Action',
            contextValue: commentType,
            tooltip: tooltip.join('\n'),
            length: res[0].length,
            id: `${encodeURIComponent(file.path)}_${expression.lastIndex - res[0].length}`
        });
    }
    if (currentFileActions.length > 0) {
        return currentFileActions.sort((a, b) => a.position > b.position ? 1 : ((b.position > a.position) ? -1 : 0));
    }

    return null;
}
