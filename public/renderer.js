const ctx = document.getElementById('gasChart').getContext('2d');
let gasData = [];
let labels = [];

// Configuração do Gráfico Chart.js
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Nível de Gás',
            data: gasData,
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
            y: { beginAtZero: true, grid: { color: '#334155' } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

async function fetchData() {
    try {
        const response = await fetch('http://localhost:3000/sensor/status');
        const data = await response.json();

        // Referências dos elementos HTML
        const sensorIdEl = document.getElementById('sensor-id');
        const gasLevelEl = document.getElementById('gas-level');
        const statusTexto = document.getElementById('status-texto');
        const diagContainer = document.getElementById('diagnostico-container');
        const chip = document.getElementById('status-chip');
        const msg = document.getElementById('alerta-msg');

        // Atualiza Texto Básico
        sensorIdEl.innerText = data.sensor_id;
        gasLevelEl.innerText = data.gas_level;

        // --- LÓGICA DE DETECÇÃO E DIAGNÓSTICO ---
        if (data.alerta) {
            // Estado de Vazamento
            chip.className = 'status-badge status-alerta';
            chip.innerText = '⚠️ ALERTA CRÍTICO';
            msg.style.display = 'block';
            
            statusTexto.innerText = "⚠️ VAZAMENTO DE GÁS!";
            statusTexto.style.color = "var(--danger)";
            diagContainer.style.borderColor = "var(--danger)";
            gasLevelEl.style.color = "var(--danger)";
        } else {
            // Estado Normal
            chip.className = 'status-badge status-ok';
            chip.innerText = 'SISTEMA ONLINE';
            msg.style.display = 'none';

            statusTexto.innerText = "✅ Ar Seguro / Normal";
            statusTexto.style.color = "var(--success)";
            diagContainer.style.borderColor = "#334155";
            gasLevelEl.style.color = "var(--accent)";
        }

        // Atualiza Gráfico
        const now = new Date().toLocaleTimeString();
        if (labels.length > 20) { // Mantém apenas os últimos 20 pontos
            labels.shift();
            gasData.shift();
        }
        labels.push(now);
        gasData.push(data.gas_level);
        chart.update();

    } catch (error) {
        console.error("Falha na conexão com a API GásMar");
        document.getElementById('status-texto').innerText = "❌ API OFFLINE";
        document.getElementById('status-texto').style.color = "gray";
    }
}

// Consulta a API a cada 2 segundos
setInterval(fetchData, 2000);