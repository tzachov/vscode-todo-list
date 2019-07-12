import { ActionComment } from '../models/action-comment';

export function generateComment(item: ActionComment, documentType = ''): string {
    switch (documentType.toLowerCase()) {
        case 'html':
            return `<!-- ${item.commentType.toUpperCase()}${!!item.createdBy ? '(' + item.createdBy + ')' : ''}: ${item.label} -->`;
        case 'css':
            return `/* ${item.commentType.toUpperCase()}${!!item.createdBy ? '(' + item.createdBy + ')' : ''}: ${item.label} */`;
        default:
            return `// ${item.commentType.toUpperCase()}${!!item.createdBy ? '(' + item.createdBy + ')' : ''}: ${item.label}`;
    }
}
