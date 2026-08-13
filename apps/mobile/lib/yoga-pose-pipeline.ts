import type { CameraFrame, YogaCameraFrameBridge } from './yoga-camera-bridge';

export type BodyLandmark = { x: number; y: number; z?: number; confidence: number };
export type PoseFrame = {
  capturedAt: number;
  landmarks: Record<string, BodyLandmark>;
  overallConfidence: number;
};
export type PoseProvider = {
  id: string;
  available(): boolean;
  detect(frame: CameraFrame): Promise<PoseFrame | null>;
};

export type YogaPosePipelineState = {
  active: boolean;
  provider: string;
  analyzedFrames: number;
  lastConfidence: number | null;
  lastCapturedAt: number | null;
};

export class UnconfiguredPoseProvider implements PoseProvider {
  id = 'unconfigured';
  available(): boolean { return false; }
  async detect(_frame: CameraFrame): Promise<PoseFrame | null> { return null; }
}

export class YogaPosePipeline {
  private unsubscribe: (() => void) | null = null;
  private stateValue: YogaPosePipelineState;

  constructor(
    private readonly bridge: YogaCameraFrameBridge,
    private readonly provider: PoseProvider = new UnconfiguredPoseProvider(),
  ) {
    this.stateValue = {
      active: false,
      provider: provider.id,
      analyzedFrames: 0,
      lastConfidence: null,
      lastCapturedAt: null,
    };
  }

  async start(onPose?: (pose: PoseFrame) => void): Promise<YogaPosePipelineState> {
    await this.bridge.start();
    this.stateValue = { ...this.stateValue, active: true, provider: this.provider.id };
    this.unsubscribe = this.bridge.subscribe((frame) => { void this.process(frame, onPose); });
    return this.state();
  }

  async stop(): Promise<YogaPosePipelineState> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    await this.bridge.stop();
    this.stateValue = { ...this.stateValue, active: false };
    return this.state();
  }

  state(): YogaPosePipelineState { return { ...this.stateValue }; }

  private async process(frame: CameraFrame, onPose?: (pose: PoseFrame) => void) {
    if (!this.stateValue.active || !this.provider.available()) return;
    const pose = await this.provider.detect(frame);
    if (!pose) return;
    this.stateValue = {
      ...this.stateValue,
      analyzedFrames: this.stateValue.analyzedFrames + 1,
      lastConfidence: pose.overallConfidence,
      lastCapturedAt: pose.capturedAt,
    };
    onPose?.(pose);
  }
}
