npm run-script build;

trash /Users/luowentao/ObsidianVaults/ObsidianVaults.Sample/.obsidian/plugins/obsidian-my-plugin/main.js
trash /Users/luowentao/ObsidianVaults/ObsidianVaults.Sample/.obsidian/plugins/obsidian-my-plugin/manifest.json

/bin/cp -vf main.js manifest.json /Users/luowentao/ObsidianVaults/ObsidianVaults.Sample/.obsidian/plugins/obsidian-my-plugin/

terminal-notifier -message 'done~'
