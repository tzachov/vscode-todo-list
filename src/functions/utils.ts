import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

export interface SnippetResult {
    snippet: string;
    filename: string;
}

export async function getSnippet(resource: vscode.Uri, startAt: number, numberOfLines: number): Promise<SnippetResult> {
    const editor = await vscode.window.showTextDocument(resource);
    const pos = editor.document.positionAt(startAt);
    const startLine = Math.max(pos.line - 2, 0);
    const endLine = Math.min(editor.document.lineCount, pos.line + numberOfLines);
    let content = editor.document.getText(new vscode.Range(startLine, 0, endLine, 0));
    content = content.trim();
    const file = `${resource.fsPath}:${pos.line + 1}:${(pos.character || 0) + 1}`;

    return {
        snippet: content,
        filename: file
    };
}

export async function getSnippetMarkdown(resource: vscode.Uri, startAt: number, numberOfLines: number) {
    const snippet = await getSnippet(resource, startAt, numberOfLines);
    const lang = vscode.window.activeTextEditor.document.languageId;
    return `\`\`\`${lang}\n${snippet.snippet}\n\`\`\`\n---\n${snippet.filename}`;
}

export async function getSnippetPlainText(resource: vscode.Uri, startAt: number, numberOfLines: number) {
    const snippet = await getSnippet(resource, startAt, numberOfLines);

    const line = '-'.repeat(snippet.filename.length);
    return `${line}\n${snippet.snippet}\n${line}\n${snippet.filename}`;
}

export function httpGet<T = any>(url: string): Promise<T> {
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

export function httpPost(hostname: string, urlPath: string, data: any, headers?: any) {
    return new Promise<string>((resolve, reject) => {
        data = JSON.stringify(data);
        const options: http.RequestOptions = {
            hostname: hostname,
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'User-Agent': 'VSCode TODO List Extension',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            let rData = '';
            res.on('data', (chunk) => {
                rData += chunk;
            });
            res.on('end', () => {
                resolve(rData);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        // write data to request body
        req.write(data);
        req.end();
    });
}
