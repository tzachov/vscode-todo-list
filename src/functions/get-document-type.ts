export function getDocumentType(fsPath: string) {
    return (/\.([\w]+)$/.exec(fsPath) || [null]).pop();
}
