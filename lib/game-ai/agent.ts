import { BehaviorTreeBuilder } from "../behavior-tree/builder";
import { Action, Behavior } from "../behavior-tree";
import { fail, fallback, succeed } from "../behavior-tree/tasks";
import { AStar } from "../path-finding";
import { Vector2Int } from "../util/vectors";
import { GameState } from "../../types";

/**
 * Interface for agent state that is necessary to execute the behavior tree
 */
export interface AgentState {
    readonly aStar: AStar<Vector2Int>;
    get gameState(): GameState;
    get currentPosition(): Vector2Int;
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
    // TODO: change continue
    Continue = "continue",
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right",
}

function getClosestFood(state: AgentState): Vector2Int | undefined {
    const position = state.currentPosition;

    return Vector2Int.fromCoord(
        state.gameState.board
            .food
            .map(f => new Vector2Int(f.x, f.y))
            .map(f => ({ position: f, distance: position.distance(f) }))
            .sort((a, b) => a.distance - b.distance)[0]
            ?.position
    );
}

function blockEnemy(): Action<AgentAction> {
    return fail();
}

function eatFood(state: AgentState): Action<AgentAction> {
    const food = getClosestFood(state);

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

function avoidDeath(state: AgentState): Action<AgentAction> {
    return fail();
}

export function defineAgent(config: AgentConfig): Behavior<AgentState, AgentAction> {
    const tree = new BehaviorTreeBuilder<AgentState, AgentAction, AgentConfig>(AgentAction.Continue);

    tree.setRootTree(
        'root',
        fallback(
            blockEnemy,
            eatFood,
            avoidDeath,
        )
    );

    return tree.toBehavior(config);
}
