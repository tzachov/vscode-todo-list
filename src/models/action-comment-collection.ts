import { ActionComment } from "./action-comment";

export interface ActionCommentCollection {
    [file: string]: Array<ActionComment>;
}
