import { EntryObject, Options } from './types'

const { outputFileSync, readdirSync, existsSync, rmdirSync, readJsonSync, moveSync } = require('fs-extra')
const { join } = require('path')
const ejs = require('ejs')

export default function vitePluginReactMpa(options?: Options) {
  const PLUGIN_NAME = 'vite-plugin-react-mpa'
  const context = process.cwd()
  const tempDirectory = join(context, '.mpa')
  const userOptions: Options = {
    mountElementId: 'root',
    ...options,
  }
  const getValidPathForEntry = (path: string) => {
    let validPath = path
    const absPath = join(context, path)
    if (existsSync(absPath)) {
      validPath = absPath
    }
    return validPath
  }
  const createTempFile = (entry: EntryObject) => {
    rmdirSync(tempDirectory, {
      force: true,
      recursive: true,
    })
    const reactVersion = readJsonSync(join(context, 'package.json')).dependencies.react
    const versionReg = /(~|\\^)?18/
    const isReact18 = versionReg.test(reactVersion)
    const globalImport = userOptions.globalImport?.reduce((acc, curr) => {
      return `${acc}\nimport '${getValidPathForEntry(curr)}';`.trimStart()
    }, '') || ''
    const { layout } = userOptions
    const layoutImport = layout ? `import Layout from '${getValidPathForEntry(layout)}';` : ''
    const layoutJSX = layout ? '<Layout><App /></Layout>' : '<App />'
    const rootElement = `document.getElementById('${userOptions.mountElementId}')`
    const reactDOMSource = isReact18 ? 'react-dom/client' : 'react-dom'
    const renderer = isReact18
      ? `ReactDOM.createRoot(${rootElement}).render(${layoutJSX});`
      : `ReactDOM.render(${layoutJSX}, ${rootElement});`
    // 遍历生成文件
    Object.entries(entry).forEach(([entryName, filePath]: [string, any]) => {
      const jsPath = join(tempDirectory, `${entryName}.jsx`)
      const htmlPath = join(tempDirectory, `${entryName}.html`)
      const tpl = `
// DO NOT CHANGE IT MANUALLY!
import React from 'react';
import ReactDOM from '${reactDOMSource}';
import App from '${filePath}';${layoutImport && `\n${layoutImport}`}
${globalImport}
${renderer}
      `.trimStart()
      outputFileSync(jsPath, tpl)
      let tplPath = ''
      const pageTplPath = join(filePath, '../html.ejs')
      if (existsSync(pageTplPath)) {
        tplPath = pageTplPath
      } else if (userOptions.template) {
        tplPath = join(context, userOptions.template)
      } else {
        tplPath = join(__dirname, 'html.ejs')
      }
      ejs.renderFile(tplPath, {
        mountElementId: userOptions.mountElementId,
      }, (err: any, str: string) => {
        if (err) throw err
        const scriptTag = `<script type="module" src="./${entryName}"></script>`
        const modifiedStr = str.replace('</body>', `${scriptTag}</body>`)
        outputFileSync(htmlPath, modifiedStr)
      })
      entry[entryName] = htmlPath
    })
    return entry
  }
  const collectEntry = () => {
    const d = new Date()
    const entry: EntryObject = {}
    const getIndexFilePath = (dir: string) => {
      const extensions = ['.tsx', '.jsx'] // 定义文件扩展名的数组
      // 遍历文件扩展名数组，逐个检查文件是否存在
      for (const extension of extensions) {
        const indexFilePath = join(dir, `index${extension}`)
        if (existsSync(indexFilePath)) {
          return indexFilePath // 如果文件存在，直接返回该文件的完整路径
        }
      }
      return null // 如果文件都不存在，则返回 null
    }
    const root = join(context, 'src', 'pages')
    readdirSync(root).forEach((filename: string) => {
      if (filename.startsWith('.')) return
      const indexFilePath = getIndexFilePath(join(root, filename))
      if (indexFilePath) {
        const entryName = userOptions.lowerCase === true ? filename.toLowerCase() : filename
        entry[entryName] = indexFilePath
      }
    })
    console.log(`[MPA] Collect Entries in ${new Date().getTime() - d.getTime()}ms`)
    return { entry }
  }
  let outDir = ''
  return {
    name: PLUGIN_NAME,
    config(config: any) {
      outDir = config.build?.outDir || 'dist'
      const { entry } = collectEntry()
      const newEntry = createTempFile(entry)
      return {
        root: tempDirectory,
        build: {
          rollupOptions: {
            input: newEntry,
          },
        },
      }
    },
    closeBundle() {
      moveSync(join(tempDirectory, outDir), join(context, outDir), { overwrite: true })
    },
  }
}
