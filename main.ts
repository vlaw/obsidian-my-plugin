import {App, MarkdownView, Modal, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import {format} from 'date-fns';
// import * as _ from "lodash";
import * as CodeMirror from "codemirror";
import * as crypto from 'crypto';
import * as path from 'path';
import {Utils} from "./utils";

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

function md5Buffer(buffer: ArrayBuffer) {
    return crypto.createHash('md5').update(new DataView(buffer)).digest("hex");
}

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();

        // // RibbonIcon: 左侧侧边栏 icon
        // this.addRibbonIcon('dice', 'Sample Plugin', () => {
        // 	//  Notice: 右上方通知栏
        // 	new Notice('This is a notice!');
        // });

        // // StatusBarItem: 右下方状态栏
        // this.addStatusBarItem().setText('Status Bar Text');

        // 命令绑定, command palette => "My Plugin: Rename md by zk"
        this.addCommand({
            id: "update-filename-by-zk",
            name: "Update filename by zk",
            checkCallback: (checking: boolean) => {
                let tFile = this.app.workspace.getActiveFile();
                // 打开文件是 markdown 文件, 并且是在编辑模式, 才显示这个命令
                if (tFile && tFile.extension == 'md' && this.editModeGuard()) {
                    if (!checking) {
                        let fileName = tFile.name;
                        // match
                        let match = fileName.match(/^\d{6}\-\d{6} /);
                        if (!match) {
                            let zkPrefix = this.build_zk_prefix();
                            let newFileName = path.join(tFile.parent.path, `${zkPrefix} ${fileName}`);
                            this.app.fileManager.renameFile(tFile, newFileName);
                        }
                    }
                    return true;
                }
                return false;
            }
        });

        this.addCommand({
            id: "update-meta-by-zk",
            name: "Update Meta by ZK",
            checkCallback: (checking: boolean) => {
                let tFile = this.app.workspace.getActiveFile();
                // 打开文件是 markdown 文件才有可能需要这个命令
                if (tFile && tFile.extension == 'md' && this.editModeGuard()) {
                    if (!checking) {
                        const fileName = tFile.name;
                        const filePrefix = Utils.verifyAndGetPrefix(fileName);
                        const fileCache = this.app.metadataCache.getFileCache(tFile);
                        const frontmatter = fileCache.frontmatter;

                        // https://github.com/avirut/obsidian-metatemplates/blob/1a40b90c350a892248a21883b9a600473fdd89fc/main.ts#L123
                        const active_view: MarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                        const editor: CodeMirror.Editor = active_view.sourceMode.cmEditor;
                        const SEP = editor.lineSeparator();

                        // content 相关的读取
                        let doc: CodeMirror.Doc = editor.getDoc();
                        let content = doc.getValue();
                        let content_array: string[] = content.split("\n");

                        /*
                        # 执行检查及更新
                        - N. _没有_ frontmatter (aka. meta) , => 在顶部插入三行 meta
                        - Y.
                            - N. 有frontmatter, 但 _没有 "ID"_ => insert
                            - Y. 有frontmatter, 并且存在"ID"
                                - N. 有frontmatter, 有ID, 但 _ID 不匹配 prefix_ => update
                                - Y. 有frontmatter, 有ID, 且 ID 匹配 filePrefix => do NOTHING
                         */
                        if (!frontmatter) {
                            // N. 没有 frontmatter, 在顶部插入三行 meta
                            content_array.splice(0, 0, "---", `ID: ${filePrefix}`, "---", SEP);
                        } else {
                            const meta_id = frontmatter['ID'];
                            let pos = frontmatter.position;
                            if (!meta_id) {
                                // Y.N 有frontmatter , 但没有 "ID", insert
                                content_array.splice(pos.start.line + 1, 0, `ID: ${filePrefix}`);
                            } else {
                                // Y.Y 有 frontmatter (aka. meta) 中, 并且存在"ID", 检查是否相等
                                if (meta_id != filePrefix) {
                                    // Y.Y.N: 有frontmatter, 有 ID, 且 ID 不匹配 filePrefix
                                    // 找到 ID 行, update_id
                                    let split_meta_part = content_array.slice(pos.start.line, pos.end.line + 1);
                                    for (let i = pos.start.line; i < pos.end.line + 1; i++) {
                                        let line = content_array[i];
                                        if (line.toUpperCase().startsWith("ID: ")) {
                                            content_array[i] = `ID: ${filePrefix}`;
                                        }
                                    }
                                } else {
                                    // Y.Y.Y: 有frontmatter, 有 ID, 且 ID 匹配 filePrefix
                                }
                            }
                        }

                        doc.setValue(content_array.join("\n"));
                        editor.focus();
                        editor.refresh();
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

                        for (let link of embeds) {
                            const embed_tFile :TFile = this.app.metadataCache.getFirstLinkpathDest(link.link, "/");

                            // 被闭包引用
                            const app = this.app;
                            const adapter = this.app.vault.adapter;
                            const fileManager = this.app.fileManager;

                            // fs Promise
                            (async function() {
                                try {
                                    const buffer: ArrayBuffer = await adapter.readBinary(embed_tFile.path);

                                    // md5
                                    const fileMD5 = await md5Buffer(buffer);

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
        return zk_prefix;
    }

    private editModeGuard(): boolean {
        const mdView = this.app.workspace.activeLeaf.view as MarkdownView;
        if(!mdView || mdView.getMode() !== 'source') {
            // 通常情况, 不用触发, 直接在非编辑模式屏蔽这个后续的命令(checking)
            // new Notification(`Please use ${this.manifest.name}  in edit mode`, {
            //     timestamp: _.now()
            // });
            return false;
        }
        return true;
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SampleModal extends Modal {
    // 模态窗口
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        let {contentEl} = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        let {contentEl} = this;
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
        let {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Settings for my awesome plugin.(vlaw)'});
        containerEl.createEl("h3", {text: `version: ${this.plugin.manifest.version}`})

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc('It\'s a secret')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue('')
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}
