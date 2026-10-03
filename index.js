const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Botの権限設定（サーバー情報とボイスステータス情報の取得を許可）
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// 通知先のテキストチャンネルIDを環境変数から取得
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID;

// Bot起動時の処理
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// ボイスチャンネルのステータスが更新されたときの処理
client.on('voiceStateUpdate', (oldState, newState) => {
    // oldStateにチャンネルIDがなく、newStateにチャンネルIDがある場合＝「入室」
    if (!oldState.channelId && newState.channelId) {
        
        // チャンネル内に他の人がいない（最初の一人目）場合のみ通知したい場合は以下のコメントアウトを外す
        // if (newState.channel.members.size !== 1) return;

        const channel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
        if (channel) {
            channel.send(`${newState.member.user.username} さんがボイスチャンネル「${newState.channel.name}」で通話を開始しました！`);
        } else {
            console.error('指定された通知先チャンネルが見つかりません。');
        }
    }
});

// Discordにログイン
client.login(process.env.DISCORD_TOKEN);
