import * as vscode from 'vscode';
import { ActionCommentTreeViewProvider } from '../tree-provider';
import { Config } from '../config';
import { openResource } from './open-resource';
import { ActionComment } from '../models/action-comment';

export function registerTreeViewProvider(context: vscode.ExtensionContext, config: Config) {
    const actionCommentTreeViewProvider = new ActionCommentTreeViewProvider(config);
    context.subscriptions.push(vscode.commands.registerCommand('extension.openFile', (uri, position) => openResource(uri, position)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.viewComment', (item: ActionComment) => openResource(item.uri, item.position)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.refreshActionComments', () => actionCommentTreeViewProvider.refresh(true)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.removeActionComment', (item: ActionComment) => actionCommentTreeViewProvider.removeItem(item.uri, item.position, item.length)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.collapseAll', () => actionCommentTreeViewProvider.collapseAll()));

    context.subscriptions.push(vscode.window.registerTreeDataProvider('actionComments', actionCommentTreeViewProvider));
}
