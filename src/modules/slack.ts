import * as vscode from 'vscode';

import * as https from 'https';

import { Config } from '../config';
import { ActionComment } from '../models/action-comment';
import { httpPost } from '../functions/http';

interface SlackApiResponse {
    ok: boolean,
    error?: string;
}

export class Slack {

    constructor(context: vscode.ExtensionContext, private config: Config) {
        context.subscriptions.push(vscode.commands.registerCommand('extension.sendToSlack', this.sendToSlack.bind(this)));
    }

    updateConfiguration(config: Config) {
        this.config = config;
    }

    private async sendToSlack(item: ActionComment) {
        try {
            const token = await this.getAuthToken(); // TODO: read from config
            const channel = await this.getChannel(); // 'D30BRHZQW'; // TODO: read from config
            const text = await this.createSnippet(item);
            const request = { channel, text, token };
            const response = await this.sendRequest(request, token);
            console.log(response);
        } catch (e) {
            console.error(e);
        }
    }

    private async getAuthToken(): Promise<string> {
        if (!!this.config.slack && !!this.config.slack.token) {
            return Promise.resolve(this.config.slack.token);
        }

        return Promise.resolve('');
    }

    private async getChannel(): Promise<string> {
        if (!!this.config.slack && !!this.config.slack.channelId) {
            return this.config.slack.channelId;
        }

        const channelId = await vscode.window.showInputBox({ prompt: 'Select channel ID' });
        if (!channelId) {
            throw new Error('channel id not selected');
        }

        vscode.workspace.getConfiguration('slack').update('channelId', channelId);
        return channelId;
    }

    private async createSnippet(item: ActionComment) {
        const resource = item.uri;
        const startAt = item.position;
        const numberOfLines = 5;
        const editor = await vscode.window.showTextDocument(resource);
        const pos = editor.document.positionAt(startAt);
        const startLine = Math.max(pos.line - 2, 0);
        const endLine = Math.min(editor.document.lineCount, pos.line + numberOfLines);
        let content = editor.document.getText(new vscode.Range(startLine, 0, endLine, 0));
        const link = `${this.config.scheme}://TzachOvadia.todo-list/view?file=${encodeURIComponent(resource.fsPath)}#${startAt}`;
        content = content.trim();
        content = `*${item.label}*\n\`\`\`${content}\`\`\`\n${link}`;
        return content;
    }

    private async sendRequest(request: any, token: string) {
        let response = await httpPost<SlackApiResponse>('slack.com', '/api/chat.postMessage', request, token);
        if (!response.ok) {
            const AUTHENTICATE_ACTION = 'Authenticate';
            const RETRY_ACTION = 'Retry';
            const actionButton = response.error === 'not_authed' ? AUTHENTICATE_ACTION : RETRY_ACTION;
            const errorAction = await vscode.window.showErrorMessage(`Could not send to Slack (${response.error})`, { modal: false }, actionButton);
            if (errorAction === RETRY_ACTION) {
                response = await this.sendRequest(request, token);
            }
            if (errorAction === AUTHENTICATE_ACTION) {
                // TODO: authenticate
                // ...

                const newToken = '';
                // TODO: store newToken

                response = await this.sendRequest(request, newToken);
            }
        }

        return response;
    }
}