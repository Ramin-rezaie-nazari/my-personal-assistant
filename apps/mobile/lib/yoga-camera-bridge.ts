export type CameraFrameMetadata = {
  width: number;
  height: number;
  capturedAt: number;
  orientation: 'portrait' | 'landscape';
};

export type CameraFrame = {
  metadata: CameraFrameMetadata;
  nativeHandle?: unknown;
};

export type CameraBridgeState = {
  active: boolean;
  recording: false;
  uploading: false;
  provider: 'unconfigured' | 'on_device';
};

export interface YogaCameraFrameBridge {
  start(): Promise<CameraBridgeState>;
  stop(): Promise<CameraBridgeState>;
  isAvailable(): boolean;
  subscribe(listener: (frame: CameraFrame) => void): () => void;
}

/**
 * Safe default until a native frame processor is installed.
 * It deliberately never records or uploads frames.
 */
export class UnconfiguredYogaCameraBridge implements YogaCameraFrameBridge {
  private active = false;

  async start(): Promise<CameraBridgeState> {
    this.active = true;
    return this.state();
  }

  async stop(): Promise<CameraBridgeState> {
    this.active = false;
    return this.state();
  }

  isAvailable(): boolean {
    return false;
  }

  subscribe(_listener: (frame: CameraFrame) => void): () => void {
    return () => undefined;
  }

  private state(): CameraBridgeState {
    return {
      active: this.active,
      recording: false,
      uploading: false,
      provider: 'unconfigured',
    };
  }
}
