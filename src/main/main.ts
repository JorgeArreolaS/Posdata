/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path, { parse, resolve } from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { FileType, handlers } from './handlers';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

Object.entries(handlers).map(([path, handler]) => {
  ipcMain.handle(path, (_event, params) => handler(params, {
    event: _event, mainWindow
  }))
})

import Store from 'electron-store';
import { readdir, stat } from 'fs/promises';

const store = new Store();

// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (_event, key, val) => {
  store.set(key, val);
});
const explorer: {
  running: boolean,
  extensions: string[],
  ignore: string[],
} = {
  running: false,
  extensions: [],
  ignore: [],
}

const toIgnore = (itemPath: string) => {
  if (explorer.ignore && explorer.ignore.length) {
    for (let ignore of explorer.ignore) {
      const regex = new RegExp(ignore)
      const match = itemPath.match(regex)
      if (!!match) {
        return true
      }
    }
  }
  return false
}
import debounce from 'debounce'
let current = ''
const sendCurrent = debounce( () => {
    mainWindow?.webContents.send('current-file', current)
}, 1000 )

const recursiveExplorer = async (path: string): Promise<any> => {
  if (!explorer.running) return

  if (toIgnore(path))
    return

  try {
    current = path
    sendCurrent() 
    const items = await readdir(path)

    for (let item of items) {
      if (!explorer.running) return

      const itemPath = [path, item].join('/')
      try {
        const stats = await stat(itemPath)
        const parsed = parse(itemPath)

        if (stats.isDirectory())
          await recursiveExplorer(itemPath)

        if (stats.isFile()) {

          if (explorer.extensions.length > 0 && !explorer.extensions.includes(parsed.ext.slice(1)))
            continue

          if (toIgnore(itemPath))
            continue

          const fileInfo: FileType = { ...stats, ...parsed, path: resolve( [parsed.dir, parsed.base].join('/') ) }
          console.log("Found:", itemPath)
          mainWindow?.webContents.send('file-found', fileInfo)
        }
      } catch (e) { }

    }
  } catch (e) {
    return
  }
}

ipcMain.on('explorer-control', async (_event, action: 'start' | 'stop') => {
  console.log(action)
  if (action === 'start') {
    const path = store.get('root_path')
    explorer.extensions = store.get('exts') as string[] || []
    explorer.ignore = store.get('ignore') as string[] || []
    console.log("Loaded extensions:", explorer?.extensions)
    console.log("Loaded ignore:", explorer?.ignore)
    if (path) {
      explorer.running = true
      recursiveExplorer(String(path)).then(e => {
        if (explorer.running) {
          console.log("Finished lol", e)
          mainWindow?.webContents.send('explorer-ended', e)
        }
        explorer.running = false
      })
    }
  } else {
    explorer.running = false
  }
  _event.returnValue = explorer
})

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
