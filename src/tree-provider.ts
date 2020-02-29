import * as vscode from 'vscode';

import { Config } from './config';
import { ActionComment } from './models/action-comment';
import { ActionCommentCollection } from './models/action-comment-collection';
import { readComments, readCommentsInFile } from './functions/read-comments';
import { removeComment } from './functions/remove-comment';
import { createTree } from './functions/create-tree';

export class ActionCommentTreeViewProvider implements vscode.TreeDataProvider<ActionComment> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionComment> = new vscode.EventEmitter<ActionComment>();
    private tree: ActionCommentCollection;
    private comments: ActionCommentCollection;

    readonly onDidChangeTreeData: vscode.Event<ActionComment> = this._onDidChangeTreeData.event;

    constructor(private config: Config) {
        vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
            if (config.scanOnSave) {
                this.refresh(true, document.uri);
            }
        });

        this.refresh(true);
    }

    async updateConfiguration(config: Config) {
        this.config = config;
        try {
            await this.refresh(true);
        } catch (e) {
            console.error('Could not refresh tree after config change', e);
        }
    }

    getTreeItem(element: ActionComment): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ActionComment): vscode.ProviderResult<ActionComment[]> {
        if (this.tree && element) {
            return Promise.resolve(this.tree[element.label]);
        }

        if (!!this.comments) {
            const tree = createTree(this.comments);
            return tree.items;
        }

        return [];
    }

    getParent?(element: ActionComment): vscode.ProviderResult<ActionComment> {
        return null;
    }

    async refresh(emitChange?: boolean, file?: vscode.Uri) {
        try {
            if (file) {
                const fileComments = await readCommentsInFile(this.config.expression, file);
                const key = vscode.workspace.asRelativePath(file, true);
                if (!!fileComments) {
                    this.comments[key] = fileComments;
                } else {
                    if (key in this.comments) {
                        delete this.comments[key];
                    }
                }
            } else {
                this.comments = await readComments(this.config);
            }

            const tree = createTree(this.comments);
            this.tree = tree.actions;
            if (emitChange) {
                this._onDidChangeTreeData.fire();
            }
            return Promise.resolve(tree.items);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async removeItem(resource: vscode.Uri, start: number, length: number) {
        await removeComment(resource, start, length);
        this.refresh(true, resource);
    }

    collapseAll() {
        // TODO: implement
        this.refresh(false);
    }
}
