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
import { parseComment } from './functions/read-comments';
import { CodeActions } from './modules/code-actions';

export async function activate(context: vscode.ExtensionContext) {
    try {
        let config = getConfig();

        registerTreeViewProvider(context, config);

        context.subscriptions.push(vscode.window.registerUriHandler(new TodoUriHandler()));

        await setupTelemetry(config);
        const trello = new Trello(context, config);
        const modifications = new Modifications(context, config);
        const decorator = new Deocrator(context, config);
        const gmail = new Gmail(context, config);
        const codeActions = new CodeActions(context, config);

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
            if (e.affectsConfiguration('expression')) {
                codeActions.updateConfiguration(config);
            }
        }));
    } catch (e) {
        vscode.window.showErrorMessage('Could not activate TODO List (' + e.message + ')');
    }
}

export function deactivate() { }

async function setupTelemetry(config: Config) {
    if (config.enableTelemetry === null) {
        const message = 'Enable minimal telemetry? This will let us know which features are more useful so we could make them better - No personal or project data will be sent';
        const enableAction = 'Yes';
        const cancelAction = 'No';
        const userResponse = await vscode.window.showInformationMessage(message, enableAction, cancelAction);
        const enableTelemetry = userResponse === enableAction ? true : false;
        vscode.workspace.getConfiguration().update('enableTelemetry', enableTelemetry, vscode.ConfigurationTarget.Global);
        config.enableTelemetry = enableTelemetry;
    }
    Telemetry.init(config);
    Telemetry.trackLoad();
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
        enableTelemetry: vscode.workspace.getConfiguration().get('enableTelemetry', null)
    };

    return config;
}
