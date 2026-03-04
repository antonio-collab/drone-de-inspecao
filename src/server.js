
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt'); // Importa o MQTT
const sensorRoutes = require('./routes/sensorRoutes'); 
const SensorModel = require('./models/sensorModel'); // Precisamos dele para salvar as mensagens MQTT

const app = express();

app.use(cors());
app.use(express.json());

console.log("-----------------------------------------");
console.log("O SERVIDOR ESTÁ RODANDO COM MQTT ATIVO!");
console.log("-----------------------------------------");

// --- CONFIGURAÇÃO MQTT ---
const brokerUrl = 'mqtt://broker.hivemq.com'; // Pode trocar pelo seu broker
const topic = 'gasmar/sensor/leitura';
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
    console.log('Conectado ao Broker MQTT');
    client.subscribe(topic);
});

client.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const { sensor_id, gas_level } = payload;
        const alerta = gas_level > 400;

        // Salva no SQLite usando o Model que você já criou
        await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);
        console.log(`📡 [MQTT] Novo dado salvo: ID ${sensor_id} - Nível: ${gas_level}`);
    } catch (err) {
        console.error('❌ Erro ao processar mensagem MQTT:', err.message);
    }
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Teste o histórico em: http://localhost:${PORT}/sensor/historico`);
});