import { App, Modal } from 'obsidian';

export default class AlertModal extends Modal {
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
