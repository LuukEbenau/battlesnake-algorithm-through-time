// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import { AgentAction } from './lib/game-ai/agent';
import { AgentManager, AgentManagerConfig } from './lib/game-ai/agent-manager';
import runServer from './server';
import { GameState, InfoResponse, MoveResponse } from './types';
import fs from 'fs';

import { logInfo, loglevel } from './lib/config'

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info(): InfoResponse {
  logInfo("INFO");

  return {
    apiversion: "1",
    author: "Luuk&Adrian",       // TODO: Your Battlesnake Username
    color: "#880808", // TODO: Choose color
    head: "tongue",  // TODO: Choose head
    tail: "pixel",  // TODO: Choose tail
  };
}

const config: AgentManagerConfig = {
    aStarMaxIterationCount: 2500,
    wellFedHealth: 51,
    killLength: 10,
    escapeRetryCount: 5,
    cutoffDistance: 2,
    maxAgentsPerformingCutoff: 1,
    enableCutoff: false,
};
const gameManager = new AgentManager(config);

fs.mkdirSync('logs', { recursive: true });

// start is called when your Battlesnake begins a game
function start(gameState: GameState): void {
    logInfo("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState: GameState): void {
    logInfo("GAME OVER\n");
}

function move(gameState: GameState): MoveResponse {
    console.time('calculating move');

    gameManager.tick(gameState);
    let move = gameManager.performAction(gameState);

    console.timeEnd('calculating move');

    logInfo(`STEP: ${move}`);
    if (move == AgentAction.Continue) {
        // TODO: improve?
        console.warn("Continue move command retrieved, this shouldnt happen");
        move = AgentAction.Right;
    }

    return { move };
}

/*
// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState: GameState): MoveResponse {

  let isMoveSafe: { [key: string]: boolean; } = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {        // Neck is left of head, don't move left
    isMoveSafe.left = false;

  } else if (myNeck.x > myHead.x) { // Neck is right of head, don't move right
    isMoveSafe.right = false;

  } else if (myNeck.y < myHead.y) { // Neck is below head, don't move down
    isMoveSafe.down = false;

  } else if (myNeck.y > myHead.y) { // Neck is above head, don't move up
    isMoveSafe.up = false;
  }

  let grid = createGrid(gameState.board.width,gameState.board.height)

  // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;

  // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
  // myBody = gameState.you.body;

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // opponents = gameState.board.snakes;

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter(key => isMoveSafe[key]);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Choose a random move from the safe moves
  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  console.log(`MOVE ${gameState.turn}: ${nextMove}`)
  return { move: nextMove };
}
*/

runServer({
  info: info,
  start: start,
  move: move,
  end: end
});
