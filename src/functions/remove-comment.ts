import * as vscode from 'vscode';

export async function removeComment(resource: vscode.Uri, start: number, length: number) {
    const editor = await vscode.window.showTextDocument(resource);
    let startPosition = editor.document.positionAt(start);
    await editor.edit(eb => {
        const endPosition = startPosition.with(startPosition.line, start + length);

        // Check if line will become empty after remove
        const beforeContent = editor.document.getText(new vscode.Range(startPosition.with(startPosition.line, 0), startPosition));
        if (beforeContent.trim() === '') {
            // Update start position to remove the line completely
            startPosition = editor.document.positionAt(start - beforeContent.length - 1);
        } else {
            // Remove trailing whitespaces
            const whitespaces = beforeContent.length - beforeContent.trimRight().length;
            startPosition = editor.document.positionAt(start - whitespaces);
        }
        eb.delete(new vscode.Range(startPosition, endPosition));
        editor.selection = new vscode.Selection(startPosition, startPosition);
        editor.revealRange(new vscode.Range(startPosition, startPosition), vscode.TextEditorRevealType.InCenter);
    });

    await editor.document.save();
}
