import * as vscode from 'vscode';
import { ActionCommentTreeViewProvider } from '../tree-provider';
import { Config } from '../config';
import { openResource } from './open-resource';
import { ActionComment } from '../models/action-comment';
import { TrackFeature } from '../modules/telemetry';
import { registerCommand } from './register-command';

export function registerTreeViewProvider(context: vscode.ExtensionContext, config: Config) {
    const actionCommentTreeViewProvider = new ActionCommentTreeViewProvider(config);
    const treeActions = new TreeActions(actionCommentTreeViewProvider);

    registerCommand(context, 'extension.openFile', treeActions.openFile.bind(this));
    registerCommand(context, 'extension.viewComment', treeActions.viewComment.bind(this));
    registerCommand(context, 'extension.refreshActionComments', treeActions.refreshActionComments.bind(treeActions));
    registerCommand(context, 'extension.removeActionComment', treeActions.removeActionComment.bind(treeActions));
    registerCommand(context, 'extension.collapseAll', treeActions.collapseAll.bind(treeActions));

    context.subscriptions.push(vscode.window.registerTreeDataProvider('actionComments', actionCommentTreeViewProvider));

    return actionCommentTreeViewProvider;
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