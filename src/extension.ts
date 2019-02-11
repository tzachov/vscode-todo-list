'use strict';
import * as vscode from 'vscode';

import { Config, TrelloConfig } from './config';
import { registerTreeViewProvider } from './functions/register-tree';
import { Trello } from './trello';
import { TodoUriHandler } from './uri-handler';
import { Modifications } from './modifications';

export function activate(context: vscode.ExtensionContext) {
    try {
        let config = getConfig();

        registerTreeViewProvider(context, config);

        context.subscriptions.push(vscode.window.registerUriHandler(new TodoUriHandler()));

        const trello = new Trello(context, config);
        const modifications = new Modifications(context, config);

        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            config = getConfig();
            if (e.affectsConfiguration('trello')) {
                trello.updateConfiguration(config);
            }
            if (e.affectsConfiguration('name')) {
                modifications.updateConfiguration(config);
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
        scheme: appScheme
    };

    return config;
}
