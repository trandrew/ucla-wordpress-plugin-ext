# Blocks Directory Guide

Each custom block should live in its own folder:

- `blocks/<block-name>/block.json`
- `blocks/<block-name>/index.js`
- `blocks/<block-name>/style.css`
- `blocks/<block-name>/editor.css`

## How Registration Works

- The plugin bootstrap auto-discovers `blocks/*/block.json`.
- Any block folder with a valid `block.json` is registered on `init`.
- Keep block metadata accurate (`name`, `category`, `attributes`, assets).

## New Block Checklist

1. Create a new folder under `blocks/`.
2. Add `block.json`, editor script, and styles.
3. Set category to `ucla-design-system-components-extended`.
4. Verify editor preview matches frontend output.
5. Validate accessibility (WCAG 2.1 AA).
