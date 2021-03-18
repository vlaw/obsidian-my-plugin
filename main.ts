import {App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import { compareAsc, format } from 'date-fns';
import * as _ from "lodash";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log(`loading plugin: ${this.manifest.name}(${this.manifest.id}): ${this.manifest.version} ts: ${new Date()}`);

		await this.loadSettings();

		// // RibbonIcon: 左侧侧边栏 icon
		// this.addRibbonIcon('dice', 'Sample Plugin', () => {
		// 	//  Notice: 右上方通知栏
		// 	new Notice('This is a notice!');
		// });

		// // StatusBarItem: 右下方状态栏
		// this.addStatusBarItem().setText('Status Bar Text');

        // 命令绑定, command palette => "My Plugin: Rename md by zk"
        // TODO: 需要通过 settings Tab 做一个ZK-Prefix 的模板
        const ZK_RE = /^\d{6}\-\d{6} /;
        this.addCommand({
            id: "rename-md-by-zk",
            name: "Rename md by zk",
            checkCallback: (checking: boolean) => {
                let tFile = this.app.workspace.getActiveFile();
                // 打开文件是 markdown 文件才有可能需要这个命令
                if (tFile && tFile.extension == 'md') {
                    if (!checking) {
                        let fileName = tFile.name;
                        // match
                        let match = fileName.match(ZK_RE);
                        if (!match) {
                            let zkPrefix = this.build_zk_prefix();
                            let newFileName = `${zkPrefix} ${fileName}`;
                            this.app.vault.adapter.rename(tFile.path, newFileName);
                        }
                    }
                    return true;
                }
                return false;
            }
        });

        // 命令绑定, command palette => "My Plugin: Open Sample Modal"
		this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => {
			    // Obsidian的 workspace 是支持 split 的
                // leaf是编辑区(workspace)的一个编辑区区域(类似于Vim 中的 Window, Tmux 的 Pane
				let leaf = this.app.workspace.activeLeaf;

				const fm = this.app.fileManager;
				const active_file = this.app.workspace.getActiveFile;
                const vault = this.app.vault;
                const vault_adaptor = vault.adapter;

                if (leaf) {
					if (!checking) {
					    // 全部的 md 文件
                        const markdownFiles = vault.getMarkdownFiles();
                        markdownFiles.forEach((markFile: TFile) =>{
                            console.log(markFile.path)
                        })
                        // 全部文件
                        const files = vault.getFiles();
                        console.log("全部文件:", files)

                        // new SampleModal(this.app).open();
					}
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));

		// this.registerCodeMirror((cm: CodeMirror.Editor) => {
		// 	// console.log('codemirror', cm);
		// });

		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	// console.log('click', evt);
		// });

		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

    private build_zk_prefix() {
        const today = new Date();
        let zk_prefix = format(today, "yyMMdd-HHmmss")
        console.log(`zk_prefix: ${zk_prefix}`)
        return zk_prefix;
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
