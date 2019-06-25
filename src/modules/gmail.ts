import * as vscode from 'vscode';

import { ActionComment } from '../models/action-comment';
import { Config } from '../config';
import { TrackFeature } from './telemetry';
import { registerCommand } from '../functions/register-command';

export class Gmail {

    constructor(context: vscode.ExtensionContext, private config: Config) {
        registerCommand(context, 'extension.sendUsingGmail', this.sendUsingGmail.bind(this));
    }

    @TrackFeature('Send')
    private async sendUsingGmail(comment: ActionComment) {
        const body = await this.getSnippet(comment.uri, comment.position, 5);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${comment.label}&body=${body}`;
        return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }

    private async getSnippet(resource: vscode.Uri, startAt: number, numberOfLines: number) {
        const editor = await vscode.window.showTextDocument(resource);
        const pos = editor.document.positionAt(startAt);
        const startLine = Math.max(pos.line - 2, 0);
        const endLine = Math.min(editor.document.lineCount, pos.line + numberOfLines);
        let content = editor.document.getText(new vscode.Range(startLine, 0, endLine, 0));
        content = content.trim();
        const file = `${resource.fsPath}:${pos.line + 1}:${(pos.character || 0) + 1}`;
        const line = '-'.repeat(file.length);
        content = `Snippet:\n${line}\n${content}\n${line}\n${file}`;
        content = encodeURI(content.replace(/ /g, '+'));
        return content;
    }
}
