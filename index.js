const { INSPECT_MAX_BYTES } = require('buffer');
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs');
// include the Node.js 'path' module at the top of your file
const path = require('path')

win = null;

workingPath = "Untitled.json";

// modify your existing createWindow() function
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('index.html');
    win.setMenuBarVisibility(false);
    win.webContents.on('did-finish-load', () => {
        win.setTitle("Benzene: " + workingPath);
    })
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('saveAs', (event) => {
    dialog.showSaveDialog(win, {
        title: "Save model as...",
        filters: [
            { name: "Benzene model (.json)", extensions: ["json"] },
            { name: "All files", extensions: ['*'] }
        ],
        defaultPath: workingPath
    }).then((e) => {
        if (!e.canceled) {
            workingPath = e.filePath;
            win.setTitle("Benzene: " + workingPath);
            event.sender.send('requestSave');
        }
    })
})

ipcMain.on('save', (event, data) => {
    if (workingPath == "Untitled.json") {
        event.sender.send('requestSaveAs');
    } else {
        fs.writeFileSync(workingPath,data,'utf-8');
        event.sender.send('saveSuccess');
    }
})

ipcMain.on('loadFile', (event) => {
    dialog.showOpenDialog(win, {
        title: "Load model",
        filters: [
            { name: "Benzene model (.json)", extensions: ["json"] },
            { name: "All files", extensions: ['*'] }
        ],
        defaultPath: workingPath,
        properties: [ 'openFile', 'createDirectory' ] 
    }).then((e) => {
        if (!e.canceled) {
            workingPath = e.filePaths[0];
            win.setTitle("Benzene: " + workingPath);
            var contents = fs.readFileSync(workingPath, 'utf-8');
            event.sender.send('requestLoad', contents);
        }
    })  
})

ipcMain.on('clear', (event) => {
    workingPath = "Untitled.json";
})

ipcMain.on('notSaved', (event) => {
    win.setTitle("Benzene: " + workingPath + " (Unsaved changes*)");
})

ipcMain.on('yesSaved', (event) => {
    win.setTitle("Benzene: " + workingPath);
})