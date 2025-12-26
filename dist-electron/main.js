import { app, BrowserWindow, ipcMain, screen, desktopCapturer, dialog, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let permissionCheckDone = false;
async function checkScreenPermissions() {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const thumbnailSize = {
      width: Math.min(primaryDisplay.size.width, 100),
      height: Math.min(primaryDisplay.size.height, 100)
    };
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize
    });
    return sources && sources.length > 0;
  } catch (error) {
    return false;
  }
}
async function requestScreenPermissions() {
  if (permissionCheckDone) return;
  permissionCheckDone = true;
  const hasPermissions = await checkScreenPermissions();
  if (hasPermissions) {
    console.log("Screen recording permissions already granted");
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 1e3));
  if (!win || win.isDestroyed()) {
    setTimeout(() => requestScreenPermissions(), 500);
    return;
  }
  const platform = process.platform;
  const message = "Screen Recording Permission Required\n\n";
  let detail = "";
  if (platform === "darwin") {
    const appName = app.getName();
    detail = `AirOps needs screen recording permission to capture your screen.

To enable:
1. Click "Open System Settings" below
2. Find "${appName}" (or "Electron" in development)
3. Toggle ON the Screen Recording permission
4. Restart the app

The app will work, but screen capture features require this permission.`;
    const response = await dialog.showMessageBox(win, {
      type: "warning",
      title: "Screen Recording Permission",
      message,
      detail,
      buttons: ["Open System Settings", "Later"],
      defaultId: 0,
      cancelId: 1
    });
    if (response.response === 0) {
      shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture");
    }
  } else if (platform === "win32") {
    detail = "AirOps needs screen recording permission to capture your screen.\n\nPlease grant screen recording permissions in Windows Settings > Privacy > Screen Recording.";
    await dialog.showMessageBox(win, {
      type: "info",
      title: "Screen Recording Permission",
      message,
      detail,
      buttons: ["OK"]
    });
  } else {
    detail = "AirOps needs screen recording permission to capture your screen.\n\nPlease ensure you have the necessary permissions. If using Wayland, consider using X11.";
    await dialog.showMessageBox(win, {
      type: "info",
      title: "Screen Recording Permission",
      message,
      detail,
      buttons: ["OK"]
    });
  }
}
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const windowWidth = 650;
  const windowHeight = 500;
  const x = Math.floor((screenWidth - windowWidth) / 2);
  const y = 20;
  const iconPath = VITE_DEV_SERVER_URL ? path.join(process.env.VITE_PUBLIC, "icon.png") : path.join(RENDERER_DIST, "icon.png");
  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    requestScreenPermissions();
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("check-permissions", async () => {
  return await checkScreenPermissions();
});
ipcMain.handle("request-permissions", async () => {
  permissionCheckDone = false;
  await requestScreenPermissions();
  return await checkScreenPermissions();
});
ipcMain.handle("capture-screen", async () => {
  try {
    if (!win || win.isDestroyed()) {
      throw new Error("Window not available");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const thumbnailSize = {
      width: Math.min(width, 1920),
      height: Math.min(height, 1080)
    };
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize
    });
    if (!sources || sources.length === 0) {
      throw new Error("No screen sources available. Please grant screen recording permissions.");
    }
    let primarySource = sources.find(
      (source) => source.display_id === primaryDisplay.id.toString()
    );
    if (!primarySource) {
      primarySource = sources.find(
        (source) => source.name.toLowerCase().includes("screen") || source.name.toLowerCase().includes("display")
      ) || sources[0];
    }
    if (!primarySource || !primarySource.thumbnail) {
      throw new Error("No valid screen source found");
    }
    return primarySource.thumbnail.toDataURL();
  } catch (error) {
    console.error("Error capturing screen:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("permission") || errorMessage.includes("Permission") || errorMessage.includes("access denied") || errorMessage.includes("not authorized")) {
      const platform = process.platform;
      let permissionMessage = "Screen recording permission required.";
      if (platform === "darwin") {
        permissionMessage += " Please grant access in System Settings > Privacy & Security > Screen Recording.";
      } else if (platform === "linux") {
        permissionMessage += " Please ensure you have the necessary permissions or use X11 instead of Wayland.";
      } else if (platform === "win32") {
        permissionMessage += " Please grant access in Windows Settings > Privacy > Screen Recording.";
      }
      throw new Error(permissionMessage);
    }
    throw new Error(`Failed to capture screen: ${errorMessage}`);
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
