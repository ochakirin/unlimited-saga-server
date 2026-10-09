const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID;

const TARGET_VOICE_CHANNELS = {
    "1157321999874527342": "🎮 **本日のアンサガ合宿がはじまりました！わからないところを聞きに行ってみよう！",
    "447364092865544203": "☕ **住職が参りました。本日も心鎮めアンサガと向き合うのです。",
    "447364193822441473": "💻 **神主が参りました。本日もアンサガのために禊ましょう！",
    "447392490090266635": "🚨 **本日もお祈りの時間です！アンサガに祈りを捧げましょう。"
};

// ======== スプレッドシート監視＆配信通知システム ========
// スプレッドシートのID（ご提示いただいたURLから抽出）
const SPREADSHEET_ID = '1yPiAax5SdAZ30AploCsyv9UwZO_zXuGAKEMhZPbAsuo';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

// 通知済みURLを記憶し、連投を防ぐメモリ（Bot再起動でリセットされます）
const notifiedUrls = new Set();

async function checkSpreadsheetForLiveStreams() {
    try {
        // Node.js v18以上であれば標準の fetch が動作します
        const response = await fetch(CSV_URL);
        if (!response.ok) return;
        
        const csvText = await response.text();
        const rows = csvText.split('\n');
        
        // 1行目は見出しなので 1 (2行目) からループ
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;

            // カンマ区切りの簡易パース（セル内のカンマなどを保護）
            const cols = [];
            let inQuotes = false, val = '';
            for (let char of row) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) { cols.push(val.trim()); val = ''; }
                else val += char;
            }
            cols.push(val.trim());

            if (cols.length < 4) continue; // A列(名前), B列(URL), C列(状態), D列(判定)が存在するか
            
            const name = cols[0];
            const url = cols[1];
            const status = cols[2];
            const usaga = cols[3];
            
            if (!url) continue;

            // 配信中 かつ アンサガ配信中の場合
            if (status === '配信中' && usaga === 'アンサガ配信中') {
                if (!notifiedUrls.has(url)) {
                    const notificationChannel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
                    if (notificationChannel) {
                        notificationChannel.send(`📺 **${name}** さんが アンサガ の配信を開始しました！\n${url}`);
                    }
                    notifiedUrls.add(url); // 通知済みに登録
                }
            } else if (status === 'オフライン' || status === '取得エラー') {
                // 配信が終わったら通知済みメモリから削除し、次回また通知できるようにする
                if (notifiedUrls.has(url)) {
                    notifiedUrls.delete(url);
                }
            }
        }
    } catch (error) {
        console.error('スプレッドシート取得エラー:', error.message);
    }
}
// ======================================================

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Bot起動時に1回スプレッドシートを確認し、以降は3分おき（180000ミリ秒）に確認する
    checkSpreadsheetForLiveStreams();
    setInterval(checkSpreadsheetForLiveStreams, 3 * 60 * 1000);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!oldState.channelId && newState.channelId || oldState.channelId !== newState.channelId && newState.channelId) {
        const joinedChannelId = newState.channelId;
        if (TARGET_VOICE_CHANNELS[joinedChannelId]) {
            if (newState.channel.members.size === 1) {
                const notificationChannel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
                if (notificationChannel) {
                    let customMessage = TARGET_VOICE_CHANNELS[joinedChannelId];
                    notificationChannel.send(customMessage);
                } else {
                    console.error('指定された通知先チャンネルが見つかりません。');
                }
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
