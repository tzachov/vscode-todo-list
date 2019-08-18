import * as vscode from 'vscode';
const parse = require('parse-git-config');

import { Config } from '../config';
import { ActionComment } from '../models/action-comment';
import { TrackFeature } from './telemetry';
import { registerCommand } from '../functions/register-command';
import { BaseModule } from './base';
import { httpPost, getSnippetMarkdown } from '../functions/utils';

export class GitHub extends BaseModule {

    constructor(context: vscode.ExtensionContext, config: Config) {
        super(config);

        registerCommand(context, 'extension.createGitHubIssue', this.createGitHubIssue.bind(this));
    }

    protected onConfigChange() {
        if (this.config.github && !this.config.github.storeCredentials && !!this.config.github.auth) {
            vscode.workspace.getConfiguration('github').update('auth', null, vscode.ConfigurationTarget.Global);
        }
    }

    @TrackFeature('Create GitHub Issue')
    private async createGitHubIssue(item: ActionComment) {
        const credentials = await this.getAuth();
        if (!credentials) {
            return;
        }

        const commentSnippet = await getSnippetMarkdown(item.uri, item.position, 5);

        const title = `${item.commentType}: ${item.label}`;
        const body = commentSnippet;

        const repoPath = this.getRepositoryPath();
        const response = await httpPost(`api.github.com`, `/repos/${repoPath}/issues`, { title, body }, {
            'Authorization': `Basic ${credentials}`
        });
        if (response) {
            try {
                const result = JSON.parse(response);
                if (result.html_url) {
                    const userAction = await vscode.window.showInformationMessage(`GitHub issue created!\nURL: ${result.html_url}`, 'Open');
                    if (userAction === 'Open') {
                        return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(result.html_url));
                    }
                }
                console.log(result);
            } catch (e) {
                vscode.window.showErrorMessage(`There was a problem creating GitHub issue\n${e.message}`);
            }
        }
    }

    private getRepositoryPath() {
        const cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const gitConfig = parse.sync({ cwd, path: '.git/config' });
        const keys = parse.expandKeys(gitConfig);
        const noProto = keys.remote.origin.url.substr(keys.remote.origin.url.indexOf('//') + 2);
        return noProto.substr(noProto.indexOf('/') + 1).replace('.git', '');
    }

    private async getAuth() {
        const Cryptr = require('cryptr');
        const sk = `${vscode.env.appName}:${vscode.env.machineId}`;
        const cryptr = new Cryptr(sk);

        let encryptedCredentials = this.config.github && this.config.github.auth && this.config.github.storeCredentials ? this.config.github.auth : null;
        if (!!encryptedCredentials) {
            console.log(encryptedCredentials);
            return cryptr.decrypt(encryptedCredentials);
        }

        const username = await vscode.window.showInputBox({ prompt: 'GitHub Username' });
        if (!username) {
            return;
        }

        const password = await vscode.window.showInputBox({ prompt: 'GitHub Password', password: true });
        if (!password) {
            return;
        }

        const credentials = Buffer.from(`${username}:${password}`).toString('base64');

        if (this.config.github && this.config.github.storeCredentials) {
            const encryptedString = cryptr.encrypt(credentials);
            vscode.workspace.getConfiguration('github').update('auth', encryptedString, vscode.ConfigurationTarget.Global);
        }
        return credentials;
    }
}
