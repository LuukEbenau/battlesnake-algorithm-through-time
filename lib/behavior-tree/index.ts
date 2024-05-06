export type Behavior<TState, TAction> = (state: TState) => TAction;

export type Task<TState, TAction, TConfig> = (state: TState, config: TConfig, behaviorTree: BehaviorTree<TState, TAction, TConfig>) => Action<TAction>;

export interface BehaviorTree<TState, TAction, TConfig> {
    getRootTree(): Task<TState, TAction, TConfig>;
    getTree(name: string): Task<TState, TAction, TConfig>;
    toBehavior(config: TConfig): Behavior<TState, TAction>;
}

export class Action<TAction> {
    constructor(public readonly status: boolean, public readonly action?: TAction) {
    }
}
