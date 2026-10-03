const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// 通知先のテキストチャンネルID（環境変数から取得）
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID;

// ★ 監視するボイスチャンネルのIDと、通知内容の設定
// "ボイスチャンネルのID": "送りたい通知メッセージ" の形式で4つ設定します。
// ※左側のIDは、実際のボイスチャンネルのIDに書き換えてください。
const TARGET_VOICE_CHANNELS = {
    "1157321999874527342": "🎮 **本日のアンサガ合宿がはじまりました！わからないところを聞きに行ってみよう！",
    "447364092865544203": "☕ **住職が参りました。本日も心鎮めアンサガと向き合うのです。",
    "447364193822441473": "💻 **神主が参りました。本日もアンサガのために禊ましょう！",
    "447392490090266635": "🚨 **本日もお祈りの時間です！アンサガに祈りを捧げましょう。"
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // 誰かがボイスチャンネルに入室したかチェック（移動してきた場合も含める）
    if (!oldState.channelId && newState.channelId || oldState.channelId !== newState.channelId && newState.channelId) {
        
        const joinedChannelId = newState.channelId;

        // 入室したチャンネルが、設定した4つの監視対象リストに含まれているか確認
        if (TARGET_VOICE_CHANNELS[joinedChannelId]) {
            
            // 「通話が始まった」タイミング（＝最初の一人が入室して人数が1人になった時）のみ通知
            if (newState.channel.members.size === 1) {
                
                const notificationChannel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
                
                if (notificationChannel) {
                    // 設定したカスタムメッセージを取得
                    let customMessage = TARGET_VOICE_CHANNELS[joinedChannelId];
                    
                    // （オプション）誰が通話を始めたか名前を入れたい場合は以下を有効化
                    // customMessage = `${newState.member.user.username}さんが開始しました！\n${customMessage}`;

                    notificationChannel.send(customMessage);
                } else {
                    console.error('指定された通知先チャンネルが見つかりません。');
                }
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
