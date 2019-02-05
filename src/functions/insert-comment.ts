import * as vscode from 'vscode';
import { ActionComment } from '../models/action-comment';
import { generateComment } from './generate-comment';

export async function insertComment(item: ActionComment) {
    let value = generateComment(item);
    const editor = await vscode.window.activeTextEditor;
    const startPosition = editor.selection.start;
    const beforeContent = editor.document.getText(new vscode.Range(startPosition.with(startPosition.line, 0), startPosition));
    if (beforeContent.trim() !== '') {
        // Add whitespace if inline
        value = ' ' + value;
    }

    await editor.edit(eb => {
        eb.insert(startPosition, value);
        editor.selection = new vscode.Selection(startPosition, startPosition);
        editor.revealRange(new vscode.Range(startPosition, startPosition), vscode.TextEditorRevealType.InCenter);
    });

    await editor.document.save();
}
