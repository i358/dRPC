import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import DiscordRPC from 'discord-rpc';
import crypto from 'crypto';
import Store from 'electron-store';
import { config } from 'dotenv';
import fs from 'fs';
import { Activity, RpcReadyData } from './types';

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading .env file from:', envPath);
  config({ path: envPath });
} else {
  console.warn('.env file not found at:', envPath);
  config();
}

const store = new Store<{clientId?: string; activity?: Activity}>();
let clientId: string = (process.env.CLIENT_ID as string) || store.get('clientId', '') || '';

console.log('Initial Client ID:', clientId ? 'Found' : 'Not found');

const generateSecret = (): string => crypto.randomBytes(16).toString('hex');

let rpc: DiscordRPC.Client | null = null;
let mainWindow: BrowserWindow | null = null;
let activity: Activity = {
  instance: true,
  partyId: generateSecret(),
  partySize: 1,
  partyMax: 5,
  matchSecret: generateSecret(),
  joinSecret: generateSecret(),
  spectateSecret: generateSecret()
};

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
let connectionTimeout: NodeJS.Timeout | null = null;

function validateActivity(act: Activity): boolean {
  if (act.details && act.details.length < 2) return false;
  if (act.state && act.state.length < 2) return false;
  return true;
}

function createWindow(): void {
  console.log('Creating main window...');
  
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload file exists:', fs.existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: true
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    frame: false,
    transparent: true,
    resizable: true
  });

  mainWindow.setMenu(null);
  
  const htmlPath = path.join(__dirname, '..', 'index.html');
  console.log('HTML path:', htmlPath);
  console.log('HTML file exists:', fs.existsSync(htmlPath));
  
  mainWindow.loadFile(htmlPath);

  ipcMain.on('window-minimize', () => {
    console.log('Minimizing window');
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    console.log('Maximizing/restoring window');
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    console.log('Closing window');
    mainWindow?.close();
  });

  ipcMain.handle('get-initial-client-id', () => {
    console.log('Requested initial Client ID:', clientId);
    return clientId;
  });

  ipcMain.handle('get-activity', () => {
    return activity;
  });
  
  ipcMain.handle('load-env-client-id', () => {
    console.log('Loading Client ID from .env file');
    
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      const envClientId = process.env.CLIENT_ID as string;
      console.log('Loaded Client ID from .env:', envClientId);
      
      if (envClientId) {
        return envClientId;
      } else {
        console.warn('CLIENT_ID not found in .env file');
        return '';
      }
    } else {
      console.warn('.env file not found');
      return '';
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (rpc) {
      rpc.destroy().catch((error: Error) => console.error(error));
    }
  });
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();

  const savedActivity = store.get('activity') as Activity;
  if (savedActivity) {
    activity = { ...activity, ...savedActivity };
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function initRPC(): void {
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log(`Maximum connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached. Waiting 10 seconds before trying again...`);
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    connectionTimeout = setTimeout(() => {
      connectionAttempts = 0;
      initRPC();
    }, 10000);
    return;
  }
  
  connectionAttempts++;
  console.log(`Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
  console.log('Initializing RPC...');
  console.log('Client ID:', clientId);

  if (rpc) {
    try {
      console.log('Closing existing RPC connection...');
      rpc.destroy().catch((error: Error) => console.error('RPC destroy error:', error));
    } catch (error) {
      console.error('Error closing RPC connection:', error);
    }
    rpc = null;
  }

  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    rpc.on('joinRequest', (request: { user: DiscordRPC.User }) => {
      console.log('Join request received:', request.user.username);
      if (request.user && request.user.id) {
        rpc?.sendJoinInvite(request.user.id).catch((error: Error) => console.error(error));
      }
      mainWindow?.webContents.send('join-request', request.user.username);
    });

    rpc.on('joinGame', () => {
      console.log('Join game event occurred');
      activity.partySize = (activity.partySize || 1) + 1;
      if (validateActivity(activity)) {
        rpc?.setActivity(activity).catch((error: Error) => {
          console.error('Activity update error:', error);
        });
      }
      mainWindow?.webContents.send('join-game', activity.partySize);
    });

    rpc.on('ready', () => {
      console.log('RPC ready!');
      console.log('User:', rpc?.user?.username);
      
      const rpcActivity = { ...activity };
      
      if (activity.timestamps?.start) {
        console.log('Setting timestamp for RPC:', activity.timestamps.start);
        rpcActivity.startTimestamp = activity.timestamps.start;
      }
      
      console.log('Setting activity:', rpcActivity);
      
      connectionAttempts = 0;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }

      if (validateActivity(rpcActivity)) {
        rpc?.setActivity(rpcActivity).then(() => {
          console.log('Activity set successfully');
          if (mainWindow && rpc?.user) {
            const readyData: RpcReadyData = {
              username: rpc.user.username || '',
              discriminator: rpc.user.discriminator || '',
              activity
            };
            mainWindow.webContents.send('rpc-ready', readyData);
          }
        }).catch((error: Error) => {
          console.error('Activity setting error:', error);
        });
      } else {
        console.log('Activity validation failed, activity not set');
        if (mainWindow && rpc?.user) {
          const readyData: RpcReadyData = {
            username: rpc.user.username || '',
            discriminator: rpc.user.discriminator || ''
          };
          mainWindow.webContents.send('rpc-ready', readyData);
        }
      }
    });

    console.log('Starting RPC login...');
    rpc.login({ clientId }).catch((error: Error) => {
      console.error('Discord RPC connection error:', error);
      mainWindow?.webContents.send('rpc-error', error.message);
    });
  } catch (error) {
    console.error('Error creating RPC client:', error);
    mainWindow?.webContents.send('rpc-error', 'Failed to create RPC client');
  }
}

ipcMain.on('set-client-id', (_event, id: string) => {
  console.log('Setting new Client ID:', id);
  clientId = id;
  store.set('clientId', id);
  initRPC();
});

ipcMain.on('update-activity', (_event, newActivity: Activity) => {
  console.log('Updating activity:', newActivity);
  
  const updatedActivity: Activity = {
    ...activity,
    ...newActivity,
    instance: true,
    partyId: activity.partyId,
    matchSecret: activity.matchSecret,
    joinSecret: activity.joinSecret,
    spectateSecret: activity.spectateSecret
  };

  if (newActivity.timestamps?.start) {
    console.log('Timestamp received:', newActivity.timestamps.start);
    
    const startTimestamp = newActivity.timestamps.start;
    
    if (typeof startTimestamp === 'number') {
      if (startTimestamp > 10000000000) {
        updatedActivity.timestamps = {
          start: Math.floor(startTimestamp / 1000)
        };
      } else {
        updatedActivity.timestamps = {
          start: startTimestamp
        };
      }
    } else if (typeof startTimestamp === 'object') {
      try {
        const timestampNumber = Number(startTimestamp);
        if (!isNaN(timestampNumber)) {
          if (timestampNumber > 10000000000) {
            updatedActivity.timestamps = {
              start: Math.floor(timestampNumber / 1000)
            };
          } else {
            updatedActivity.timestamps = {
              start: timestampNumber
            };
          }
        }
      } catch (error) {
        console.error('Error converting timestamp to number:', error);
      }
    }
    
    if (updatedActivity.timestamps?.start) {
      console.log('Formatted timestamp (seconds):', updatedActivity.timestamps.start);
    }
  }

  if (validateActivity(updatedActivity)) {
    activity = updatedActivity;
    store.set('activity', newActivity);
    
    const rpcActivity = { ...activity };
    
    if (activity.timestamps?.start) {
      console.log('Setting timestamp for RPC update:', activity.timestamps.start);
      rpcActivity.startTimestamp = activity.timestamps.start;
    }
    
    if (rpc && rpc.user) {
      console.log('Updating RPC activity without restart...');
      rpc.setActivity(rpcActivity).catch((error: Error) => {
        console.error('Activity update error:', error);
        setTimeout(() => initRPC(), 1000);
      });
    } else {
      initRPC();
    }
  } else {
    console.log('Activity validation failed, update not performed');
    mainWindow?.webContents.send('rpc-error', 'Detail or state must be at least 2 characters');
  }
});

ipcMain.on('reset-activity', () => {
  console.log('Resetting activity');
  activity = {
    instance: true,
    partyId: generateSecret(),
    partySize: 1,
    partyMax: 5,
    matchSecret: generateSecret(),
    joinSecret: generateSecret(),
    spectateSecret: generateSecret(),
    timestamps: {
      start: Math.floor(Date.now() / 1000)
    }
  };
  store.delete('activity');
  
  const rpcActivity = { ...activity };
  
  if (activity.timestamps?.start) {
    console.log('Setting timestamp for RPC reset:', activity.timestamps.start);
    rpcActivity.startTimestamp = activity.timestamps.start;
  }
  
  if (rpc && rpc.user) {
    console.log('Updating RPC activity after reset...');
    rpc.setActivity(rpcActivity).catch((error: Error) => {
      console.error('Activity reset error:', error);
      setTimeout(() => initRPC(), 1000);
    });
  } else {
    initRPC();
  }
  
  mainWindow?.webContents.send('activity-reset', activity);
});

ipcMain.on('disconnect', () => {
  console.log('Disconnecting...');
  if (rpc) {
    try {
      rpc.destroy().then(() => {
        console.log('RPC connection destroyed successfully');
        rpc = null;
        mainWindow?.webContents.send('disconnected');
      }).catch((error: Error) => {
        console.error('Disconnect error:', error);
        rpc = null;
        mainWindow?.webContents.send('disconnected');
      });
    } catch (error) {
      console.error('Error during disconnect:', error);
      rpc = null;
      mainWindow?.webContents.send('disconnected');
    }
  } else {
    console.log('No active RPC connection to disconnect');
    mainWindow?.webContents.send('disconnected');
  }
}); 