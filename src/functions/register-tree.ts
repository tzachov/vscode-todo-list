import * as vscode from 'vscode';
import { ActionCommentTreeViewProvider } from '../tree-provider';
import { Config } from '../config';
import { openResource } from './open-resource';
import { ActionComment } from '../models/action-comment';

export function registerTreeViewProvider(config: Config) {
    const actionCommentTreeViewProvider = new ActionCommentTreeViewProvider(config);
    vscode.commands.registerCommand('extension.openFile', (uri, position) => openResource(uri, position));
    vscode.commands.registerCommand('extension.viewComment', (item: ActionComment) => openResource(item.uri, item.position));
    vscode.commands.registerCommand('extension.refreshActionComments', () => actionCommentTreeViewProvider.refresh(true));
    vscode.commands.registerCommand('extension.removeActionComment', (item: ActionComment) => actionCommentTreeViewProvider.removeItem(item.uri, item.position, item.length));
    vscode.commands.registerCommand('extension.collapseAll', () => actionCommentTreeViewProvider.collapseAll());

    vscode.window.registerTreeDataProvider('actionComments', actionCommentTreeViewProvider);
}
