import { Action, Task } from ".";

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
