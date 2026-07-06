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
const WA_GATEWAY_SECRET = process.env.WA_GATEWAY_SECRET || 'super_secret_wa_token';
const HTTP_PORT = process.env.HTTP_PORT || 3001;

let sock;
let qrCode = null;
let connectionStatus = 'DISCONNECTED';
let disconnectTimeout = null;

function startDisconnectTimer() {
    if (disconnectTimeout) return;
    console.log('Starting 1-minute disconnect timer. If device does not connect in 1 minute, session will be reset for a new scan...');
    disconnectTimeout = setTimeout(async () => {
        console.log('Device remained disconnected for 1 minute. Resetting session...');
        await resetSessionAndRescan();
    }, 60000);
}

function clearDisconnectTimer() {
    if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
        console.log('Device connected. Disconnect timer cleared.');
    }
}

function clearDirectoryContents(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                fs.rmSync(curPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(curPath);
            }
        }
        console.log(`Cleared contents of directory: ${dirPath}`);
    } catch (err) {
        console.error(`Failed to clear contents of ${dirPath}:`, err.message);
    }
}

async function resetSessionAndRescan() {
    if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
    }
    
    if (sock) {
        try {
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            sock.ev.removeAllListeners('messages.upsert');
            sock.end();
        } catch (e) {
            console.warn('Error closing socket:', e.message);
        }
        sock = null;
    }

    // Wait a brief moment to let socket file handles release
    await new Promise(resolve => setTimeout(resolve, 1000));

    clearDirectoryContents('auth_info_baileys');
    const absAuthFolder = path.join(__dirname, 'auth_info_baileys');
    if (absAuthFolder !== 'auth_info_baileys') {
        clearDirectoryContents(absAuthFolder);
    }

    connectionStatus = 'DISCONNECTED';
    qrCode = null;

    console.log('Re-initiating WhatsApp connection...');
    await connectToWhatsApp();
}

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
    startDisconnectTimer();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Fetch latest WA version to avoid 405 errors
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'info' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log('Connection update received:', { connection, qr: qr ? qr.substring(0, 15) + '...' : null, hasLastDisconnect: !!lastDisconnect });
        
        if (qr) {
            qrCode = await QRCode.toDataURL(qr);
            startDisconnectTimer();
        }

        if (connection === 'close') {
            connectionStatus = 'DISCONNECTED';
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut 
                : true;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                startDisconnectTimer();
                connectToWhatsApp();
            } else {
                await resetSessionAndRescan();
            }
        } else if (connection === 'open') {
            connectionStatus = 'CONNECTED';
            qrCode = null;
            clearDisconnectTimer();
            console.log('WhatsApp connection opened successfully!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            
            const from = msg.key.remoteJid;
            const isMe = msg.key.fromMe;
            
            let senderJid = isMe ? sock.user.id : (msg.key.participant || from);
            const senderNumber = senderJid.split('@')[0].split(':')[0];

            const messageType = Object.keys(msg.message)[0];
            const caption = (msg.message?.imageMessage?.caption || 
                             msg.message?.videoMessage?.caption || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.conversation || '').trim();

            if (!caption) continue;

            console.log(`Message from ${senderNumber} (isMe: ${isMe}): ${caption.substring(0, 50)}`);

            if (caption.toUpperCase().startsWith('BERITA#')) {
                console.log('Match BERITA# format detected!');

                let isAuthorized = false;
                try {
                    const authRes = await axios.get(`${BACKEND_URL}/api/wa-settings/numbers`);
                    const activeNumbers = authRes.data.filter(n => n.is_active).map(n => n.phone_number.toString().trim());
                    if (activeNumbers.includes(senderNumber)) {
                        isAuthorized = true;
                    }
                } catch (err) {
                    console.error('Failed to fetch authorized numbers:', err.message);
                }

                if (!isAuthorized) {
                    console.warn(`Unauthorized attempt from ${senderNumber}`);
                    await sock.sendMessage(from, { text: `❌ Nomor ${senderNumber} belum terdaftar sebagai admin berita di website.` });
                    continue;
                }

                const parts = caption.split('#');
                if (parts.length < 3) {
                    await sock.sendMessage(from, { text: 'Format salah. Gunakan: BERITA#JUDUL#ISI' });
                    continue;
                }

                const title = parts[1].trim();
                const content = parts[2].trim();
                let mediaPath = null;
                let isVideo = false;

                try {
                    await sock.sendMessage(from, { text: 'Berita akan kami muat, terima kasih. ⏳ Sedang memproses...' });

                    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        
                        // Check Size: 50MB
                        const MAX_SIZE = 50 * 1024 * 1024;
                        if (buffer.length > MAX_SIZE) {
                            await sock.sendMessage(from, { text: '❌ Gagal: Ukuran media terlalu besar (Maksimal 50MB).' });
                            return;
                        }

                        isVideo = (messageType === 'videoMessage');
                        const ext = isVideo ? 'mp4' : 'jpg';
                        const filename = `wa_upload_${Date.now()}.${ext}`;
                        mediaPath = path.join(__dirname, filename);
                        fs.writeFileSync(mediaPath, buffer);
                    }

                    const loginRes = await axios.post(`${BACKEND_URL}/api/token`, 
                        new URLSearchParams({ 'username': 'wa_gateway', 'password': WA_GATEWAY_SECRET }), 
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    );

                    const token = loginRes.data.access_token;

                    const FormData = require('form-data');
                    const form = new FormData();
                    form.append('title', title);
                    form.append('content', content);
                    if (mediaPath) {
                        if (isVideo) {
                            form.append('video', fs.createReadStream(mediaPath));
                        } else {
                            form.append('image', fs.createReadStream(mediaPath));
                        }
                    }

                    const newsRes = await axios.post(`${BACKEND_URL}/api/news/`, form, {
                        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` }
                    });

                    await sock.sendMessage(from, { text: `✅ Berita Berhasil Diupload!\n\nJudul: ${title}\nLink: https://smkbn666.sch.id/news` });
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);

                } catch (error) {
                    const errorDetail = error.response?.data?.detail || error.message;
                    console.error('Error posting news:', errorDetail);
                    await sock.sendMessage(from, { text: `❌ Gagal: ${errorDetail}` });
                    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                }
            }
        }
    });
}

connectToWhatsApp();
