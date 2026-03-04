const SensorModel = require('../models/sensorModel');

// Variável em memória para o dashboard rápido
let ultimoStatus = { sensor_id: "Aguardando...", gas_level: 0, alerta: false };

exports.receberDados = async (req, res) => {
    try {
        const { sensor_id, gas_level } = req.body;
        const alerta = gas_level > 400;

        // Atualiza estado local para o frontend
        ultimoStatus = { 
            sensor_id, 
            gas_level, 
            alerta, 
            timestamp: new Date().toLocaleTimeString() 
        };

        // Salva no Postgres via Model e armazena o retorno para o log
        const novaLeitura = await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);
        
        // Agora o log funciona pois está dentro da função async
        console.log("✅ Dado inserido com sucesso! ID:", novaLeitura.id);

        res.status(201).json({ status: "sucesso", dados: ultimoStatus });
    } catch (error) {
        console.error("❌ Erro ao salvar leitura:", error.message);
        res.status(500).json({ status: "erro", msg: error.message });
    }
};

exports.getHistorico = async (req, res) => {
    try {
        const historico = await SensorModel.buscarHistorico();
        res.status(200).json(historico);
    } catch (error) {
        console.error("❌ Erro ao buscar histórico:", error.message);
        res.status(500).json({ status: "erro", msg: error.message });
    }
};


exports.getUltimoStatus = (req, res) => {
    res.json(ultimoStatus);
};