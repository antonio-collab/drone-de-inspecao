
require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mqtt = require('mqtt'); // Importa o MQTT
// const sensorRoutes = require('./routes/sensorRoutes'); 
// const SensorModel = require('./models/sensorModel'); // Precisamos dele para salvar as mensagens MQTT

// const app = express();

// app.use(cors());
// app.use(express.json());

// console.log("-----------------------------------------");
// console.log("O SERVIDOR ESTÁ RODANDO COM MQTT ATIVO!");
// console.log("-----------------------------------------");

// // --- CONFIGURAÇÃO MQTT ---
// // const brokerUrl = 'mqtt://broker.hivemq.com'; // Pode trocar pelo seu broker
// const brokerUrl = 'mqtt://localhost:1883';
// const topic = 'gasmar/sensor/leitura';
// const client = mqtt.connect(brokerUrl);

// client.on('connect', () => {
//     console.log('Conectado ao Broker MQTT');
//     client.subscribe(topic);
// });

// // client.on('message', async (topic, message) => {
// //     try {
// //         const payload = JSON.parse(message.toString());
// //         const { sensor_id, gas_level } = payload;
// //         const alerta = gas_level > 400;

// //         // Salva no SQLite usando o Model que você já criou
// //         await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);
// //         console.log(`[MQTT] Novo dado salvo: ID ${sensor_id} - Nível: ${gas_level}`);
// //     } catch (err) {
// //         console.error('Erro ao processar mensagem MQTT:', err.message);
// //     }
// // });
// client.on('message', async (topic, message) => {
//     const msgString = message.toString();

//     // 🔎 DEBUG - mostra tudo que chega
//     console.log("=================================");
//     console.log("📡 Mensagem MQTT recebida");
//     console.log("Tópico:", topic);
//     console.log("Payload bruto:", msgString);
//     console.log("=================================");

//     try {
//         const payload = JSON.parse(msgString);
//         const { sensor_id, gas_level } = payload;
//         const alerta = gas_level > 400;

//         await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);

//         console.log(`✅ Salvo no banco | ID: ${sensor_id} | Gás: ${gas_level} | Alerta: ${alerta}`);
//     } catch (err) {
//         console.error("❌ Erro ao processar JSON:", err.message);
//     }
// });

// app.get('/teste-direto', (req, res) => {
//     res.send('Servidor está respondendo a rotas GET!');
// });

// app.use('/sensor', sensorRoutes);

// app.use((req, res) => {
//     res.status(404).json({ 
//         erro: "Rota não encontrada", 
//         url_tentada: req.originalUrl 
//     });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`API rodando em http://localhost:${PORT}`);
//     console.log(`Teste o histórico em: http://localhost:${PORT}/sensor/historico`);
// });
//require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const http = require('http'); // necessário para integrar Socket.io
const { Server } = require('socket.io');

const sensorRoutes = require('./routes/sensorRoutes'); 
const SensorModel = require('./models/sensorModel'); // salvar no SQLite

const app = express();
app.use(cors());
app.use(express.json());

// Criando servidor HTTP e integrando Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // ajustar para seu frontend em produção
});

console.log("-----------------------------------------");
console.log("O SERVIDOR ESTÁ RODANDO COM MQTT ATIVO!");
console.log("-----------------------------------------");

// --- CONFIGURAÇÃO MQTT ---
const brokerUrl = 'mqtt://localhost:1883';
const topic = 'gasmar/sensor/leitura';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Conectado ao Broker MQTT');
    client.subscribe(topic);
});

client.on('message', async (topic, message) => {
    const msgString = message.toString();

    // DEBUG - mostra tudo que chega
    console.log("=================================");
    console.log("📡 Mensagem MQTT recebida");
    console.log("Tópico:", topic);
    console.log("Payload bruto:", msgString);
    console.log("=================================");

    try {
        const payload = JSON.parse(msgString);

        // Validação mínima
        if (!payload.sensor_id || payload.gas_level == null) {
            console.warn("Payload incompleto:", payload);
            return;
        }

        const sensor_id = payload.sensor_id;
        const gas_level = Number(payload.gas_level);
        const alerta = gas_level > 400;

        // Salva no banco
        await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);
        console.log(`✅ Salvo no banco | ID: ${sensor_id} | Gás: ${gas_level} | Alerta: ${alerta}`);

        // Envia para todos frontends conectados via WebSocket
        io.emit('mqtt-dado', { sensor_id, gas_level, alerta });

    } catch (err) {
        console.error("❌ Erro ao processar JSON:", err.message);
    }
});

// Rotas REST
app.get('/teste-direto', (req, res) => {
    res.send('Servidor está respondendo a rotas GET!');
});

app.use('/sensor', sensorRoutes);

app.use((req, res) => {
    res.status(404).json({ 
        erro: "Rota não encontrada", 
        url_tentada: req.originalUrl 
    });
});

// Subindo o servidor HTTP (com Socket.io integrado)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Teste o histórico em: http://localhost:${PORT}/sensor/historico`);
});