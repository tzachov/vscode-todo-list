import * as vscode from 'vscode';

import { ActionComment } from '../models/action-comment';
import { Config } from '../config';
import { readFileSync } from 'fs';

export class Gmail {

    constructor(context: vscode.ExtensionContext, private config: Config) {
        context.subscriptions.push(vscode.commands.registerCommand('extension.sendUsingGmail', this.sendUsingGmail.bind(this)));
    }

    private async sendUsingGmail(comment: ActionComment) {
        // TODO: add full comment + code snippet to body
        const body = await this.getSnippet(comment.uri, comment.position, 5);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${comment.label}&body=${body}`;
        return vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
    }

    private async getSnippet(resource: vscode.Uri, startAt: number, numberOfLines: number) {
        // let content = readFileSync(filename, 'utf8');
        const editor = await vscode.window.showTextDocument(resource);
        const pos = editor.document.positionAt(startAt);
        const startLine = Math.max(pos.line - 2, 0);
        const endLine = Math.min(editor.document.lineCount, pos.line + numberOfLines);
        let content = editor.document.getText(new vscode.Range(startLine, 0, endLine, 0));

        content = content + `\n\n${this.config.scheme}://TzachOvadia.todo-list/view?file=${encodeURIComponent(resource.fsPath)}#${startAt})`;
        content = encodeURI(content.replace(/ /g, '+').replace(/\n/g, '%0A'));
        console.log('newLines', content);
        return content;
    }
}
