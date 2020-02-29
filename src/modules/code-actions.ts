import * as vscode from 'vscode';

import { Config } from '../config';

import { registerCommand } from '../functions/register-command';
import { parseComment } from '../functions/read-comments';

export class CodeActions {

    private providers: Array<vscode.Disposable> = [];

    constructor(private context: vscode.ExtensionContext, private config: Config) {
        registerCommand(context, 'extension.contextMenu', this.contextMenuHandler.bind(this));

        if (config.enabledCodeActions) {
            this.setupCodeActions();
        }
    }

    updateConfiguration(config: Config) {
        this.config = config;
        if (config.enabledCodeActions) {
            this.setupCodeActions();
        } else {
            this.disableCodeActions();
        }
    }

    private setupCodeActions() {
        if (this.providers.length > 0) {
            return;
        }
        const fixProvider = this.createCodeActionProvider();
        this.providers.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'typescript' }, fixProvider));
        this.providers.push(vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'javascript' }, fixProvider));
        this.context.subscriptions.push(...this.providers);
    }

    private disableCodeActions() {
        this.providers.forEach(p => p.dispose());
        this.providers = [];
    }

    private createCodeActionProvider() {
        const fixProvider: vscode.CodeActionProvider = {
            provideCodeActions: function (document, range, context, token) {
                const codeActionCreator = new CodeActionCreator(document, range, context);
                return [
                    codeActionCreator.create('Create Trello Card', 'extension.createTrelloCard', vscode.CodeActionKind.QuickFix),
                    codeActionCreator.create('Send using Gmail', 'extension.sendUsingGmail', vscode.CodeActionKind.QuickFix)
                ];
            }
        };

        return fixProvider;
    }

    private contextMenuHandler(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, commandName: string) {
        try {
            const start = new vscode.Position(range.start.line, 0);
            const end = start.translate(1, 0);

            const row = document.getText(range.with(start, end)).trim();
            const c = parseComment(this.config.expression, row, document.uri, document.offsetAt(start));
            vscode.commands.executeCommand(commandName, c);
        } catch (e) {
            console.error('CodeAction Error', e);
        }
    }
}

class CodeActionCreator {
    constructor(
        private document: vscode.TextDocument,
        private range: vscode.Range | vscode.Selection,
        private context: vscode.CodeActionContext
    ) { }

    create(title: string, command: string, kind: vscode.CodeActionKind) {
        return {
            title,
            kind,
            command: 'extension.contextMenu',
            arguments: [this.document, this.range, this.context, command]
        };
    }
}