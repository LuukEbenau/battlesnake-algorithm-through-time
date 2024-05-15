import { BehaviorTreeBuilder } from "../behavior-tree/builder";
import { Action, Behavior } from "../behavior-tree";
import { and, fail, fallback, ite, status, succeed, treeFail } from "../behavior-tree/tasks";
import { AStar } from "../path-finding";
import { Vector2Int } from "../util/vectors";
import { GameState } from "../../types";
import { iterateDirections } from "../util/grid";
import { TeamCommunicator } from "./team-communicator";

/**
 * Interface for agent state that is necessary to execute the behavior tree
 */
export interface AgentState {
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
    return AgentAction.Continue;
}

function isWellFed(state: AgentState, config: AgentConfig): Action<AgentAction> {
    return status(state.gameState.you.health >= config.wellFedHealth);
}

function isLongEnoughToKill(state: AgentState, config: AgentConfig): Action<AgentAction> {
    return status(state.gameState.you.body.length >= config.killLength);
}

function cutoffEnemy(): Action<AgentAction> {
    return fail();
}

function nextMove(timeGrid: number[][], currentTime: number, move: Vector2Int, currentAgentLength: number): boolean {
    const considerFor = timeGrid[move.x][move.y];

    if (considerFor >= currentTime) {
        return false;
    }

    return true;
}

function generateTimeGrid(state: AgentState, path: Vector2Int[]): number[][] {
    const grid: number[][] = [];

    for (let i = 0; i < state.gameState.board.width; i++) {
        const row: number[] = [];
        grid.push(row);

        for (let j = 0; j < state.gameState.board.height; j++) {
            row.push(0);
        }
    }

    for (const { body } of state.gameState.board.snakes) {
        const considerLen = body.length - 1;

        for (let i = 0; i < considerLen; i++) {
            const coord = body[i];
            const considerFor = considerLen - i;

            grid[coord.x][coord.y] = considerFor;
        }
    }

    return grid;
}

function canEscapeAfterwards(state: AgentState, path: Vector2Int[]): boolean {
    const agentLength = state.gameState.you.body.length;
    const timeGrid = generateTimeGrid(state, path);

    const pathLen = path.length;
    let currentTime = 1;

    for (let i = 1; i < pathLen; i++) {
        const result = nextMove(timeGrid, currentTime, path[i], agentLength);

        if (!result) {
            throw new Error("this should never happen");
        }

        currentTime++;
    }

    return true;
}

function registerMove(state: AgentState, target: Vector2Int): Action<AgentAction> {
    const agentId = state.agentId;
    const path = state.aStar.findPath(state.currentPosition, target);

    if (path.length < 2) {
        return fail();
    }

    if (!canEscapeAfterwards(state, path)) {
        return fail();
    }

    state.teamCommunicator.setAgentPath(agentId, path);

    const direction = new Vector2Int(path[1].x - path[0].x, path[1].y - path[0].y);
    return succeed(directionToAction(direction));
}

function eatFood(state: AgentState): Action<AgentAction> {
    const position = state.currentPosition;
    const agentId = state.agentId;

    const sortedFoods = state.teamCommunicator.getAvailableFoods(agentId)
        .map(f => new Vector2Int(f.x, f.y))
        .map(f => ({ position: f, distance: position.distance(f) }))
        .sort((a, b) => a.distance - b.distance)
        .map(f => Vector2Int.fromCoord(f.position));

    for (const food of sortedFoods) {
        const action = registerMove(state, food);

        if (action.status) {
            state.teamCommunicator.claimFood(agentId, food);
            return action;
        }
    }

    return fail();
}

function stayAlive(state: AgentState): Action<AgentAction> {
    const position = state.currentPosition;

    for (const direction of iterateDirections()) {
        const cell = position.add(direction);

        if (state.isCellInGrid(cell) && state.isCellFree(cell)) {
            return succeed(directionToAction(direction));
        }
    }

    return fail();
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
            stayAlive,
        )
    );

    return tree.toBehavior(config);
}
