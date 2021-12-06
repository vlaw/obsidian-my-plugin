npm run-script build;

trash $ObsidianVault/.obsidian/plugins/obsidian-my-plugin/main.js
trash $ObsidianVault/.obsidian/plugins/obsidian-my-plugin/manifest.json

/bin/cp -vf main.js manifest.json $ObsidianVault/.obsidian/plugins/obsidian-my-plugin/

terminal-notifier -message 'done~'
