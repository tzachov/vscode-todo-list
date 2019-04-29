import * as vscode from 'vscode';

export function registerCommand(context: vscode.ExtensionContext, name: string, handler: (...args: any[]) => any) {
    context.subscriptions.push(vscode.commands.registerCommand(name, handler));
}
