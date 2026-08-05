import React, { useState } from 'react';
import OrbFallback, { AvatarStatus } from './OrbFallback';
import Assistant3D, { hasThreeFiber } from './Assistant3D';

export type { AvatarStatus };

export interface AssistantAvatarProps {
  /** Size of the visualizer (default: 56) */
  size?: number;
  /** Assistant status */
  status?: AvatarStatus;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  size = 56,
  status = 'idle',
}) => {
  const [useFallback, setUseFallback] = useState(!hasThreeFiber);

  if (useFallback) {
    return <OrbFallback size={size} status={status} />;
  }

  // Adjust sizing: 3D Canvas requires slightly larger bounds to fit
  // the perspective camera, so we scale it up. For example, if size is 90,
  // we render the Canvas at size 170. If size is 48, we render at 90.
  const canvasSize = size * 1.8;

  try {
    return (
      <Assistant3D
        size={canvasSize}
        status={status}
      />
    );
  } catch (err) {
    console.warn('[AssistantAvatar Wrapper Error] Falling back to 2D Orb:', err);
    setUseFallback(true);
    return <OrbFallback size={size} status={status} />;
  }
};

export default AssistantAvatar;
