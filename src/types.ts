export interface Activity {
  details?: string;
  state?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  partyId?: string;
  partySize?: number;
  partyMax?: number;
  matchSecret?: string;
  joinSecret?: string;
  spectateSecret?: string;
  instance?: boolean;
  buttons?: Array<{
    label: string;
    url: string;
  }>;
  timestamps?: {
    start: number;
  };
}

export interface User {
  username?: string;
  discriminator?: string;
}

export interface RpcReadyData {
  username?: string;
  discriminator?: string;
  activity?: Activity;
}

export interface ElectronAPI {
  getInitialClientId: () => Promise<string>;
  getActivity: () => Promise<Activity>;
  setClientId: (id: string) => void;
  updateActivity: (activity: Activity) => void;
  resetActivity: () => void;
  disconnect: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  loadEnvClientId: () => Promise<string>;
  onRpcReady: (callback: (data: RpcReadyData) => void) => void;
  onRpcError: (callback: (message: string) => void) => void;
  onJoinRequest: (callback: (username: string) => void) => void;
  onJoinGame: (callback: (partySize: number) => void) => void;
  onActivityReset: (callback: (activity: Activity) => void) => void;
  onDisconnected: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 