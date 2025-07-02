const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const ADM_NUMBER = '5513997595234@s.whatsapp.net';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Conexão fechada, reconectando...');
            startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot conectado!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();

        console.log('📩 Mensagem recebida:', body);

        if (['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'salve', 'eae'].includes(body)) {
            await sock.sendMessage(from, {
                text: `🍕 Olá! Seja bem-vindo(a) à Francescolli Pizzaria! Quer pedir uma pizza deliciosa? \n\nDigite:\n1 - Fazer pedido\n2 - Cardápio\n3 - Falar com atendente`
            });
            return;
        }

        if (body === '1') {
            await sock.sendMessage(from, { text: '🍕 Ótimo! Por favor, envie o seu pedido detalhado.' });
            await sock.sendMessage(ADM_NUMBER, { text: `🛒 Cliente ${from} iniciou um pedido.` });
            return;
        }

        if (body === '2' || body === 'cardapio' || body === 'cardápio') {
            try {
                const imageBuffer = fs.readFileSync(path.join(__dirname, 'cardapio.jpg'));
                await sock.sendMessage(from, {
                    image: imageBuffer,
                    caption: '📋 Este é o nosso cardápio! Escolha sua pizza favorita 🍕'
                });
                await sock.sendMessage(ADM_NUMBER, { text: `📁 Cliente ${from} visualizou o cardápio.` });
            } catch (err) {
                console.error('Erro ao enviar cardápio:', err);
                await sock.sendMessage(from, { text: '❌ Erro ao enviar cardápio.' });
            }
            return;
        }

        if (body === '3') {
            await sock.sendMessage(from, { text: '👨‍💼 Um atendente será chamado para te ajudar em instantes!' });
            await sock.sendMessage(ADM_NUMBER, { text: `📞 Cliente ${from} solicitou atendimento humano.` });
            return;
        }

        await sock.sendMessage(from, {
            text: '🤔 Não entendi. Por favor, digite uma das opções:\n1 - Fazer pedido\n2 - Cardápio\n3 - Falar com atendente'
        });
    });
}

startBot();
