
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const sensorRoutes = require('./routes/sensorRoutes'); 
const SensorModel = require('./models/sensorModel');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
app.use(cors());
app.use(express.json());

// Criando servidor HTTP e integrando Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // ajustar para seu frontend em produção
});

console.log("-----------------------------------------");
console.log("O SERVIDOR ESTÁ RODANDO COM MQTT (MOSQUITTO)!");
console.log("-----------------------------------------");

// --- CONFIGURAÇÃO MQTT ---
const brokerUrl = 'mqtt://localhost:1883';
const topic = 'gasmar/sensor/leitura';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('✅ Conectado ao Mosquitto!');
    client.subscribe(topic);
});

// 🔥 ADAPTADO PARA "GAS:1940"
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
    res.send('Servidor está respondendo!');
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