# TODO List

This VSCode extension will list all of your TODO-type comments in an easy-to-read tree view panel.

## Installation
```
ext install todo-list
```

## How It Works
- List is updated every time you save a document.
- Click an item to open.
- Click `Remove` to delete the comment from document.

## Supported Comments
TODO List supports any comment written in the next formats:
```
// <ACTION>: <message>
/* <ACTION>: <message> */
// <ACTION>(NAME): <message>
```
Examples:
```
// TODO: Refactor everything
/* FIXME: Please please please */
// HACK(Tzach): This is a workaround
```

Common tags/types:
- `TODO` – something to be done.
- `FIXME` – should be corrected.
- `HACK` – a workaround.
- `BUG` – a known bug that should be corrected.
- `UNDONE` – a reversal or "roll back" of previous code.

## Settings

- **Expression**

  RegExp to use for extracting comments (Must have `type` and `text` groups). We recommend capturing only all-uppercase types to avoid capturing `tslint:` and commented properties.

  Default: ```(?:\\/\\/|\\/\\*)[ ]?(?<type>[A-Z]+)(?:\\:|\\((?<name>[A-Za-z\\/\\d ]+)\\)\\:)[ ]?(?<text>.*)```

- **Scan On Save**

  Scan comments when saving a file.

  Default: ```true```

- **Exclude**

  Glob pattern to exclude from scans.

  Default: ```**/{node_modules,dist,build}/**```

- **Name**

  Name to use as `Created by`.

  Default: `empty`