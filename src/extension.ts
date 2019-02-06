'use strict';
import * as vscode from 'vscode';

import { Config } from './config';
import { ActionComment } from './models/action-comment';
import { registerTreeViewProvider } from './functions/register-tree';
import { generateComment } from './functions/generate-comment';
import { editComment } from './functions/edit-comment';
import { insertComment } from './functions/insert-comment';

export function activate(context: vscode.ExtensionContext) {
    try {
        const config: Config = {
            expression: new RegExp(vscode.workspace.getConfiguration().get('expression'), 'g'),
            exclude: vscode.workspace.getConfiguration().get('exclude'),
            scanOnSave: vscode.workspace.getConfiguration().get('scanOnSave'),
            name: vscode.workspace.getConfiguration().get('name')
        }
        registerTreeViewProvider(config);

        vscode.commands.registerCommand('extension.editComment', async (item: ActionComment) => {
            item = await getUserInputs(config, item);

            if (!item) {
                return;
            }

            const newComment = generateComment(item);
            editComment(item, newComment);
        });

        vscode.commands.registerCommand('extension.insertComment', async (...args) => {
            const item = await getUserInputs(config);
            if (!item) {
                return;
            }
            insertComment(item);
        });
    } catch (e) {
        vscode.window.showErrorMessage('Could not activate TODO List (' + e.message + ')');
    }
}

export function deactivate() {
}

async function getUserInputs(config: Config, item?: ActionComment) {
    item = item || new ActionComment(null);
    const data = [
        { prompt: 'Comment type', value: item && item.commentType, key: 'commentType' },
        { prompt: 'Text', value: item && item.label, key: 'label' },
        { prompt: 'Created by', value: (item && item.createdBy) || config.name, key: 'createdBy' }
    ];

    for (let i = 0; i < data.length; i++) {
        const input = data[i];
        const newValue = await vscode.window.showInputBox({ prompt: input.prompt, value: input.value });
        if (newValue === undefined) {
            return;
        }

        item[input.key] = newValue;
    }

    return item;
}