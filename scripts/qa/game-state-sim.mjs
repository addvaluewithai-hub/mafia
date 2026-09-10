import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('qa/reports');
fs.mkdirSync(reportDir, { recursive: true });

function mafiaCountFor(n) {
  if (n >= 10) return 3;
  if (n >= 6) return 2;
  return 1;
}

function makeGame(playerCount) {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i + 1}`,
    nickname: i === 0 ? 'Boss' : `Player ${i + 1}`,
    isHost: i === 0,
    isEliminated: false,
    role: i < mafiaCountFor(playerCount) ? 'mafia' : 'innocent',
  }));
  return {
    players,
    roundIndex: 0,
    lastResolvedRound: -1,
    status: 'playing',
    winner: null,
    votes: new Map(),
    maxRound: 3,
  };
}

function alive(game) {
  return game.players.filter((p) => !p.isEliminated);
}

function canVote(game, player) {
  return game.status === 'playing' && !player.isEliminated && game.lastResolvedRound < game.roundIndex;
}

function castVote(game, voterId, targetId) {
  const voter = game.players.find((p) => p.id === voterId);
  const target = game.players.find((p) => p.id === targetId);
  assert(voter && target, 'voter and target must exist');
  assert(canVote(game, voter), `${voterId} should be allowed to vote`);
  assert(!target.isEliminated, 'cannot vote for eliminated target');
  assert.notEqual(voterId, targetId, 'cannot vote for self');
  game.votes.set(voterId, targetId);
}

function resolveVote(game) {
  const eligible = alive(game);
  assert.equal(game.votes.size, eligible.length, 'all alive players must vote before resolve');
  const counts = new Map();
  for (const target of game.votes.values()) counts.set(target, (counts.get(target) ?? 0) + 1);
  const max = Math.max(...counts.values());
  const leaders = [...counts.entries()].filter(([, count]) => count === max).map(([id]) => id);
  if (leaders.length > 1) {
    game.votes.clear();
    return { status: 'tie' };
  }
  const target = game.players.find((p) => p.id === leaders[0]);
  target.isEliminated = true;
  game.lastResolvedRound = game.roundIndex;
  game.votes.clear();

  const aliveMafia = alive(game).filter((p) => p.role === 'mafia').length;
  const innocentOut = game.players.filter((p) => p.isEliminated && p.role === 'innocent').length;
  if (aliveMafia === 0) game.winner = 'innocents';
  else if (innocentOut >= 3 || game.roundIndex >= game.maxRound) game.winner = 'mafia';
  if (game.winner) game.status = 'finished';
  return { status: game.status === 'finished' ? 'finished' : 'eliminated', target };
}

function revealNextRound(game) {
  assert.equal(game.status, 'playing');
  assert.equal(game.lastResolvedRound, game.roundIndex, 'must resolve vote before next clue');
  assert(game.roundIndex < game.maxRound, 'no more rounds');
  game.roundIndex += 1;
}

function voteEveryoneFor(game, targetId) {
  for (const voter of alive(game)) {
    let target = targetId;
    if (voter.id === target) target = alive(game).find((p) => p.id !== voter.id)?.id;
    castVote(game, voter.id, target);
  }
}

function runScenario(playerCount, iteration) {
  const game = makeGame(playerCount);
  const boss = game.players[0];
  assert(canVote(game, boss), 'Boss must be both host and eligible voter at game start');

  // Force a deterministic tie once to prove the round reopens instead of deadlocking.
  const living = alive(game);
  if (living.length >= 4 && living.length % 2 === 0) {
    const a = living[0].id;
    const b = living[1].id;
    living.forEach((voter, index) => {
      let target = index < living.length / 2 ? a : b;
      if (target === voter.id) target = target === a ? b : a;
      castVote(game, voter.id, target);
    });
    const tie = resolveVote(game);
    assert.equal(tie.status, 'tie');
    assert.equal(game.lastResolvedRound, -1, 'tie must not resolve round');
    assert.equal(game.votes.size, 0, 'tie must clear votes');
    assert(canVote(game, boss), 'vote must reopen after tie');
  }

  // Eliminate mafia one by one where possible, proving next-round transitions.
  while (game.status === 'playing') {
    const target = alive(game).find((p) => p.role === 'mafia') ?? alive(game).find((p) => !p.isHost);
    assert(target, 'must have a target');
    voteEveryoneFor(game, target.id);
    const result = resolveVote(game);
    assert(['eliminated', 'finished'].includes(result.status));
    assert(!canVote(game, target), 'eliminated player must not vote');

    if (game.status === 'playing') {
      // Host control survives even if Boss is the eliminated target in other scenarios.
      assert(game.players[0].isHost, 'Boss control capability must remain independent from elimination');
      revealNextRound(game);
      for (const p of alive(game)) assert(canVote(game, p), 'all living players must vote in next round');
    }
  }

  assert(game.winner === 'innocents' || game.winner === 'mafia');
  return { playerCount, iteration, winner: game.winner, roundsReached: game.roundIndex + 1 };
}

const results = [];
for (const count of [5, 6, 7]) {
  for (let i = 1; i <= 20; i += 1) results.push(runScenario(count, i));
}

const report = {
  ok: true,
  simulations: results.length,
  playerCounts: [5, 6, 7],
  assertions: [
    'Boss can vote while retaining host capability',
    'Tie clears votes and reopens the same round',
    'Eliminated players cannot vote',
    'All living players can vote after next clue',
    'Game always reaches a winner',
  ],
  results,
};
fs.writeFileSync(path.join(reportDir, 'game-sim.json'), JSON.stringify(report, null, 2));
console.log(`QA game simulator: ${results.length} complete games passed.`);
