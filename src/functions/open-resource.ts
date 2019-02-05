import * as vscode from 'vscode';

export async function openResource(resource: vscode.Uri, position: number): Promise<void> {
    const editor = await vscode.window.showTextDocument(resource);
    const pos = editor.document.positionAt(position);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    editor.selection = new vscode.Selection(pos, pos);
}
