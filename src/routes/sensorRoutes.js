const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// 🔹 CREATE
router.post('/data', sensorController.receberDados);

// 🔹 READ
router.get('/status', sensorController.getUltimoStatus);
router.get('/historico', sensorController.getHistorico);

// 🔹 UPDATE (por ID da leitura)
router.put('/update/:id', sensorController.atualizarLeitura);

// 🔹 DELETE (por ID da leitura)
router.delete('/delete/:id', sensorController.deletarLeitura);

module.exports = router;