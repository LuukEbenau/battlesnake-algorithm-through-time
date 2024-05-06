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

export class BehaviorTreeBuilder<TState, TAction, TConfig> implements BehaviorTree<TState, TAction, TConfig> {
    private readonly trees = new Map<string, Task<TState, TAction, TConfig>>();

    constructor(private readonly noopAction: TAction) {
        this.setRootTree(succeed);
    }

    setTree(name: string, tree: Task<TState, TAction, TConfig>): BehaviorTreeBuilder<TState, TAction, TConfig> {
        this.trees.set(name, tree);
        return this;
    }

    getTree(name: string): Task<TState, TAction, TConfig> {
        const tree = this.trees.get(name);

        if (tree === undefined) {
            throw Error(`Tree "${name}" not defined`);
        }

        return tree;
    }

    getRootTree(): Task<TState, TAction, TConfig> {
        return this.getTree("root");
    }

    setRootTree(tree: Task<TState, TAction, TConfig>): BehaviorTreeBuilder<TState, TAction, TConfig> {
        return this.setTree("root", tree);
    }

    toBehavior(config: TConfig): Behavior<TState, TAction> {
        return state => {
            const action = this.getRootTree()(state, config, this);

            if (!action.status) {
                return this.noopAction;
            }

            return action.action ?? this.noopAction;
        }
    }
}

export function succeed<TAction>(): Action<TAction>;
export function succeed<TAction>(action?: TAction): Action<TAction>;
export function succeed<TAction>(action?: TAction): Action<TAction> {
    return new Action(true, action);
}

export function fail<TAction>(): Action<TAction> {
    return new Action(false);
}

export function tree<TState, TAction, TConfig>(name: string): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => behaviorTree.getTree(name)(state, config, behaviorTree);
}

export function mute<TState, TAction, TConfig>(task: Task<TState, TAction, TConfig>): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => {
        const childAction = task(state, config, behaviorTree);
        return new Action(true, childAction.action);
    }
}

export function not<TState, TAction, TConfig>(task: Task<TState, TAction, TConfig>): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => {
        const childAction = task(state, config, behaviorTree);
        return new Action(!childAction.status, childAction.action);
    }
}

export function sequence<TState, TAction, TConfig>(...tasks: Task<TState, TAction, TConfig>[]): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => {
        let childAction = new Action<TAction>(true);

        for (const task of tasks) {
            childAction = task(state, config, behaviorTree);

            if (!childAction.status) {
                return childAction;
            }
        }

        return childAction;
    };
}

export function fallback<TState, TAction, TConfig>(...tasks: Task<TState, TAction, TConfig>[]): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => {
        let childAction = new Action<TAction>(false);

        for (const task of tasks) {
            childAction = task(state, config, behaviorTree);

            if (childAction.status) {
                return childAction;
            }
        }

        return childAction;
    };
}
