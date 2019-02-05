import { ActionComment } from '../models/action-comment';

export function generateComment(item: ActionComment): string {
    return `// ${item.commentType.toUpperCase()}${!!item.createdBy ? '(' + item.createdBy + ')' : '' }: ${item.label}`;
}
