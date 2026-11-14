import { internalMutation } from './_generated/server';
import { Descriptions } from '../data/characters';
import { DEFAULT_NAME } from './constants';

// Rewrites the descriptions of an already-initialized world so existing NPCs pick up the
// localized names and personas without wiping player memories or conversations.
export const localizeDefaultWorld = internalMutation({
  handler: async (ctx) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!worldStatus) {
      throw new Error('No default world found');
    }
    const worldId = worldStatus.worldId;
    const world = await ctx.db.get(worldId);
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    const playerDescriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .collect();
    const descriptionsByPlayer = new Map(playerDescriptions.map((d) => [d.playerId, d]));
    const descriptionsByCharacter = new Map(Descriptions.map((d) => [d.character, d]));
    const humanPlayerIds = new Set(
      world.players.filter((p) => p.human !== undefined).map((p) => p.id),
    );

    let updatedAgents = 0;
    let updatedPlayers = 0;
    for (const agent of world.agents) {
      const playerDescription = descriptionsByPlayer.get(agent.playerId);
      if (!playerDescription || humanPlayerIds.has(agent.playerId)) {
        continue;
      }
      const description = descriptionsByCharacter.get(playerDescription.character);
      if (!description) {
        continue;
      }
      if (
        playerDescription.name !== description.name ||
        playerDescription.description !== description.identity
      ) {
        await ctx.db.patch(playerDescription._id, {
          name: description.name,
          description: description.identity,
        });
        updatedPlayers += 1;
      }
      const agentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('agentId', agent.id))
        .first();
      if (
        agentDescription &&
        (agentDescription.identity !== description.identity ||
          agentDescription.plan !== description.plan)
      ) {
        await ctx.db.patch(agentDescription._id, {
          identity: description.identity,
          plan: description.plan,
        });
        updatedAgents += 1;
      }
    }

    const agentPlayerIds = new Set(world.agents.map((a) => a.playerId));
    for (const playerDescription of playerDescriptions) {
      if (agentPlayerIds.has(playerDescription.playerId)) {
        continue;
      }
      if (
        playerDescription.name !== DEFAULT_NAME &&
        (playerDescription.name === 'Me' ||
          playerDescription.description === 'Me is a human player')
      ) {
        await ctx.db.patch(playerDescription._id, {
          name: DEFAULT_NAME,
          description: `${DEFAULT_NAME}是一位人类玩家`,
        });
        updatedPlayers += 1;
      }
    }

    return { updatedAgents, updatedPlayers };
  },
});
