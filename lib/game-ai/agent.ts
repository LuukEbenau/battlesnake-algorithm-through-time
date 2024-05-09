import { BehaviorTreeBuilder } from "../behavior-tree/builder";
import { Action, Behavior } from "../behavior-tree";
import { fail, fallback, succeed } from "../behavior-tree/tasks";
import { AStar } from "../path-finding";
import { Vector2Int } from "../util/vectors";
import { GameState } from "../../types";
import { iterateDirections } from "../util/grid";

/**
 * Interface for agent state that is necessary to execute the behavior tree
 */
export interface AgentState {
    readonly aStar: AStar<Vector2Int>;
    get gameState(): GameState;
    get currentPosition(): Vector2Int;
    isCellFree(cell: Vector2Int): boolean;
    isCellInGrid(cell: Vector2Int): boolean;
}

/**
 * Interface for configurational constants
 */
export interface AgentConfig {
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

function blockEnemy(): Action<AgentAction> {
    return fail();
}

function eatSelectedFood(state: AgentState, food: Vector2Int): Action<AgentAction> {
    if (food === undefined) {
        return fail();
    }

    const path = state.aStar.findPath(state.currentPosition, food);

    if (path.length < 2) {
        return fail();
    }

    const direction = new Vector2Int(path[1].x - path[0].x, path[1].y - path[0].y);

    if (direction.x < 0) {
        return succeed(AgentAction.Left);
    }
    if (direction.x > 0) {
        return succeed(AgentAction.Right);
    }
    if (direction.y < 0) {
        return succeed(AgentAction.Down);
    }
    return succeed(AgentAction.Up);
}

function eatFood(state: AgentState): Action<AgentAction> {
    const position = state.currentPosition;
    const sortedFoods = state.gameState.board.food
        .map(f => new Vector2Int(f.x, f.y))
        .map(f => ({ position: f, distance: position.distance(f) }))
        .sort((a, b) => a.distance - b.distance)
        .map(f => Vector2Int.fromCoord(f.position));

    for (const food of sortedFoods) {
        const action = eatSelectedFood(state, food);

        if (action.status) {
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
            blockEnemy,
            eatFood,
            stayAlive,
        )
    );

    return tree.toBehavior(config);
}
