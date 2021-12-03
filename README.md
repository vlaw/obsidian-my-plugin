# My Obsidian Plugin

## How to use

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## 约定

### 文件名及文档结构约定

1. md文件前缀: `XXXXXX-YYYYYY`, 前六位年月日，后六位时分秒，如：`211203-182813`
2. assets: assets/`XXXXXX-YYYYYY[对应的md文件前缀]`/[md5].{suffix}

```
$ tree
.
├── 210415-201003\ git\ internal\ -\ References\ -\ .git_refs.md
├── 210416-174426\ git\ internal\ -\ Objects\ -\ .git_objects.md
├── 210416-184226\ git\ internal\ -\ by\ Example.md
├── 210617-110421\ Git\ Internals.md
└── assets
    ├── 210415-201003
    │   └── c925eefa3619b2b0b1ce2d3b0852a038.png
    ├── 210416-174426
    │   ├── 049e94f4513f5ceacdaa7c6adb5dd169.png
    │   ├── 1a968c3e9589b8033ed027c25f1f2330.png
    │   ├── 2cb789d2ab25ff29220cd8742504dfda.png
    │   ├── 377d6b530aea5643f5e647dcdca71d73.png
    │   ├── 3d2f8123ba63ee8b7976fa13245d95c9.png
    │   ├── 5b1ec37bd898678e82d7577c6ab7974b.png
    │   ├── 5d5d65e04d323736c900aefc3fbaeb58.png
    │   ├── 964129b55384ff2b897e4a10b691c258.png
    │   ├── 9990f25187d746fc1e9d0b7697ce4935.png
    │   ├── bfa4c90af5a778f36b0052d0058f1f64.png
    │   └── d37ef9abb669e217fe641f76482f141b.png
    └── 210416-184226
        ├── 2dc3faebab3b0e3cffd5cb955f9f3cbe.png
        ├── 397015b25c6ee78ac061b73f1ec852af.png
        ├── 3b040f63b349661b4028f89213f7eef5.png
        ├── 503415e1b5379a3d196b23c20d4055e7.png
        ├── 7e2cb326c40cc04b902f1203fd9e19d5.png
        ├── 945ef54d1bc294cb345411f2c3418c74.png
        ├── c13725c3d7945345e029d28cf68f79bd.png
```

## commands

注意：

1. 命令前后有依赖关系
2. 不支持(屏蔽了)在预览模式下执行下面命令

![image](https://user-images.githubusercontent.com/56830/144592788-1a65a5be-1cb9-4918-8cbb-91b8f89418af.png)

1. `My Plugin: Update filename by zk`: 将文件名，加上ZK前缀
2. `My Plugin: Update assets in md by md5`: (依赖指令#1)将附件移动到`assets/[ZK]`目录，并以文件的md5作为新的文件名（更新markdown文件中图片引用）
3. `My Plugin: update meta by zk`: 「可选」， 将ZK前缀写到 [metadata](https://help.obsidian.md/Advanced+topics/YAML+front+matter) 里(还没啥用） 

## TODO 或 已知bug

- [ ] "all in one", 一次全搞定（懒，不想搞）
- [ ] 如果MD5撞车（多次引用同一文件），可能无效


### 配套插件

1. [Obsidian Plugin for Clearing Unused Images](https://github.com/ozntel/oz-clear-unused-images-obsidian) *清理无引用的图片文件*
1. [Consistent attachments and links](https://github.com/derwish-pro/obsidian-consistent-attachments-and-links)
    1. *检查文件中引用的附件是否完整*， Run "Check vault consistent" command and see the report.
    2. https://github.com/derwish-pro/obsidian-consistent-attachments-and-links#how-to-check-the-consistency-of-the-library

---

## Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Changes the default font color to red using `styles.css`.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

### First time developing plugins?

Quick starting guide for new plugin devs:

- Make a copy of this repo as a template with the "Use this template" button.
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugin/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.

### Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments.
- Publish the release.

### Adding your plugin to the community plugin list

- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

### API Documentation

See https://github.com/obsidianmd/obsidian-api

