import * as vscode from 'vscode';

export class TodoUriHandler implements vscode.UriHandler {
    handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
        switch (uri.path.toLowerCase()) {
            case '/view':
                this.handleView(uri);
                break;
            default:
                return;
        }
    }

    private async handleView(uri: vscode.Uri) {
        try {
            const filename = decodeURIComponent(uri.query.substring(5));
            const position = +uri.fragment;
            const editor = await vscode.window.showTextDocument(vscode.Uri.parse('file:///' + filename));
            const startPosition = editor.document.positionAt(position);
            editor.selection = new vscode.Selection(startPosition, startPosition);
            editor.revealRange(new vscode.Range(startPosition, startPosition));
        } catch (e) {
            console.error(e);
        }
    }
}
