import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

// Cap the renderer's backing store at 2x so high-DPI phones don't render
// four times the pixels for marginal sharpness on pixel-art sprites.
const stageOptions = {
  backgroundColor: 0x7ab5ff,
  antialias: false,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
};

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  // On phones the details/chat panel is a bottom sheet that starts collapsed.
  // Reveal it as soon as something is worth reading: a tapped character or an
  // ongoing conversation (including invites the engine pushes to us).
  const [panelOpen, setPanelOpen] = useState(false);
  const selectedPlayerId = selectedElement?.id;
  const humanTokenIdentifier = useQuery(
    api.world.userStatus,
    worldId ? { worldId } : 'skip',
  );
  const humanPlayer =
    game && humanTokenIdentifier
      ? [...game.world.players.values()].find((p) => p.human === humanTokenIdentifier)
      : undefined;
  const inConversation = !!(humanPlayer && game && game.world.playerConversation(humanPlayer));

  useEffect(() => {
    if (selectedPlayerId || inConversation) {
      setPanelOpen(true);
    }
  }, [selectedPlayerId, inConversation]);

  // The sheet's body is hidden while collapsed, so its scroll height is stale
  // when it opens. Jump to the newest message once it becomes visible.
  useEffect(() => {
    if (!panelOpen) {
      return;
    }
    const el = scrollViewRef.current;
    requestAnimationFrame(() => {
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }, [panelOpen]);

  if (!worldId || !engineId || !game) {
    return null;
  }

  const panelTitle = inConversation ? '对话中' : selectedPlayerId ? '角色详情' : '消息';
  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div className="game-shell mx-auto max-w-[1400px] game-frame">
        {/* Game area */}
        <div className="game-map bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <Stage width={width} height={height} options={stageOptions}>
              {/* Re-propagate context because contexts are not shared between renderers.
https://github.com/michalochman/react-pixi-fiber/issues/145#issuecomment-531549215 */}
              <ConvexProvider client={convex}>
                <PixiGame
                  game={game}
                  worldId={worldId}
                  engineId={engineId}
                  width={width}
                  height={height}
                  historicalTime={historicalTime}
                  setSelectedElement={setSelectedElement}
                />
              </ConvexProvider>
            </Stage>
          </div>
        </div>
        {/* Right column (desktop) / bottom sheet (phone) */}
        <div className={clsx('game-panel flex flex-col text-brown-100', panelOpen && 'game-panel--open')}>
          <button
            type="button"
            className="game-panel-handle"
            aria-expanded={panelOpen}
            aria-controls="game-panel-body"
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span className="game-panel-grip" aria-hidden="true" />
            <span className="game-panel-handle-title">{panelTitle}</span>
            {inConversation && !panelOpen && (
              <span className="game-panel-dot" aria-hidden="true" />
            )}
            <svg
              className="game-panel-chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            id="game-panel-body"
            className="game-panel-body flex flex-col px-4 py-4 sm:px-6 lg:py-6 text-brown-100"
            ref={scrollViewRef}
            onFocusCapture={() => setPanelOpen(true)}
          >
            <PlayerDetails
              worldId={worldId}
              engineId={engineId}
              game={game}
              playerId={selectedElement?.id}
              setSelectedElement={setSelectedElement}
              scrollViewRef={scrollViewRef}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
