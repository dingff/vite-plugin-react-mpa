# vite-plugin-react-mpa

[![NPM version](https://img.shields.io/npm/v/vite-plugin-react-mpa.svg?style=flat)](https://npmjs.org/package/vite-plugin-react-mpa)

## How it works
It will collect `*/index.[jt]sx?` files under `src/pages` directory as entries, and generate corresponding HTML file for each entry.
## Install

```bash
npm install --save-dev vite-plugin-react-mpa
```

## Usage
```js
import { defineConfig } from 'vite';
import mpa from 'vite-plugin-react-mpa'

export default defineConfig({
  plugins: [mpa()],
});
```

## Options

```js
export type Options = {
  /**
   * The template file path.
   */
  template?: string;
  /**
   * ID of the node to be mounted during page rendering, default is 'root'
   */
  mountElementId?: string;
  /**
   * The paths of the global dependencies.
   */
  globalImport?: string[];
  /**
   * Whether to lower case the output html file name.
   */
  lowerCase?: boolean;
  /**
   * The path of layout.
   */
  layout?: string;
}
```
### The page-level template
Create `html.ejs` at the same level as the page component to declare the page-level template. The `mountElementId` is required.
```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title></title>
	</head>
	<body>
		<div id="<%= mountElementId %>"></div>
	</body>
</html>
```
### Layout
The page component will be passed as a child component to the `Layout` component, and global dependencies can be imported here.
```js
export default function Layout({ children }) {
  return children
}
```