import { BehaviorTreeBuilder } from "./behavior-tree/builder";
import { Behavior } from "./behavior-tree";

export interface AgentState {
}

export interface AgentConfig {
}

export enum AgentAction {
    Noop,
}

function defineAgent(config: AgentConfig): Behavior<AgentState, AgentAction> {
    const tree = new BehaviorTreeBuilder<AgentState, AgentAction, AgentConfig>(AgentAction.Noop);

    return tree.toBehavior(config);
}
