const SensorModel = require('../models/sensorModel');

// Mantém o último status para o frontend
let ultimoStatus = { 
    sensor_id: "Aguardando...", 
    gas_level: 0, 
    alerta: false, 
    timestamp: null 
};

const SensorController = {

    /**
     * 📥 Recebe novos dados (MQTT ou POST)
     */
    async receberDados(sensor_id, gas_level) {
        try {
            const alerta = gas_level > 2500;

            // Atualiza status em memória
            ultimoStatus = {
                sensor_id,
                gas_level,
                alerta,
                timestamp: new Date().toLocaleTimeString()
            };

            // Salva no banco
            const novaLeitura = await SensorModel.salvarLeitura(sensor_id, gas_level, alerta);

            console.log("✅ Dado inserido! ID:", novaLeitura.id);

            return ultimoStatus;

        } catch (error) {
            console.error("❌ Erro ao salvar leitura:", error.message);
            throw error;
        }
    },

    /**
     * 📊 GET - Último status
     */
    getUltimoStatus(req, res) {
        res.json({
            success: true,
            data: ultimoStatus
        });
    },

    /**
     * 📊 GET - Histórico
     */
    async getHistorico(req, res) {
        try {
            const historico = await SensorModel.buscarHistorico();

            res.json({
                success: true,
                total: historico.length,
                data: historico
            });

        } catch (error) {
            console.error("❌ Erro ao buscar histórico:", error.message);
            res.status(500).json({
                success: false,
                erro: error.message
            });
        }
    },

    /**
     * 🔄 PUT - Atualizar leitura
     */
    async atualizarLeitura(req, res) {
        try {
            const { id } = req.params;
            const { gas_level } = req.body;

            // validação
            if (gas_level == null || isNaN(gas_level)) {
                return res.status(400).json({
                    success: false,
                    erro: "gas_level inválido"
                });
            }

            const alerta = gas_level > 400;

            const result = await SensorModel.atualizarLeitura(id, gas_level, alerta);

            if (result.updated === 0) {
                return res.status(404).json({
                    success: false,
                    msg: "Leitura não encontrada"
                });
            }

            res.json({
                success: true,
                msg: "Leitura atualizada",
                result
            });

        } catch (error) {
            console.error("❌ Erro ao atualizar:", error.message);
            res.status(500).json({
                success: false,
                erro: error.message
            });
        }
    },

    /**
     * 🗑️ DELETE - Deletar leitura
     */
    async deletarLeitura(req, res) {
        try {
            const { id } = req.params;

            const result = await SensorModel.deletarLeitura(id);

            if (result.deleted === 0) {
                return res.status(404).json({
                    success: false,
                    msg: "Leitura não encontrada"
                });
            }

            res.json({
                success: true,
                msg: "Leitura deletada",
                result
            });

        } catch (error) {
            console.error("❌ Erro ao deletar:", error.message);
            res.status(500).json({
                success: false,
                erro: error.message
            });
        }
    },

    /**
     * 🧹 DELETE - Apagar tudo de um sensor (EXTRA 🔥)
     */
    async deletarPorSensor(req, res) {
        try {
            const { sensor_id } = req.params;

            const result = await SensorModel.deletarPorSensor(sensor_id);

            res.json({
                success: true,
                msg: `Dados do sensor ${sensor_id} removidos`,
                result
            });

        } catch (error) {
            console.error("❌ Erro ao deletar sensor:", error.message);
            res.status(500).json({
                success: false,
                erro: error.message
            });
        }
    }

};

module.exports = SensorController;