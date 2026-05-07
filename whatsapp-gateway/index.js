// Polyfill for global crypto if not present (required by baileys in some environments)
if (!global.crypto) {
    try {
        global.crypto = require('crypto').webcrypto;
    } catch (e) {
        console.warn('Webcrypto polyfill failed:', e.message);
    }
}

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const WA_USERNAME = process.env.WA_USERNAME || 'admin';
const WA_PASSWORD = process.env.WA_PASSWORD || 'admin_password';
const HTTP_PORT = process.env.HTTP_PORT || 3001;

let sock;
let qrCode = null;
let connectionStatus = 'DISCONNECTED';

const app = express();

// --- API for Frontend/Backend to query status ---
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrCode
    });
});

app.listen(HTTP_PORT, () => {
    console.log(`Gateway API listening on port ${HTTP_PORT}`);
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Fetch latest WA version to avoid 405 errors
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCode = await QRCode.toDataURL(qr);
        }

        if (connection === 'close') {
            connectionStatus = 'DISCONNECTED';
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            connectionStatus = 'CONNECTED';
            qrCode = null;
            console.log('WhatsApp connection opened successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            
            const from = msg.key.remoteJid;
            const isMe = msg.key.fromMe;
            
            // Determine real sender number
            // If from group, participant is the sender. If private chat, remoteJid is the sender.
            // If it's from me (master), the sender is the master number.
            let senderJid = isMe ? sock.user.id : (msg.key.participant || from);
            const senderNumber = senderJid.split('@')[0].split(':')[0];

            const messageType = Object.keys(msg.message)[0];
            const caption = (msg.message?.imageMessage?.caption || 
                             msg.message?.videoMessage?.caption || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.conversation || '').trim();

            if (!caption) continue;

            // Log for debugging
            console.log(`Message from ${senderNumber} (isMe: ${isMe}): ${caption.substring(0, 50)}`);

            // Check if it's a news format (CASE INSENSITIVE)
            if (caption.toUpperCase().startsWith('BERITA#')) {
                console.log('Match BERITA# format detected!');

                // --- FETCH AUTHORIZED NUMBERS FROM BACKEND ---
                let isAuthorized = false;
                try {
                    const authRes = await axios.get(`${BACKEND_URL}/api/wa-settings/numbers`);
                    const activeNumbers = authRes.data.filter(n => n.is_active).map(n => n.phone_number.toString().trim());
                    
                    // Special case: Master account is always authorized if the number is registered
                    if (activeNumbers.includes(senderNumber)) {
                        isAuthorized = true;
                    }
                } catch (err) {
                    console.error('Failed to fetch authorized numbers:', err.message);
                }

                if (!isAuthorized) {
                    console.warn(`Unauthorized attempt from ${senderNumber}`);
                    await sock.sendMessage(from, { text: `❌ Nomor ${senderNumber} belum terdaftar sebagai admin berita di website. Silakan daftarkan di menu WhatsApp Gateway.` });
                    continue;
                }

                const parts = caption.split('#');
                if (parts.length < 3) {
                    await sock.sendMessage(from, { text: 'Format salah. Gunakan: BERITA#JUDUL#ISI (sambil melampirkan foto)' });
                    continue;
                }

                const title = parts[1].trim();
                const content = parts[2].trim();
                let mediaPath = null;

                try {
                    // Send initial response
                    await sock.sendMessage(from, { text: 'Berita akan kami muat, terima kasih. ⏳ Sedang memproses...' });

                    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        const ext = messageType === 'imageMessage' ? 'jpg' : 'mp4';
                        const filename = `wa_upload_${Date.now()}.${ext}`;
                        mediaPath = path.join(__dirname, filename);
                        fs.writeFileSync(mediaPath, buffer);
                        console.log(`Media downloaded to ${mediaPath}`);
                    }

                    // Login to backend
                    const loginRes = await axios.post(`${BACKEND_URL}/api/token`, 
                        new URLSearchParams({ 'username': WA_USERNAME, 'password': WA_PASSWORD }), 
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    );

                    const token = loginRes.data.access_token;

                    const FormData = require('form-data');
                    const form = new FormData();
                    form.append('title', title);
                    form.append('content', content);
                    if (mediaPath) {
                        form.append('image', fs.createReadStream(mediaPath));
                    }

                    const newsRes = await axios.post(`${BACKEND_URL}/api/news/`, form, {
                        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` }
                    });

                    console.log(`News posted successfully! ID: ${newsRes.data.id}`);
                    await sock.sendMessage(from, { text: `✅ Berita Berhasil Diupload!\n\nJudul: ${title}\nLink: https://smkbn666.sch.id/news` });
                    
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);

                } catch (error) {
                    const errorDetail = error.response?.data?.detail || error.message;
                    console.error('Error posting news:', errorDetail);
                    await sock.sendMessage(from, { text: `❌ Gagal mengupload berita: ${errorDetail}` });
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                }
            }
        }
    });
}

connectToWhatsApp();
