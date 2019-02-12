import * as vscode from 'vscode';
import { Config } from '../config';

export class Deocrator {

    private listeners: Array<vscode.Disposable> = [];
    private commentTypeStyle = vscode.window.createTextEditorDecorationType({ color: '#ffaa00' });
    private commentContentStyle = vscode.window.createTextEditorDecorationType({ fontStyle: 'italic' });

    constructor(context: vscode.ExtensionContext, private config: Config) {
        if (config.enableCommentFormatting) {
            this.registerListeners();
        }
    }

    updateConfiguration(config: Config) {
        this.config = config;
        if (config.enableCommentFormatting && this.listeners.length === 0) {
            this.registerListeners();
        }
        if (!config.enableCommentFormatting) {
            this.unregisterListeners();
        }
    }

    private registerListeners() {
        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.updateDecorations(vscode.window.activeTextEditor, this.config);
        }

        this.listeners.push(vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) {
                this.updateDecorations(vscode.window.activeTextEditor, this.config);
            }
        }));

        this.listeners.push(vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                this.updateDecorations(vscode.window.activeTextEditor, this.config);
            }
        }));
    }

    private unregisterListeners() {
        this.listeners.forEach(p => p.dispose());
        this.listeners = [];
    }

    private updateDecorations(activeEditor: vscode.TextEditor, config: Config) {
        if (!activeEditor) {
            return;
        }
        const regEx = config.expression;
        const text = activeEditor.document.getText();
        const commentTypes: vscode.DecorationOptions[] = [];
        const contents: vscode.DecorationOptions[] = [];
        let match: RegExpExecArray;
        while (match = regEx.exec(text)) {
            const startPos = activeEditor.document.positionAt(match.index + match[0].indexOf(match[1]));
            const endPos = startPos.translate(0, match[1].length);
            const decoration = { range: new vscode.Range(startPos, endPos) };
            commentTypes.push(decoration);

            const content = match[match.length - 1];
            const contentStartPos = activeEditor.document.positionAt(match.index + match[0].indexOf(content));
            const contentEndPos = contentStartPos.translate(0, content.length);
            contents.push({ range: new vscode.Range(contentStartPos, contentEndPos) });
        }

        activeEditor.setDecorations(this.commentTypeStyle, commentTypes);
        activeEditor.setDecorations(this.commentContentStyle, contents);
    }
}
