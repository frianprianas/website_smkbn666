const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const ADMIN_NUMBERS = (process.env.AUTHORIZED_NUMBERS || '').split(',').map(n => n.trim() + '@s.whatsapp.net');
const WA_USERNAME = process.env.WA_USERNAME || 'admin';
const WA_PASSWORD = process.env.WA_PASSWORD || 'admin_password';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection opened successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            
            const from = msg.key.remoteJid;
            const isMe = msg.key.fromMe;
            if (isMe) continue;

            // Check if sender is authorized
            if (!ADMIN_NUMBERS.includes(from)) {
                // Optional: reply with unauthorized message
                // await sock.sendMessage(from, { text: 'Maaf, nomor Anda tidak terdaftar untuk update berita.' });
                continue;
            }

            const messageType = Object.keys(msg.message)[0];
            const caption = msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || msg.message?.extendedTextMessage?.text || msg.message?.conversation || '';

            // Format check: BERITA#JUDUL#ISI
            if (caption.startsWith('BERITA#')) {
                const parts = caption.split('#');
                if (parts.length < 3) {
                    await sock.sendMessage(from, { text: 'Format salah. Gunakan: BERITA#JUDUL#ISI (sambil melampirkan foto)' });
                    continue;
                }

                const title = parts[1].trim();
                const content = parts[2].trim();
                let mediaPath = null;

                try {
                    await sock.sendMessage(from, { text: '⏳ Sedang memproses berita Anda...' });

                    // Handle Media
                    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        const ext = messageType === 'imageMessage' ? 'jpg' : 'mp4';
                        const filename = `wa_upload_${Date.now()}.${ext}`;
                        mediaPath = path.join(__dirname, filename);
                        fs.writeFileSync(mediaPath, buffer);
                    }

                    // Login to Backend to get token
                    const loginRes = await axios.post(`${BACKEND_URL}/api/token`, 
                        new URLSearchParams({
                            'username': WA_USERNAME,
                            'password': WA_PASSWORD
                        }), {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                        }
                    );

                    const token = loginRes.data.access_token;

                    // Prepare Form Data for News
                    const FormData = require('form-data');
                    const form = new FormData();
                    form.append('title', title);
                    form.append('content', content);
                    if (mediaPath) {
                        form.append('image', fs.createReadStream(mediaPath));
                    }

                    // Post News
                    const newsRes = await axios.post(`${BACKEND_URL}/api/news/`, form, {
                        headers: {
                            ...form.getHeaders(),
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    // Success!
                    await sock.sendMessage(from, { text: `✅ Berita Berhasil Diupload!\n\nJudul: ${title}\nLink: https://smkbn666.sch.id/news` });

                    // Cleanup
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);

                } catch (error) {
                    console.error('Error posting news:', error.response?.data || error.message);
                    await sock.sendMessage(from, { text: `❌ Gagal mengupload berita: ${error.response?.data?.detail || error.message}` });
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                }
            }
        }
    });
}

connectToWhatsApp();
