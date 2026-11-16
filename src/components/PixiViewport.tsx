// Based on https://codepen.io/inlet/pen/yLVmPWv.
// Copyright (c) 2018 Patrick Brouwer, distributed under the MIT license.

import { PixiComponent, useApp } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import { Application } from 'pixi.js';
import { MutableRefObject, ReactNode } from 'react';

export type ViewportProps = {
  app: Application;
  viewportRef?: MutableRefObject<Viewport | undefined>;

  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  children?: ReactNode;
};

// Small screens may zoom out until the map covers the viewport, but no further:
// going below "cover" leaves blank bands around the map. Desktop keeps the
// original, more zoomed-in bounds.
function zoomLimits(props: ViewportProps) {
  const { screenWidth, screenHeight, worldWidth, worldHeight } = props;
  if (screenWidth >= 1024) {
    return {
      minScale: (1.04 * screenWidth) / (worldWidth / 2),
      maxScale: 3.0,
    };
  }
  const coverScale = Math.max(screenWidth / worldWidth, screenHeight / worldHeight);
  return {
    minScale: coverScale,
    maxScale: Math.max(2.5, coverScale * 2),
  };
}

function applyZoomLimits(viewport: Viewport, props: ViewportProps) {
  const clampZoom = viewport.plugins.get('clamp-zoom');
  if (!clampZoom) {
    return;
  }
  const { minScale, maxScale } = zoomLimits(props);
  clampZoom.options.minScale = minScale;
  clampZoom.options.maxScale = maxScale;
  clampZoom.clamp();
}

// https://davidfig.github.io/pixi-viewport/jsdoc/Viewport.html
export default PixiComponent('Viewport', {
  create(props: ViewportProps) {
    const { app, children, viewportRef, ...viewportProps } = props;
    const viewport = new Viewport({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      events: app.renderer.events,
      passiveWheel: false,
      ...viewportProps,
    });
    if (viewportRef) {
      viewportRef.current = viewport;
    }
    // Activate plugins
    viewport
      .drag()
      .pinch({})
      .wheel()
      .decelerate()
      .clamp({ direction: 'all', underflow: 'center' })
      .setZoom(-10)
      .clampZoom(zoomLimits(props));
    return viewport;
  },
  applyProps(viewport, oldProps: any, newProps: any) {
    if (
      newProps.screenWidth > 0 &&
      newProps.screenHeight > 0 &&
      (oldProps.screenWidth !== newProps.screenWidth ||
        oldProps.screenHeight !== newProps.screenHeight)
    ) {
      // Keep the same point of the town in view when the phone rotates or the
      // browser chrome collapses.
      const hasPreviousSize = oldProps.screenWidth > 0 && oldProps.screenHeight > 0;
      const center = hasPreviousSize ? viewport.center : undefined;
      applyZoomLimits(viewport, newProps);
      viewport.resize(
        newProps.screenWidth,
        newProps.screenHeight,
        newProps.worldWidth,
        newProps.worldHeight,
      );
      if (center) {
        viewport.moveCenter(center.x, center.y);
      }
    }
    Object.keys(newProps).forEach((p) => {
      if (p !== 'app' && p !== 'viewportRef' && p !== 'children' && oldProps[p] !== newProps[p]) {
        // @ts-expect-error Ignoring TypeScript here
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        viewport[p] = newProps[p];
      }
    });
  },
});
