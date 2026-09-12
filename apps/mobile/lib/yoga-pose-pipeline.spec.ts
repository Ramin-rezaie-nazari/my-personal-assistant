import { UnconfiguredPoseProvider, YogaPosePipeline } from './yoga-pose-pipeline';
import type { YogaCameraFrameBridge } from './yoga-camera-bridge';
import type { CameraFrame } from './yoga-camera-bridge';

test('unconfigured provider never produces pose data', async () => {
  const listeners: Array<(frame: CameraFrame) => void> = [];
  const bridge: YogaCameraFrameBridge = {
    async start() { return { active: true, recording: false, uploading: false, provider: 'unconfigured' as const }; },
    async stop() { return { active: false, recording: false, uploading: false, provider: 'unconfigured' as const }; },
    isAvailable() { return false; },
    subscribe(listener) { listeners.push(listener); return () => undefined; },
  };
  const pipeline = new YogaPosePipeline(bridge, new UnconfiguredPoseProvider());
  await pipeline.start();
  listeners[0]?.({ metadata: { width: 100, height: 100, capturedAt: Date.now(), orientation: 'portrait' } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(pipeline.state().analyzedFrames).toBe(0);
  expect(pipeline.state().lastConfidence).toBeNull();
});

test('stopped pipeline ignores an in-flight pose result', async () => {
  const listeners: Array<(frame: CameraFrame) => void> = [];
  let resolveDetect!: (pose: any) => void;
  const bridge: YogaCameraFrameBridge = {
    async start() { return { active: true, recording: false, uploading: false, provider: 'test' as const }; },
    async stop() { return { active: false, recording: false, uploading: false, provider: 'test' as const }; },
    isAvailable() { return true; },
    subscribe(listener) { listeners.push(listener); return () => undefined; },
  };
  const provider = {
    id: 'test',
    available: () => true,
    detect: async () => await new Promise((resolve) => { resolveDetect = resolve; }),
  };
  const poses: any[] = [];
  const pipeline = new YogaPosePipeline(bridge, (pose) => poses.push(pose));
  await pipeline.start((pose) => poses.push(pose));
  listeners[0]?.({ metadata: { width: 100, height: 100, capturedAt: 1, orientation: 'portrait' } });
  await pipeline.stop();
  resolveDetect({ capturedAt: 1, landmarks: {}, overallConfidence: 0.9 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(pipeline.state().active).toBe(false);
  expect(pipeline.state().analyzedFrames).toBe(0);
  expect(poses).toHaveLength(0);
});
