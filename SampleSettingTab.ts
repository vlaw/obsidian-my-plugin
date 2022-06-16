import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export default class SampleSettingTab extends PluginSettingTab {
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
        containerEl.createEl("h3", { text: `version: ${this.plugin.manifest.version}` });

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
