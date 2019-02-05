import * as vscode from 'vscode';
import { ActionCommentTreeViewProvider } from '../tree-provider';
import { Config } from '../config';

export function registerTreeViewProvider(config: Config) {
    const actionCommentTreeViewProvider = new ActionCommentTreeViewProvider(config);
    vscode.window.registerTreeDataProvider('actionComments', actionCommentTreeViewProvider);
}
