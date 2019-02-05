import * as vscode from 'vscode';
import { ActionComment } from '../models/action-comment';

export async function editComment(item: ActionComment, value: string) {
    const { uri, position, length } = item;
    const editor = await vscode.window.showTextDocument(uri);
    let startPosition = editor.document.positionAt(position);
    await editor.edit(eb => {
        const endPosition = startPosition.with(startPosition.line, position + length);
        eb.replace(new vscode.Range(startPosition, endPosition), value);
        editor.selection = new vscode.Selection(startPosition, startPosition);
        editor.revealRange(new vscode.Range(startPosition, startPosition), vscode.TextEditorRevealType.InCenter);
    });

    await editor.document.save();
}
