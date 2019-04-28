import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
const clipboardy = require('clipboardy');

import { Config } from '../config';
import { ActionComment } from '../models/action-comment';
import { TrackFeature } from './telemetry';

export class Trello {

    constructor(context: vscode.ExtensionContext, private config: Config) {
        context.subscriptions.push(
            vscode.commands.registerCommand('extension.createTrelloCard', (item: ActionComment | any) => {
                const name = `${item.commentType}: ${item.label}`;
                const desc = `[View File](${this.config.scheme}://TzachOvadia.todo-list/view?file=${encodeURIComponent(item.uri.fsPath)}#${item.position})`;
                this.createTrelloCard(name, desc);
            }));
    }

    updateConfiguration(config: Config) {
        this.config = config;
    }

    @TrackFeature('createCard')
    async createTrelloCard(name: string, desc: string) {
        let key = 'a20752c7ff035d5001ce2938f298be64';
        let token = this.config.trello.token;
        let listId = this.config.trello.defaultList;

        if (!token) {
            try {
                token = await this.getToken(key);
                vscode.workspace.getConfiguration('trello').update('token', token, vscode.ConfigurationTarget.Global);
            } catch (e) {
                return;
            }
        }

        if (!listId) {
            const list = await this.selectTrelloList(key, token);
            if (!list) {
                return;
            }
            listId = list.id;

            vscode.workspace.getConfiguration('trello').update('defaultList', listId, vscode.ConfigurationTarget.Global);
        }

        const addCardResult = await this.addTrelloCard(listId, name, desc, key, token);
    }

    async selectTrelloList(key: string, token: string) {
        try {
            const boards = await this.getTrelloBoards(key, token);
            if (!boards) {
                return;
            }

            const selectedBoard = await vscode.window.showQuickPick<any>(boards.map(p => ({ ...p, label: p.name })), { placeHolder: 'Select Trello Board' });
            if (!selectedBoard) {
                return;
            }

            const lists = await this.getTrelloLists(selectedBoard.id, key, token);
            if (!lists) {
                return;
            }

            const selectedList = await vscode.window.showQuickPick<any>(lists.map(p => ({ ...p, label: p.name })), { placeHolder: 'Select List' });
            return selectedList;

        } catch (e) {
            console.error(e);
            return;
        }
    }

    private getToken(key: string) {
        return new Promise<string>(async (resolve, reject) => {
            let token = await vscode.window.showInputBox({ prompt: 'Trello Token', ignoreFocusOut: true });
            if (!!token) {
                return resolve(token);
            }

            const genToken = await vscode.window.showInformationMessage<vscode.MessageItem>(
                'Trello token is required in order to create new cards. Click `Generate` to open authorization page.',
                { modal: false },
                { title: 'Generate' });
            if (!genToken) {
                return reject();
            }
            const listener = vscode.window.onDidChangeWindowState(async e => {
                if (e.focused) {
                    const value = await clipboardy.read();
                    token = await vscode.window.showInputBox({ prompt: 'Trello Token', ignoreFocusOut: true, value: value });

                    listener.dispose();
                    if (!!token) {
                        return resolve(token);
                    }
                }
            });

            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://trello.com/1/authorize?name=TODO%20List&scope=read,write&expiration=never&response_type=token&key=${key}`));
        });
    }

    private getTrelloBoards(key: string, token: string): Promise<any[]> {
        return httpGet<any[]>(`https://api.trello.com/1/members/me/boards?key=${key}&token=${token}`);
    }

    private getTrelloLists(boardId: string, key: string, token: string) {
        return httpGet(`https://api.trello.com/1/boards/${boardId}/lists?key=${key}&token=${token}`);

    }

    private addTrelloCard(listId: string, name: string, desc: string, key: string, token: string) {
        return httpPost(`/1/cards?idList=${listId}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}&keepFromSource=all&key=${key}&token=${token}`);
    }
}

function httpGet<T = any>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        https.get(url, (res: http.IncomingMessage) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

function httpPost<T = any>(urlPath: string) {
    return new Promise((resolve, reject) => {
        const postData = '';

        const options: http.RequestOptions = {
            hostname: 'api.trello.com',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        // write data to request body
        req.write(postData);
        req.end();
    });
}