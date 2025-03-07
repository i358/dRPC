import { contextBridge, ipcRenderer } from 'electron';
import { Activity, ElectronAPI } from './types';

// * Main API interface for renderer process
const api: ElectronAPI = {
  // ? Window control methods
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // ! Client ID management
  setClientId: (id: string) => ipcRenderer.send('set-client-id', id),
  getInitialClientId: () => ipcRenderer.invoke('get-initial-client-id'),
  loadEnvClientId: () => ipcRenderer.invoke('load-env-client-id'),
  
  // ! Connection management
  disconnect: () => ipcRenderer.send('disconnect'),
  
  // * Activity management
  updateActivity: (activity: Activity) => ipcRenderer.send('update-activity', activity),
  resetActivity: () => ipcRenderer.send('reset-activity'),
  getActivity: () => ipcRenderer.invoke('get-activity'),
  
  // ? Event listeners
  onRpcReady: (callback) => ipcRenderer.on('rpc-ready', (_, data) => callback(data)),
  onRpcError: (callback) => ipcRenderer.on('rpc-error', (_, message) => callback(message)),
  onJoinRequest: (callback) => ipcRenderer.on('join-request', (_, username) => callback(username)),
  onJoinGame: (callback) => ipcRenderer.on('join-game', (_, partySize) => callback(partySize)),
  onActivityReset: (callback) => ipcRenderer.on('activity-reset', (_, activity) => callback(activity)),
  onDisconnected: (callback) => ipcRenderer.on('disconnected', () => callback())
}; 

// * Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

console.log('Preload script loaded successfully');
console.log('Exposed API methods:', Object.keys(api).join(', ')); 