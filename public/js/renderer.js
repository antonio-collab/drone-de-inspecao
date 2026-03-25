const ctx = document.getElementById('gasChart').getContext('2d');

// 🔥 MULTI-SENSORES
const sensores = {};
let sensorSelecionado = null;

// 📊 Gráfico
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Nível de Gás',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true },
        },
        plugins: { legend: { display: false } }
    }
});


// 🔥 Renderiza sensores (COM DELETE + CLICK)
function renderizarSensores() {
    const container = document.getElementById('sensores-container');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(sensores).forEach(([id, sensor]) => {
        const card = document.createElement('div');
        card.className = 'card sensor-card';

        // 🔥 destaque do selecionado
        if (sensorSelecionado === id) {
            card.style.border = "2px solid #38bdf8";
        }

        const ultimo = sensor.historico.at(-1);

        card.innerHTML = `
            <button class="delete-btn" data-id="${id}">🗑️</button>

            <p style="color:#94a3b8;">Sensor</p>
            <h3>${id}</h3>

            <p style="color:#94a3b8;">Nível (PPM)</p>
            <div style="font-size:40px; font-weight:bold; color:${sensor.alerta ? 'red' : '#38bdf8'}">
                ${ultimo?.valor || 0}
            </div>

            <p style="color:${sensor.alerta ? 'red' : 'lime'}; font-weight:bold;">
                ${sensor.alerta ? '⚠️ ALERTA' : '✅ OK'}
            </p>

            <p style="font-size:12px; color:gray;">
                ${ultimo?.hora || ''}
            </p>
        `;

        // 🔥 CLICK → selecionar sensor
        card.addEventListener('click', () => {
            sensorSelecionado = id;
            atualizarGrafico(id);
            renderizarSensores();
        });

        // 🔥 DELETE SENSOR
        const btnDelete = card.querySelector('.delete-btn');

        btnDelete.addEventListener('click', async (e) => {
            e.stopPropagation(); // ❗ evita clicar no card

            if (!confirm(`Deseja apagar o sensor ${id}?`)) return;

            try {
                // 🔥 chama backend
                await fetch(`http://localhost:3000/sensor/delete-by-sensor/${id}`, {
                    method: 'DELETE'
                });

                // 🔥 remove do frontend
                delete sensores[id];

                // 🔥 se deletou o selecionado
                if (sensorSelecionado === id) {
                    sensorSelecionado = null;
                    chart.data.labels = [];
                    chart.data.datasets[0].data = [];
                    chart.update();
                }

                renderizarSensores();

            } catch (err) {
                console.error("Erro ao deletar sensor:", err);
            }
        });

        container.appendChild(card);
    });
}


// 🔥 Atualiza gráfico do sensor selecionado
function atualizarGrafico(sensor_id) {
    const sensor = sensores[sensor_id];
    if (!sensor) return;

    const labels = sensor.historico.map(p => p.hora);
    const data = sensor.historico.map(p => p.valor);

    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}


// 🔥 Atualiza dados
function atualizarTela(data) {
    const { sensor_id, gas_level, alerta } = data;

    if (!sensores[sensor_id]) {
        sensores[sensor_id] = {
            historico: [],
            alerta: false
        };
    }

    sensores[sensor_id].historico.push({
        valor: gas_level,
        hora: new Date().toLocaleTimeString()
    });

    sensores[sensor_id].alerta = alerta;

    // 🔥 seleciona primeiro automaticamente
    if (!sensorSelecionado) {
        sensorSelecionado = sensor_id;
    }

    renderizarSensores();

    if (sensorSelecionado === sensor_id) {
        atualizarGrafico(sensor_id);
    }
}


// 🔹 WebSocket
const socket = io('http://localhost:3000');

socket.on('mqtt-dado', (data) => {
    atualizarTela(data);
});


// 🔹 Carrega histórico
async function carregarUltimoEstado() {
    try {
        const response = await fetch('http://localhost:3000/sensor/historico');
        const dados = await response.json();

        dados.reverse().forEach(item => {
            atualizarTela(item);
        });

    } catch (error) {
        console.error("Falha na conexão com a API");
    }
}


// 🔹 PDF
document.getElementById('btn-download-pdf').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Relatório de Sensor - GásMar", 10, 20);

    if (!sensorSelecionado) {
        pdf.text("Nenhum sensor selecionado", 10, 40);
    } else {
        const sensor = sensores[sensorSelecionado];
        const ultimo = sensor.historico.at(-1);

        pdf.setFontSize(12);
        pdf.text(`Sensor: ${sensorSelecionado}`, 10, 40);
        pdf.text(`PPM: ${ultimo?.valor || 0}`, 10, 50);
        pdf.text(`Status: ${sensor.alerta ? 'ALERTA' : 'OK'}`, 10, 60);
    }

    const canvas = document.getElementById('gasChart');
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 70, 180, 90);

    pdf.save(`relatorio_${sensorSelecionado || 'geral'}.pdf`);
});


// Inicializa
carregarUltimoEstado();