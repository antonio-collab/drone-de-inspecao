const db = require('../config/db');

const SensorModel = {
    /**
     * 📥 Salva nova leitura
     */
    salvarLeitura(sensor_id, gas_level, alerta) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO leituras_gas (sensor_id, gas_level, alerta) 
                VALUES (?, ?, ?)
            `;

            db.run(query, [sensor_id, gas_level, alerta], function(err) {
                if (err) {
                    console.error("❌ Erro ao inserir:", err.message);
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        sensor_id,
                        gas_level,
                        alerta
                    });
                }
            });
        });
    },

    /**
     * 📊 Histórico (últimos 50)
     */
    buscarHistorico() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM leituras_gas
                ORDER BY data_hora DESC
                LIMIT 50
            `;

            db.all(query, [], (err, rows) => {
                if (err) {
                    console.error("❌ Erro ao buscar histórico:", err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    /**
     * 🔥 Última leitura
     */
    pegarUltimaLeitura() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM leituras_gas
                ORDER BY data_hora DESC
                LIMIT 1
            `;

            db.get(query, [], (err, row) => {
                if (err) {
                    console.error("❌ Erro ao buscar última leitura:", err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    /**
     * 🔄 Atualizar leitura por ID
     */
    atualizarLeitura(id, gas_level, alerta) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE leituras_gas
                SET gas_level = ?, alerta = ?
                WHERE id = ?
            `;

            db.run(query, [gas_level, alerta, id], function(err) {
                if (err) {
                    console.error("❌ Erro ao atualizar:", err.message);
                    reject(err);
                } else {
                    resolve({
                        updated: this.changes
                    });
                }
            });
        });
    },

    /**
     * 🗑️ Deletar leitura por ID
     */
    deletarLeitura(id) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM leituras_gas
                WHERE id = ?
            `;

            db.run(query, [id], function(err) {
                if (err) {
                    console.error("❌ Erro ao deletar:", err.message);
                    reject(err);
                } else {
                    resolve({
                        deleted: this.changes
                    });
                }
            });
        });
    },

    /**
     * 🧹 Deletar todas leituras de um sensor (EXTRA 🔥)
     */
    deletarPorSensor(sensor_id) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM leituras_gas
                WHERE sensor_id = ?
            `;

            db.run(query, [sensor_id], function(err) {
                if (err) {
                    console.error("❌ Erro ao deletar sensor:", err.message);
                    reject(err);
                } else {
                    resolve({
                        deleted: this.changes
                    });
                }
            });
        });
    }
};

module.exports = SensorModel;