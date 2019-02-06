import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { Config } from './config';
import { ActionComment } from './models/action-comment';

export class Trello {

    constructor(private config: Config) { }

    init() {
        vscode.commands.registerCommand('extension.createTrelloCard', this.createTrelloCard.bind(this));
    }

    async createTrelloCard(item: ActionComment) {
        let key = 'a20752c7ff035d5001ce2938f298be64';
        let token = this.config.trello.token;
        let listId = this.config.trello.defaultList;

        if (!token) {
            token = await vscode.window.showInputBox({ prompt: 'Trello Token', ignoreFocusOut: true });
            vscode.workspace.getConfiguration('trello').update('token', token);
        }
        if (!listId) {
            const list = await this.selectTrelloList(key, token);
            if (!list) {
                return;
            }
            listId = list.id;

            vscode.workspace.getConfiguration('trello').update('defaultList', listId);
        }

        const name = `${item.commentType}: ${item.label}`;
        const desc = `${item.uri.fsPath}`;
        const addCardResult = await this.addTrelloCard(listId, name, desc, key, token);
        console.log('addCardResult', addCardResult);
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
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
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