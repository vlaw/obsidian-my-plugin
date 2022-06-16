import * as crypto from 'crypto';
import * as path from 'path';

// DataAdapter, parseYaml, Notice
import { App,  MarkdownView, Modal, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

import { format } from 'date-fns';
import * as _ from "lodash";
import { Utils } from "./utils";

// import * as CodeMirror from "codemirror";
// import { values } from 'lodash';

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

function md5Buffer(buffer: ArrayBuffer) {
    return crypto.createHash('md5').update(new DataView(buffer)).digest("hex");
}

async function syncFrontMatterKeyID(app: App,
    file: TFile,
    propKey: string,
    propValue: string): Promise<void> {

    const fileContent: string = await app.vault.read(file);
    let splitContent = fileContent.split("\n");

    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

    // 判断是否有这个YAML的FrontMatter
    const isYamlEmpty: boolean = ((!frontmatter || frontmatter.length === 0)
        && !fileContent.match(/^-{3}\s*\n*\r*-{3}/));
    if (isYamlEmpty) {
        console.log(`File '${file.name}' has no frontmatter.`);
        function prependNewFrontMatter(splitContent: string[],
            propKey: string,
            propValue: string): void {

            // 前置插入一个完整的yaml frontmatter
            splitContent.unshift("---");
            splitContent.unshift(`${propKey}: ${propValue}`);
            splitContent.unshift("---");
        }
        prependNewFrontMatter(splitContent, propKey, propValue);
    } else {
        // 有frontmatter, 有无这个key: `ID`

        // 取出frontmatter的文本, 除非value相等, 否则需要重建YAML(改ID的值、插入新行)
        // 解构起始行
        const { position: { start, end } } = frontmatter;
        const yamlContent: string[] = splitContent.slice(start.line, end.line);

        if (frontmatter["ID"]) {
            // 已经有这个key: `ID`
            const existedID = frontmatter["ID"];
            if (existedID === propValue) {
                // Do nothing
                return
            } else {
                // 更新: 原来的key: `ID`
                function updateID(yamlContent: string[], propValue: string): void {
                    const index = yamlContent.findIndex(value => value.match(/^ID:/));
                    yamlContent[index] = `ID: ${propValue}`;
                }
                updateID(yamlContent, propValue);
            }
        } else {
            // 没有这个key: `ID`, 插入新行
            yamlContent.splice(1, 0, `ID: ${propValue}`);
        }

        splitContent.splice(start.line, end.line - start.line, ...yamlContent);

    }
    // 替换为新的YAML
    const newFileContent = splitContent.join("\n");
    await app.vault.modify(file, newFileContent);
}
export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        console.log(`loading plugin: ${this.manifest.name}(${this.manifest.id}): ${this.manifest.version} ts: ${new Date()}`);

        await this.loadSettings();

        // 命令绑定, command palette => "My Plugin: Rename md by zk"
        this.addCommand({
            id: "update-filename-by-zk",
            name: "Update filename by zk (v2)",
            checkCallback: (checking: boolean) => {
                let tFile = this.app.workspace.getActiveFile();
                // 打开文件是 markdown 文件, 并且是在编辑模式, 才显示这个命令
                if (tFile && tFile.extension == 'md' && this.editModeGuard()) {
                    if (!checking) {
                        let fileName = tFile.name;
                        // match
                        let match = fileName.match(/^\d{6}\-\d{6} /);
                        let zkPrefix;
                        if (!match) {
                            zkPrefix = this.build_zk_prefix();
                            let newFileName = path.join(tFile.parent.path, `${zkPrefix} ${fileName}`);
                            console.log(`new file name: ${newFileName}`);
                            this.app.fileManager.renameFile(tFile, newFileName);
                        } else {
                            // get zk prefix from file name
                            zkPrefix = fileName.match(/^\d{6}\-\d{6} /)[0].replace(/ /g, '');
                        }

                        syncFrontMatterKeyID(this.app, tFile, "ID", zkPrefix);
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            // 修改文件关联的 assets (png/jpg/jpeg), 改成 md5
            id: "update-assets-in-md-by-md5",
            name: "update assets in md by md5",
            checkCallback: (checking) => {
                let md_tFile = this.app.workspace.getActiveFile();
                // 打开文件是 markdown 文件才有可能需要这个命令
                if (md_tFile && md_tFile.extension == 'md' && this.editModeGuard()) {
                    if (!checking) {
                        const fileCache = this.app.metadataCache.getFileCache(md_tFile);
                        const embeds = fileCache.embeds;
                        // 文件的 zk-prefix, 就是 asset 的目标文件夹
                        const assert_dir = Utils.verifyAndGetPrefix(md_tFile.name);
                        if (!assert_dir) {
                            new AlertModal(this.app).open();
                            return false;
                        }
                        // - 两个文件可能存在相同的md5
                        // - [X] 一个markdown文件中，也可能两次引用同一个文件
                        let uniq_embeds = _.uniqBy(embeds, 'link')

                        for (let link of uniq_embeds) {
                            // console.dir(link)
                            const embed_tFile: TFile = this.app.metadataCache.getFirstLinkpathDest(link.link, "/");
                            // console.log(embed_tFile);
                            // console.log(embed_tFile.path);

                            // 被闭包引用
                            const app = this.app;
                            const adapter = this.app.vault.adapter;
                            const fileManager = this.app.fileManager;

                            // fs Promise
                            (async function () {
                                try {
                                    const buffer: ArrayBuffer = await adapter.readBinary(embed_tFile.path);

                                    // console.dir(buffer);
                                    // console.log(buffer.byteLength);

                                    // md5
                                    const fileMD5 = await md5Buffer(buffer);
                                    // console.log(`md5: ${fileMD5}`);
                                    console.log(`prefix: ${assert_dir}`);

                                    const assert_dir_path = path.join(md_tFile.parent.path, 'assets', assert_dir);
                                    if (!await adapter.exists(assert_dir_path)) {
                                        await adapter.mkdir(assert_dir_path);
                                    }
                                    const newPath = path.join(assert_dir_path, fileMD5 + "." + embed_tFile.extension);
                                    let fileDup = await adapter.exists(newPath);

                                    if (!fileDup) {
                                        // 文件名不重复(由于是 md5名, 同名意味着同一个文件

                                        // 直接 rename file, 引用该 asset 的 md 文件没有跟随更新
                                        // await adapter.rename(embed_tFile.path, newPath);

                                        // Rename or move a file safely,
                                        // and update all links to it depending on the user's preferences.
                                        await fileManager.renameFile(embed_tFile, newPath);
                                    } else {
                                        // TODO: 需要改文件的文本, 没法直接使用 fileManager.renameFile
                                        // https://github.com/lynchjames/note-refactor-obsidian/blob/ae41331959f65ebdc8a3b8afec91e2af0efaa2c9/src/main.ts#L138
                                    }

                                } catch (error) {
                                    console.error('出错：', error.message);
                                }
                            })();
                        }
                    }
                    return true;
                }
                return false;
            }
        });

        this.addSettingTab(new SampleSettingTab(this.app, this));
    }

    private build_zk_prefix() {
        const today = new Date();
        let zk_prefix = format(today, "yyMMdd-HHmmss")
        console.log(`zk_prefix: ${zk_prefix}`)
        return zk_prefix;
    }

    private editModeGuard(): boolean {
        const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
        if (!mdView || mdView.getMode() !== 'source') {
            // 通常情况, 不用触发, 直接在非编辑模式屏蔽这个后续的命令(checking)
            // new Notification(`Please use ${this.manifest.name}  in edit mode`, {
            //     timestamp: _.now()
            // });
            return false;
        }
        return true;
    }

    onunload() {
        console.log('unloading plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class AlertModal extends Modal {
    // 模态窗口
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        let { titleEl, contentEl } = this;
        titleEl.setText("ERROR");
        let tFile = this.app.workspace.getActiveFile();
        contentEl.setText(`Woah! ${tFile.name} 不符合规范!`);


    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
    // 插件配置 Tab
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Settings for my awesome plugin.(vlaw)' });
        containerEl.createEl("h3", { text: `version: ${this.plugin.manifest.version}` })

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue('')
                .onChange(async (value) => {
                    console.log('Secret: ' + value);
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
