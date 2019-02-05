import * as vscode from 'vscode';

import { Config } from './config';
import { ActionComment } from './models/action-comment';
import { ActionCommentCollection } from './models/action-comment-collection';
import { readComments, readCommentsInFile } from './functions/read-comments';
import { removeComment } from './functions/remove-comment';
import { openResource } from './functions/open-resource';
import { createTree } from './functions/create-tree';

export class ActionCommentTreeViewProvider implements vscode.TreeDataProvider<ActionComment> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionComment> = new vscode.EventEmitter<ActionComment>();
    private tree: ActionCommentCollection;
    private comments: ActionCommentCollection;

    readonly onDidChangeTreeData: vscode.Event<ActionComment> = this._onDidChangeTreeData.event;

    constructor(private config: Config) {
        vscode.commands.registerCommand('extension.openFile', (uri, position) => openResource(uri, position));
        vscode.commands.registerCommand('extension.viewComment', (item: ActionComment) => openResource(item.uri, item.position));
        vscode.commands.registerCommand('extension.refreshActionComments', () => this.refresh(true));
        vscode.commands.registerCommand('extension.removeActionComment', (item: ActionComment) => this.removeItem(item.uri, item.position, item.length));
        vscode.commands.registerCommand('extension.collapseAll', () => this.collapseAll());
        vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
            if (config.scanOnSave) {
                this.refresh(true, document.uri);
            }
        });

        this.refresh(true);
    }

    getTreeItem(element: ActionComment): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ActionComment): vscode.ProviderResult<ActionComment[]> {
        if (this.tree && element) {
            return Promise.resolve(this.tree[element.label]);
        }

        if (!!this.comments) {
            const { items } = createTree(this.comments);
            return items;
        }

        return [];
    }

    getParent?(element: ActionComment): vscode.ProviderResult<ActionComment> {
        return null;
    }

    private async refresh(emitChange?: boolean, file?: vscode.Uri) {
        try {
            if (file) {
                const fileComments = readCommentsInFile(this.config.expression, file);
                const key = vscode.workspace.asRelativePath(file, true);
                if (!!fileComments) {
                    this.comments[key] = fileComments;
                } else {
                    delete this.comments[key];
                }
            } else {
                this.comments = await readComments(this.config);
            }

            const { actions, items } = createTree(this.comments);
            this.tree = actions;
            if (emitChange) {
                this._onDidChangeTreeData.fire();
            }
            return Promise.resolve(items);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private async removeItem(resource: vscode.Uri, start: number, length: number) {
        await removeComment(resource, start, length);
        this.refresh(true, resource);
    }

    private collapseAll() {
        // TODO: implement
        this.refresh(false);
    }
}
