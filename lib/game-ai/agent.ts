import { BehaviorTreeBuilder } from "../behavior-tree/builder";
import { Action, Behavior } from "../behavior-tree";
import { and, fail, fallback, ite, status, succeed, treeFail } from "../behavior-tree/tasks";
import { AStar } from "../path-finding";
import { Vector2, Vector2Int } from "../util/vectors";
import { GameState } from "../../types";
import { iterateDirections } from "../util/grid";
import { TeamCommunicator } from "./team-communicator";
import { LOGLEVEL, loglevel } from "../config";
import { ObstacleGrid } from "./obstaclegrid";

/**
 * Interface for agent state that is necessary to execute the behavior tree
 */
export interface AgentState {
    readonly obstacleMap: ObstacleGrid;
    readonly aStar: AStar<Vector2Int>;
    readonly teamCommunicator: TeamCommunicator;
    get agentId(): string;
    get gameState(): GameState;
    get currentPosition(): Vector2Int;
    isCellFree(cell: Vector2Int): boolean;
    isCellInGrid(cell: Vector2Int): boolean;
}

/**
 * Interface for configurational constants
 */
export interface AgentConfig {
    readonly wellFedHealth: number;
    readonly killLength: number;
    readonly escapeRetryCount: number;
    readonly cutoffDistance: number;
    readonly maxAgentsPerformingCutoff: number;
}

/**
 * Actions the agent can take
 */
export enum AgentAction {
    Continue = "continue",
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right",
}

function directionToAction(direction: Vector2Int): AgentAction {
    if (direction.y == 0) {
        if (direction.x < 0) {
            return AgentAction.Left;
        }
        if (direction.x > 0) {
            return AgentAction.Right;
        }
    }
    else if (direction.x == 0) {
        if (direction.y < 0) {
            return AgentAction.Down;
        }
        if (direction.y > 0) {
            return AgentAction.Up;
        }
    }
    console.warn(`Direction is ${direction.x}:${direction.y}, this should not happen`)
    return AgentAction.Continue;
}

function isWellFed(state: AgentState, config: AgentConfig): Action<AgentAction> {
    return status(state.gameState.you.health >= config.wellFedHealth);
}

function isLongEnoughToKill(state: AgentState, config: AgentConfig): Action<AgentAction> {
    return status(state.gameState.you.body.length >= config.killLength);
}

function performCutoff(state: AgentState, config: AgentConfig, enemyBody: Vector2Int[]): Vector2Int[] {
    return [];
}

function cutoffEnemy(state: AgentState, config: AgentConfig): Action<AgentAction> {
    let enemy: [string, Vector2Int[]];

    const targets = state.teamCommunicator.iterateTargetableEnemies(
        state.agentId,
        (a, b) => a[0].distance(b[0])
    );

    for (const [enemyId, body] of targets) {
        const cutoffPath = performCutoff(state, config, body);

        if (cutoffPath.length < 2) {
            continue;
        }

        const action = registerPath(state, config, cutoffPath);

        if (action.status) {
            return action;
        }
    }

    return fail();
}

function registerMove(state: AgentState, config: AgentConfig, target: Vector2Int): Action<AgentAction> {
    return registerPath(state, config, state.aStar.findPath(state.currentPosition, target));
}

function registerPath(state: AgentState, config: AgentConfig, path: Vector2Int[]): Action<AgentAction> {

    if (path.length < 2) {
        return fail();
    }

    state.teamCommunicator.setAgentPath(state.agentId, path);

    const direction = new Vector2Int(path[1].x - path[0].x, path[1].y - path[0].y);
    return succeed(directionToAction(direction));
}

function eatFood(state: AgentState, config: AgentConfig): Action<AgentAction> {
    const position = state.currentPosition;
    const agentId = state.agentId;

    //NOTE: .getAvailableFoods replaced with getAllFoods for now for testing
    const sortedFoods = state.teamCommunicator.getAvailableFoods(agentId)
        .map(f => new Vector2Int(f.x, f.y))
        .map(f => ({ position: f, distance: position.distance(f) }))
        .sort((a, b) => a.distance - b.distance)
        .map(f => Vector2Int.fromCoord(f.position));

    for (const food of sortedFoods) {
        const action = registerMove(state, config, food);

        if (action.status) {
            state.teamCommunicator.claimFood(agentId, food);
            return action;
        }
    }

    return fail();
}

function stayAlive(state: AgentState): Action<AgentAction> {
    const position = state.currentPosition;
    if(loglevel <= LOGLEVEL.DEBUG) console.log("Initializing stayAlive sequence");
    for (const direction of iterateDirections()) {
        const cell = position.add(direction);

        if (state.isCellInGrid(cell) && state.isCellFree(cell)) {
            return succeed(directionToAction(direction));
        }
    }

    return fail();
}

/**
 * I made (together with gpt bc im lazy) this function which picks a point with a bias towards points in the center. I assume that the center is usually a safer place to go, so this would be the best scenario.
 * @param state
 * @returns
 */
function pickRandomPosition(state: AgentState): Vector2Int {
    const { width, height } = state.gameState.board;
    const center = new Vector2(width / 2, height / 2);

    // Create an array of all positions with their weights
    const positions: { position: Vector2Int; weight: number }[] = [];

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const position = new Vector2Int(x, y);
            const distance = position.distance(center);
            const weight = Math.log2(distance + 1); // Using log2 for weighting, +1 to avoid log(0)
            positions.push({ position, weight });
        }
    }

    // Calculate the total weight
    const totalWeight = positions.reduce((sum, pos) => sum + (1 / pos.weight), 0);

    // Generate a random number between 0 and totalWeight
    const randomValue = Math.random() * totalWeight;

    // Pick a position based on the random value and weights
    let accumulatedWeight = 0;
    for (const pos of positions) {
        accumulatedWeight += (1 / pos.weight);
        if (randomValue < accumulatedWeight) {
            return pos.position;
        }
    }

    // Fallback in case something goes wrong
    return new Vector2Int(Math.floor(Math.random() * width), Math.floor(Math.random() * height));
}


function stayAliveImproved(state: AgentState): Action<AgentAction> {
    // const agentLength = state.gameState.you.body.length;
    // const requiredPathLength = agentLength + 1;
    let escapeRetryCount = 10
    let path: Vector2Int[] = [];

    let i = 0;
    let _timeout = 0;
    while (i < escapeRetryCount){
        const randomPosition = pickRandomPosition(state);
        let gridLayer = state.obstacleMap.getGridAtTime(0);
        if(_timeout > 100) break; //fail safe, should never trigger. but in very lategame this could theoretically be possible
        if(gridLayer[randomPosition.x][randomPosition.y]>1.35){
            _timeout++;
            continue; //find a position which is not blocked
        }

        i++;

        path = state.aStar.findPath(state.currentPosition, randomPosition);

        if (path.length >= 2) {
            break;
        }
    }

    if (path.length < 2) {
        return fail();
    }

    state.teamCommunicator.setAgentPath(state.agentId, path);

    const direction = new Vector2Int(path[1].x - path[0].x, path[1].y - path[0].y);
    return succeed(directionToAction(direction));
}

export function defineAgent(config: AgentConfig): Behavior<AgentState, AgentAction> {
    const tree = new BehaviorTreeBuilder<AgentState, AgentAction, AgentConfig>(AgentAction.Continue);

    tree.setRootTree(
        'root',
        fallback(
            ite(
                and(isWellFed, isLongEnoughToKill),
                cutoffEnemy,
            ),
            eatFood,
            stayAliveImproved,
            stayAlive,
        )
    );

    return tree.toBehavior(config);
}
