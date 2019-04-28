import * as vscode from 'vscode';
import { ActionCommentTreeViewProvider } from '../tree-provider';
import { Config } from '../config';
import { openResource } from './open-resource';
import { ActionComment } from '../models/action-comment';
import { TrackFeature } from '../modules/telemetry';

export function registerTreeViewProvider(context: vscode.ExtensionContext, config: Config) {
    const actionCommentTreeViewProvider = new ActionCommentTreeViewProvider(config);
    const treeActions = new TreeActions(actionCommentTreeViewProvider);
    context.subscriptions.push(vscode.commands.registerCommand('extension.openFile', treeActions.openFile.bind(this)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.viewComment', treeActions.viewComment.bind(this)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.refreshActionComments', treeActions.refreshActionComments.bind(treeActions)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.removeActionComment', treeActions.removeActionComment.bind(treeActions)));
    context.subscriptions.push(vscode.commands.registerCommand('extension.collapseAll', treeActions.collapseAll.bind(treeActions)));

    context.subscriptions.push(vscode.window.registerTreeDataProvider('actionComments', actionCommentTreeViewProvider));
}

class TreeActions {

    constructor(private provider: ActionCommentTreeViewProvider) { }

    @TrackFeature('OpenFile')
    openFile(uri, position) {
        return openResource(uri, position);
    }

    @TrackFeature('ViewComment')
    viewComment(item: ActionComment) {
        return openResource(item.uri, item.position);
    }

    @TrackFeature('Refresh')
    refreshActionComments() {
        return this.provider.refresh(true);
    }

    @TrackFeature('Remove')
    removeActionComment(item: ActionComment) {
        return this.provider.removeItem(item.uri, item.position, item.length);
    }

    @TrackFeature('Collapse')
    collapseAll() {
        this.provider.collapseAll();
    }
}