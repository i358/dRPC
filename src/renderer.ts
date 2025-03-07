import { Activity, RpcReadyData } from './types';

// Declare window.electronAPI for TypeScript
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      setClientId: (id: string) => void;
      getInitialClientId: () => Promise<string>;
      loadEnvClientId: () => Promise<string>;
      disconnect: () => void;
      updateActivity: (activity: Activity) => void;
      resetActivity: () => void;
      getActivity: () => Promise<Activity>;
      onRpcReady: (callback: (data: RpcReadyData) => void) => void;
      onRpcError: (callback: (message: string) => void) => void;
      onJoinRequest: (callback: (username: string) => void) => void;
      onJoinGame: (callback: (partySize: number) => void) => void;
      onActivityReset: (callback: (activity: Activity) => void) => void;
      onDisconnected: (callback: () => void) => void;
    };
  }
}

// * DOM Elements
const clientIdInput = document.getElementById('client-id') as HTMLInputElement;
const loadEnvBtn = document.getElementById('load-env-btn') as HTMLButtonElement;
const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnect-btn') as HTMLButtonElement;
const updateBtn = document.getElementById('update-btn') as HTMLButtonElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
const setTimeBtn = document.getElementById('set-time-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const userInfoEl = document.getElementById('user-info') as HTMLDivElement;
const usernameEl = document.getElementById('username') as HTMLSpanElement;
const elapsedTimeEl = document.getElementById('elapsed-time') as HTMLParagraphElement;
const elapsedHoursInput = document.getElementById('elapsed-hours') as HTMLInputElement;
const elapsedMinutesInput = document.getElementById('elapsed-minutes') as HTMLInputElement;
const elapsedSecondsInput = document.getElementById('elapsed-seconds') as HTMLInputElement;
const initialHoursInput = document.getElementById('initial-hours') as HTMLInputElement;
const initialMinutesInput = document.getElementById('initial-minutes') as HTMLInputElement;
const initialSecondsInput = document.getElementById('initial-seconds') as HTMLInputElement;
const detailsInput = document.getElementById('details') as HTMLInputElement;
const stateInput = document.getElementById('state') as HTMLInputElement;
const largeImageKeyInput = document.getElementById('large-image-key') as HTMLInputElement;
const largeImageTextInput = document.getElementById('large-image-text') as HTMLInputElement;
const smallImageKeyInput = document.getElementById('small-image-key') as HTMLInputElement;
const smallImageTextInput = document.getElementById('small-image-text') as HTMLInputElement;
const button1LabelInput = document.getElementById('button1-label') as HTMLInputElement;
const button1UrlInput = document.getElementById('button1-url') as HTMLInputElement;
const button2LabelInput = document.getElementById('button2-label') as HTMLInputElement;
const button2UrlInput = document.getElementById('button2-url') as HTMLInputElement;
const partySizeInput = document.getElementById('party-size') as HTMLInputElement;
const partyMaxInput = document.getElementById('party-max') as HTMLInputElement;
const partyIdEl = document.getElementById('party-id') as HTMLParagraphElement;
const joinSecretEl = document.getElementById('join-secret') as HTMLParagraphElement;
const matchSecretEl = document.getElementById('match-secret') as HTMLParagraphElement;
const notificationsEl = document.getElementById('notifications') as HTMLDivElement;
const minimizeBtn = document.getElementById('minimize-btn') as HTMLButtonElement;
const maximizeBtn = document.getElementById('maximize-btn') as HTMLButtonElement;
const closeBtn = document.getElementById('close-btn') as HTMLButtonElement;

// ! Global state variables
let currentActivity: Activity | null = null;
let isTimeManuallySet = false;
let manualStartTimestamp: number | null = null;

// * Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM content loaded');
  
  try {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.error('window.electronAPI is not available');
      addNotification('Electron API is not available. This app must run in Electron.', 'error');
      return;
    }
    
    console.log('window.electronAPI is available');
    console.log('Available methods:', Object.keys(window.electronAPI).join(', '));
    
    // ! Load initial client configuration
    const initialClientId = await window.electronAPI.getInitialClientId();
    console.log('Initial Client ID:', initialClientId ? 'Found' : 'Not found');
    if (initialClientId) {
      clientIdInput.value = initialClientId;
    }

    // ! Load activity data
    currentActivity = await window.electronAPI.getActivity();
    console.log('Activity loaded:', currentActivity);
    
    // ? Set default timestamp if none exists
    if (!currentActivity.timestamps?.start) {
      currentActivity.timestamps = {
        start: Math.floor(Date.now() / 1000)
      };
    }
    
    // ! Update UI with initial state
    updateElapsedTime(currentActivity.timestamps.start * 1000);
    updatePartyInfo(currentActivity);
    
    // * Set up event listeners
    window.electronAPI.onRpcReady(handleRpcReady);
    window.electronAPI.onRpcError(handleRpcError);
    window.electronAPI.onJoinRequest(handleJoinRequest);
    window.electronAPI.onJoinGame(handleJoinGame);
    window.electronAPI.onActivityReset(handleActivityReset);
    window.electronAPI.onDisconnected(handleDisconnected);
    
    // ? Button event listeners
    connectBtn.addEventListener('click', handleConnect);
    disconnectBtn.addEventListener('click', handleDisconnect);
    updateBtn.addEventListener('click', handleUpdate);
    resetBtn.addEventListener('click', handleReset);
    loadEnvBtn.addEventListener('click', handleLoadEnvClientId);
    
    // ? Window control handlers
    console.log('Setting up window control buttons');
    minimizeBtn.addEventListener('click', () => {
      console.log('Minimize button clicked');
      window.electronAPI.minimizeWindow();
    });

    maximizeBtn.addEventListener('click', () => {
      console.log('Maximize button clicked');
      window.electronAPI.maximizeWindow();
    });

    closeBtn.addEventListener('click', () => {
      console.log('Close button clicked');
      window.electronAPI.closeWindow();
    });
    
    // ! Time control handlers
    setTimeBtn.addEventListener('click', handleSetTime);
    
    elapsedHoursInput.addEventListener('input', () => {
      if (parseInt(elapsedHoursInput.value) < 0) elapsedHoursInput.value = '0';
    });
    
    elapsedMinutesInput.addEventListener('input', () => {
      const value = parseInt(elapsedMinutesInput.value);
      if (value < 0) elapsedMinutesInput.value = '0';
      if (value > 59) elapsedMinutesInput.value = '59';
    });
    
    elapsedSecondsInput.addEventListener('input', () => {
      const value = parseInt(elapsedSecondsInput.value);
      if (value < 0) elapsedSecondsInput.value = '0';
      if (value > 59) elapsedSecondsInput.value = '59';
    });
    
    // * Update elapsed time display every second
    setInterval(() => {
      const timestamp = isTimeManuallySet ? manualStartTimestamp : currentActivity?.timestamps?.start;
      if (timestamp) {
        updateElapsedTime(timestamp * 1000);
      }
    }, 1000);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    addNotification('Error initializing application', 'error');
  }
});

// * Load Client ID from .env file
async function handleLoadEnvClientId(): Promise<void> {
  try {
    console.log('Loading Client ID from .env file');
    const envClientId = await window.electronAPI.loadEnvClientId();
    
    if (envClientId) {
      clientIdInput.value = envClientId;
      addNotification('Client ID loaded from .env file', 'join');
    } else {
      addNotification('CLIENT_ID not found in .env file', 'error');
    }
  } catch (error) {
    console.error('Error loading Client ID from .env file:', error);
    addNotification('Error loading Client ID from .env file', 'error');
  }
}

// * RPC connection handlers
function handleRpcReady(data: RpcReadyData): void {
  statusEl.textContent = 'Connected';
  statusEl.classList.remove('disconnected');
  statusEl.classList.add('connected');
  
  connectBtn.classList.add('hidden');
  disconnectBtn.classList.remove('hidden');
  
  usernameEl.textContent = `${data.username}#${data.discriminator}`;
  userInfoEl.classList.remove('hidden');
  
  // ! Update UI with activity data
  if (data.activity) {
    fillFormWithActivity(data.activity);
    updatePartyInfo(data.activity);
  }
  
  addNotification(`Connected as ${data.username}`, 'join');
  
  // ? Initialize activity state
  currentActivity = data.activity || {};
  
  // If duration is set manually, use this duration
  if (isTimeManuallySet && manualStartTimestamp) {
    console.log('Using manually set timestamp (seconds):', manualStartTimestamp);
    currentActivity.timestamps = {
      start: manualStartTimestamp
    };
  }
}

// ! Error handling
function handleRpcError(message: string): void {
  statusEl.textContent = 'Connection Error';
  statusEl.classList.remove('connected');
  statusEl.classList.add('disconnected');
  
  addNotification(`Error: ${message}`, 'error');
}

// ? Party management handlers
function handleJoinRequest(username: string): void {
  addNotification(`${username} wants to join`, 'join');
}

function handleJoinGame(partySize: number): void {
  partySizeInput.value = partySize.toString();
  addNotification(`Someone joined! New party size: ${partySize}`, 'join');
}

// * Activity state management
function handleActivityReset(activity: Activity): void {
  fillFormWithActivity(activity);
  updatePartyInfo(activity);
  addNotification('Rich Presence reset', 'join');
  
  currentActivity = activity;
  if (!currentActivity.timestamps?.start) {
    currentActivity.timestamps = {
      start: Math.floor(Date.now() / 1000)
    };
  }
  isTimeManuallySet = false;
  manualStartTimestamp = null;
}

// ! Connection management
function handleConnect(): void {
  const clientId = clientIdInput.value.trim();
  if (!clientId) {
    addNotification('Client ID cannot be empty!', 'error');
    return;
  }
  
  window.electronAPI.setClientId(clientId);
  statusEl.textContent = 'Connecting...';
}

function handleDisconnected(): void {
  statusEl.textContent = 'Disconnected';
  statusEl.classList.remove('connected');
  statusEl.classList.add('disconnected');
  
  connectBtn.classList.remove('hidden');
  disconnectBtn.classList.add('hidden');
  userInfoEl.classList.add('hidden');
  
  clientIdInput.value = '';
  fillFormWithActivity({});
  updatePartyInfo({});
  
  addNotification('Discord connection closed', 'error');
}

function handleDisconnect(): void {
  window.electronAPI.disconnect();
}

// * Activity update handlers
function handleUpdate(): void {
  const activity = getActivityFromForm();
  window.electronAPI.updateActivity(activity);
  currentActivity = activity;
  
  addNotification('Rich Presence updated', 'join');
}

function handleReset(): void {
  window.electronAPI.resetActivity();
}

// ! Time management
function handleSetTime(): void {
  const hours = parseInt(elapsedHoursInput.value) || 0;
  const minutes = parseInt(elapsedMinutesInput.value) || 0;
  const seconds = parseInt(elapsedSecondsInput.value) || 0;
  
  if (minutes > 59) {
    elapsedMinutesInput.value = '59';
    return;
  }
  
  if (seconds > 59) {
    elapsedSecondsInput.value = '59';
    return;
  }
  
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  // Discord timestamp expects seconds, not milliseconds
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const newStartTime = currentTimeSeconds - totalSeconds;
  
  if (currentActivity) {
    // Get current activity and update only the timestamp
    const updatedActivity = { ...currentActivity };
    
    // Set timestamp in correct format (as epoch timestamp in seconds)
    updatedActivity.timestamps = {
      start: newStartTime
    };
    
    console.log('Setting new timestamp (seconds):', newStartTime);
    console.log('Current time (seconds):', currentTimeSeconds);
    console.log('Elapsed seconds:', totalSeconds);
    
    // Update activity
    console.log('Updating activity with new timestamp:', newStartTime);
    window.electronAPI.updateActivity(updatedActivity);
    
    // Update local activity
    currentActivity = updatedActivity;
    
    // Update elapsed time display - converting to milliseconds here because updateElapsedTime expects milliseconds
    updateElapsedTime(newStartTime * 1000);
    
    // Show notification to user
    addNotification(`Elapsed time updated to ${hours}h ${minutes}m ${seconds}s`, 'join');
  } else {
    addNotification('No active presence to update', 'error');
  }
  
  isTimeManuallySet = true;
  manualStartTimestamp = newStartTime;
}

// * Form data management
function getActivityFromForm(): Activity {
  const activity: Activity = {};
  
  const details = detailsInput.value.trim();
  const state = stateInput.value.trim();
  const largeImageKey = largeImageKeyInput.value.trim();
  const largeImageText = largeImageTextInput.value.trim();
  const smallImageKey = smallImageKeyInput.value.trim();
  const smallImageText = smallImageTextInput.value.trim();
  const button1Label = button1LabelInput.value.trim();
  const button1Url = button1UrlInput.value.trim();
  const button2Label = button2LabelInput.value.trim();
  const button2Url = button2UrlInput.value.trim();
  const partySize = parseInt(partySizeInput.value) || 1;
  const partyMax = parseInt(partyMaxInput.value) || 5;
  
  // ? Build activity object from form data
  if (details) activity.details = details;
  if (state) activity.state = state;
  if (largeImageKey) activity.largeImageKey = largeImageKey;
  if (largeImageText) activity.largeImageText = largeImageText;
  if (smallImageKey) activity.smallImageKey = smallImageKey;
  if (smallImageText) activity.smallImageText = smallImageText;
  
  const buttons = [];
  if (button1Label && button1Url) {
    buttons.push({ label: button1Label, url: button1Url });
  }
  if (button2Label && button2Url) {
    buttons.push({ label: button2Label, url: button2Url });
  }
  if (buttons.length > 0) activity.buttons = buttons;
  
  activity.partySize = partySize;
  activity.partyMax = partyMax;
  
  if (currentActivity?.timestamps?.start) {
    activity.timestamps = {
      start: currentActivity.timestamps.start
    };
  }
  
  return activity;
}

// ! UI update functions
function fillFormWithActivity(activity: Activity): void {
  detailsInput.value = activity.details || '';
  stateInput.value = activity.state || '';
  largeImageKeyInput.value = activity.largeImageKey || '';
  largeImageTextInput.value = activity.largeImageText || '';
  smallImageKeyInput.value = activity.smallImageKey || '';
  smallImageTextInput.value = activity.smallImageText || '';
  
  if (activity.buttons && activity.buttons[0]) {
    button1LabelInput.value = activity.buttons[0].label || '';
    button1UrlInput.value = activity.buttons[0].url || '';
  } else {
    button1LabelInput.value = '';
    button1UrlInput.value = '';
  }
  
  if (activity.buttons && activity.buttons[1]) {
    button2LabelInput.value = activity.buttons[1].label || '';
    button2UrlInput.value = activity.buttons[1].url || '';
  } else {
    button2LabelInput.value = '';
    button2UrlInput.value = '';
  }
  
  partySizeInput.value = activity.partySize?.toString() || '1';
  partyMaxInput.value = activity.partyMax?.toString() || '5';
}

function updatePartyInfo(activity: Activity): void {
  partyIdEl.textContent = activity.partyId || 'N/A';
  joinSecretEl.textContent = activity.joinSecret || 'N/A';
  matchSecretEl.textContent = activity.matchSecret || 'N/A';
}

function updateElapsedTime(timestamp: number): void {
  // timestamp should be in milliseconds
  // If timestamp is in seconds (less than 10 digits), convert to milliseconds
  if (timestamp < 10000000000) {
    timestamp = timestamp * 1000;
  }
  
  const elapsed = Math.floor((Date.now() - timestamp) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  // Update elapsed time display
  elapsedTimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update input fields (if empty)
  if (!elapsedHoursInput.value) {
    elapsedHoursInput.value = hours.toString();
  }
  
  if (!elapsedMinutesInput.value) {
    elapsedMinutesInput.value = minutes.toString();
  }
  
  if (!elapsedSecondsInput.value) {
    elapsedSecondsInput.value = seconds.toString();
  }
}

// ? Notification system
function addNotification(message: string, type: 'join' | 'error'): void {
  const notification = document.createElement('div');
  notification.classList.add('notification', type);
  notification.textContent = message;
  
  notificationsEl.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notificationsEl.removeChild(notification);
    }, 300);
  }, 3000);
}