import { ipcMain, BrowserWindow, app } from 'electron'

export function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle('window:devtools', (event, open: boolean) => {
    const wc = BrowserWindow.fromWebContents(event.sender)?.webContents
    if (!wc) return
    if (open) {
      wc.openDevTools()
    } else {
      wc.closeDevTools()
    }
  })

  ipcMain.handle('window:quit', () => {
    app.quit()
  })
}
