const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 600,
    title: "Monitor de Gás IoT",
    resizable: false, // Opcional: trava o tamanho da janela
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Remove o menu superior padrão (opcional)
  win.setMenuBarVisibility(false);

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Fecha o app completamente ao fechar a janela (exceto no Mac)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});