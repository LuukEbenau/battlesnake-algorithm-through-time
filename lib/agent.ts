import { BehaviorTreeBuilder } from "./behavior-tree/builder";
import { Action, Behavior } from "./behavior-tree";
import { fail, succeed } from "./behavior-tree/tasks";
import { AStar } from "./path-finding";
import { Vector2Int } from "./path-finding/datastructures/vectors";

/**
 * Interface for agent state that is necessary to execute the behavior tree
 */
export interface AgentState {
    readonly aStar: AStar<Vector2Int>;
    getCurrentPosition(): Vector2Int;
    getClosestFood(): Vector2Int | undefined;
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
    Continue,
    Up,
    Down,
    Left,
    Right,
}

function execAgent(state: AgentState): Action<AgentAction> {
    const food = state.getClosestFood();

    if (food === undefined) {
        return fail();
    }

    const path = state.aStar.findPath(state.getCurrentPosition(), food);

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

function defineAgent(config: AgentConfig): Behavior<AgentState, AgentAction> {
    const tree = new BehaviorTreeBuilder<AgentState, AgentAction, AgentConfig>(AgentAction.Continue);

    tree.setRootTree('root', execAgent);

    return tree.toBehavior(config);
}
