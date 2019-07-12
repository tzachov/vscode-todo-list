import * as vscode from 'vscode';
const micromatch = require('micromatch');
const clipboardy = require('clipboardy');

import { Config } from '../config';
import { ActionComment } from '../models/action-comment';
import { generateComment } from '../functions/generate-comment';
import { editComment } from '../functions/edit-comment';
import { insertComment } from '../functions/insert-comment';
import { TrackFeature } from './telemetry';
import { registerCommand } from '../functions/register-command';
import { tooltips } from '../consts';
import { getDocumentType } from '../functions/get-document-type';

export class Modifications {

    constructor(context: vscode.ExtensionContext, private config: Config) {
        registerCommand(context, 'extension.editComment', this.editCommentCommand.bind(this));
        registerCommand(context, 'extension.insertComment', this.insertCommentCommand.bind(this));
        registerCommand(context, 'extension.copyComment', this.copyCommentCommand.bind(this));
    }

    updateConfiguration(config: Config) {
        this.config = config;
    }

    @TrackFeature('Edit')
    private async editCommentCommand(item: ActionComment) {
        item = await this.getUserInputs(item);

        if (!item) {
            return;
        }

        const docType = getDocumentType(item.uri.fsPath);

        const newComment = generateComment(item, docType);
        editComment(item, newComment);
    }

    @TrackFeature('Insert')
    private async insertCommentCommand() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return;
        }

        const extensionSupported = micromatch.isMatch(activeEditor.document.uri.fsPath, this.config.include);
        if (!extensionSupported) {
            return;
        }

        const item = await this.getUserInputs();
        if (!item) {
            return;
        }
        insertComment(item);
    }

    @TrackFeature('Copy')
    private async copyCommentCommand(item: ActionComment) {
        const docType = getDocumentType(item.uri.fsPath);
        const text = generateComment(item, docType);
        await clipboardy.write(text);
    }

    private async getUserInputs(item?: ActionComment) {
        item = item || new ActionComment(null);
        const data = [
            { prompt: 'Comment type', value: item && item.commentType, key: 'commentType', options: this.config.actionTypes },
            { prompt: 'Text', value: item && item.label, key: 'label' },
            { prompt: 'Created by', value: (item && item.createdBy) || this.config.name, key: 'createdBy' }
        ];

        for (let i = 0; i < data.length; i++) {
            const input = data[i];
            let newValue: string;
            if (input.options) {
                const options: Array<vscode.QuickPickItem> = input.options.map(o => {
                    const label = o;
                    const description = tooltips[o] || null;
                    return <vscode.QuickPickItem>{ label, description };
                });
                const userSelection = await vscode.window.showQuickPick<any>(options, { placeHolder: input.prompt });
                newValue = userSelection && userSelection.label;
            } else {
                newValue = await vscode.window.showInputBox({ prompt: input.prompt, value: input.value });
            }

            if (newValue === undefined) {
                return;
            }

            item[input.key] = newValue;
        }

        return item;
    }

}