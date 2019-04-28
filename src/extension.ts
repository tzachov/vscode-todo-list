'use strict';
import * as vscode from 'vscode';

import { Config, TrelloConfig } from './config';
import { registerTreeViewProvider } from './functions/register-tree';
import { TodoUriHandler } from './modules/uri-handler';
import { Trello } from './modules/trello';
import { Modifications } from './modules/modifications';
import { Deocrator } from './modules/decorator';
import { Gmail } from './modules/gmail';
import { Telemetry } from './modules/telemetry';

export async function activate(context: vscode.ExtensionContext) {
    try {
        let config = getConfig();

        registerTreeViewProvider(context, config);

        context.subscriptions.push(vscode.window.registerUriHandler(new TodoUriHandler()));

        if (config.enableTelemetry === null) {
            const userResponse = await vscode.window.showInformationMessage('Enable minial telemetry? No personal or project data will be sent', 'Yes', 'No');
            const enableTelemetry = userResponse === 'Yes' ? true : false;
            vscode.workspace.getConfiguration().update('enableTelemetry', enableTelemetry, vscode.ConfigurationTarget.Global);
            config.enableTelemetry = enableTelemetry;
        }
        Telemetry.init('4bf4cf26-e6f8-4d6d-bb6f-9e7b3cee7cdf', config);
        Telemetry.trackLoad();
        const trello = new Trello(context, config);
        const modifications = new Modifications(context, config);
        const decorator = new Deocrator(context, config);
        const gmail = new Gmail(context, config);

        // const fixProvider: vscode.CodeActionProvider = {
        //     provideCodeActions: function (document, range, context, token) {
        //         return [{ kind: vscode.CodeActionKind.RefactorRewrite, title: 'Tag `TODO`', command: 'extension.convertToComment', arguments: [document, range, 'todo'] }];
        //     }
        // };
        // const fixer = vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'typescript' }, fixProvider);
        // context.subscriptions.push(fixer);

        vscode.commands.registerCommand('extension.convertToComment', (document: vscode.TextDocument, range: vscode.Range, commentType: string) => {
            const selectedText = document.getText(range);
            console.log(selectedText);
            let res;
            let comment;
            while (res = config.expression.exec(selectedText)) {
                const groups = {
                    type: res[1],
                    name: res[2],
                    text: res[res.length - 1]
                };
                if (res.length < 4) {
                    groups.name = null;
                }

                comment = { ...groups };
            }
            console.log(comment);
        });


        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            config = getConfig();
            if (e.affectsConfiguration('trello')) {
                trello.updateConfiguration(config);
            }
            if (e.affectsConfiguration('name')) {
                modifications.updateConfiguration(config);
            }
            if (e.affectsConfiguration('expression') || e.affectsConfiguration('enableCommentFormatting')) {
                decorator.updateConfiguration(config);
            }
            if (e.affectsConfiguration('enableTelemetry')) {
                Telemetry.updateConfiguration(config);
            }
        }));
    } catch (e) {
        vscode.window.showErrorMessage('Could not activate TODO List (' + e.message + ')');
    }
}

export function deactivate() {

}

function getConfig() {
    const appScheme = vscode.version.indexOf('insider') > -1 ? 'vscode-insiders' : 'vscode'
    const config: Config = {
        expression: new RegExp(vscode.workspace.getConfiguration().get('expression'), 'g'),
        exclude: vscode.workspace.getConfiguration().get('exclude'),
        scanOnSave: vscode.workspace.getConfiguration().get('scanOnSave'),
        name: vscode.workspace.getConfiguration().get('name'),
        trello: vscode.workspace.getConfiguration().get<TrelloConfig>('trello'),
        scheme: appScheme,
        enableCommentFormatting: vscode.workspace.getConfiguration().get('enableCommentFormatting'),
        enableTelemetry: vscode.workspace.getConfiguration().get('enableTelemetry')
    };

    return config;
}
