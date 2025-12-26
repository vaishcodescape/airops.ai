import { app, BrowserWindow, screen, ipcMain, desktopCapturer, dialog, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let permissionCheckDone = false

// Check screen recording permissions
async function checkScreenPermissions(): Promise<boolean> {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const thumbnailSize = {
      width: Math.min(primaryDisplay.size.width, 100),
      height: Math.min(primaryDisplay.size.height, 100)
    }
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: thumbnailSize
    })
    
    return sources && sources.length > 0
  } catch (error) {
    return false
  }
}

// Prompt user for screen recording permissions
async function requestScreenPermissions() {
  if (permissionCheckDone) return
  permissionCheckDone = true

  // Check if permissions are already granted
  const hasPermissions = await checkScreenPermissions()
  if (hasPermissions) {
    console.log('Screen recording permissions already granted')
    return
  }

  // Wait a bit for window to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))

  if (!win || win.isDestroyed()) {
    // Wait a bit more for window to be created
    setTimeout(() => requestScreenPermissions(), 500)
    return
  }

  const platform = process.platform
  const message = 'Screen Recording Permission Required\n\n'
  let detail = ''

  if (platform === 'darwin') {
    const appName = app.getName()
    detail = 'AirOps needs screen recording permission to capture your screen.\n\n' +
      'To enable:\n' +
      '1. Click "Open System Settings" below\n' +
      `2. Find "${appName}" (or "Electron" in development)\n` +
      '3. Toggle ON the Screen Recording permission\n' +
      '4. Restart the app\n\n' +
      'The app will work, but screen capture features require this permission.'
    
    // Try to open System Settings to Screen Recording section (macOS 13+)
    const response = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Screen Recording Permission',
      message: message,
      detail: detail,
      buttons: ['Open System Settings', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })

    if (response.response === 0) {
      // Open System Settings to Screen Recording (macOS)
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
    }
  } else if (platform === 'win32') {
    detail = 'AirOps needs screen recording permission to capture your screen.\n\n' +
      'Please grant screen recording permissions in Windows Settings > Privacy > Screen Recording.'
    
    await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Screen Recording Permission',
      message: message,
      detail: detail,
      buttons: ['OK'],
    })
  } else {
    // Linux
    detail = 'AirOps needs screen recording permission to capture your screen.\n\n' +
      'Please ensure you have the necessary permissions. If using Wayland, consider using X11.'
    
    await dialog.showMessageBox(win, {
      type: 'info',
      title: 'Screen Recording Permission',
      message: message,
      detail: detail,
      buttons: ['OK'],
    })
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize

  const windowWidth = 650
  const windowHeight = 500
  const x = Math.floor((screenWidth - windowWidth) / 2)
  const y = 20 // 20px from top

  // Set icon path - use AirOps logo from public folder
  const iconPath = VITE_DEV_SERVER_URL
    ? path.join(process.env.VITE_PUBLIC, 'icon.png')
    : path.join(RENDERER_DIST, 'icon.png')

  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    alwaysOnTop: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    // Check permissions after window loads
    requestScreenPermissions()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('check-permissions', async () => {
  return await checkScreenPermissions()
})

ipcMain.handle('request-permissions', async () => {
  permissionCheckDone = false
  await requestScreenPermissions()
  return await checkScreenPermissions()
})

ipcMain.handle('capture-screen', async () => {
  try {
    // Ensure window exists and is ready
    if (!win || win.isDestroyed()) {
      throw new Error('Window not available')
    }

    // Wait a moment to ensure window is fully ready
    await new Promise(resolve => setTimeout(resolve, 100))

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size
    
    // Use reasonable thumbnail size (not full resolution for performance)
    const thumbnailSize = {
      width: Math.min(width, 1920),
      height: Math.min(height, 1080)
    }
    
    // Get all available sources
    // Note: On macOS, this requires Screen Recording permission in System Settings
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: thumbnailSize
    })
    
    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available. Please grant screen recording permissions.')
    }
    
    // Try to find primary display source, fallback to first available
    let primarySource = sources.find(source => 
      source.display_id === primaryDisplay.id.toString()
    )
    
    // If no exact match, try to find by name or just use first
    if (!primarySource) {
      primarySource = sources.find(source => 
        source.name.toLowerCase().includes('screen') || 
        source.name.toLowerCase().includes('display')
      ) || sources[0]
    }
    
    if (!primarySource || !primarySource.thumbnail) {
      throw new Error('No valid screen source found')
    }
    
    // Return the thumbnail as data URL
    return primarySource.thumbnail.toDataURL()
  } catch (error) {
    console.error('Error capturing screen:', error)
    
    // Provide more helpful error messages
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check for permission-related errors
    if (errorMessage.includes('permission') || 
        errorMessage.includes('Permission') ||
        errorMessage.includes('access denied') ||
        errorMessage.includes('not authorized')) {
      const platform = process.platform
      let permissionMessage = 'Screen recording permission required.'
      
      if (platform === 'darwin') {
        permissionMessage += ' Please grant access in System Settings > Privacy & Security > Screen Recording.'
      } else if (platform === 'linux') {
        permissionMessage += ' Please ensure you have the necessary permissions or use X11 instead of Wayland.'
      }
      else if (platform === 'win32') {
        permissionMessage += ' Please grant access in Windows Settings > Privacy > Screen Recording.'
      }
      throw new Error(permissionMessage)
    }
    
    throw new Error(`Failed to capture screen: ${errorMessage}`)
  }
})

app.whenReady().then(createWindow)
