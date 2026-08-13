import { UnconfiguredPoseProvider, YogaPosePipeline } from './yoga-pose-pipeline';
import type { YogaCameraFrameBridge } from './yoga-camera-bridge';

test('unconfigured provider never produces pose data', async () => {
  const listeners: Array<(frame: any) => void> = [];
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
