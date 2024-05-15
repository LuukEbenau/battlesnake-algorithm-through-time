import { Action, Task } from ".";

export function succeed<TAction>(action?: TAction): Action<TAction> {
    return new Action(true, action);
}

export function fail<TAction>(): Action<TAction> {
    return new Action(false);
}

export function status<TAction>(statusBool: boolean): Action<TAction> {
    return new Action(statusBool);
}

export function treeSucceed<TState, TAction, TConfig>(): Task<TState, TAction, TConfig> {
    return () => new Action(true);
}

export function treeFail<TState, TAction, TConfig>(): Task<TState, TAction, TConfig> {
    return () => new Action(false);
}

export function treeStatus<TState, TAction, TConfig>(statusBool: boolean): Task<TState, TAction, TConfig> {
    return () => new Action(statusBool);
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

// if-then-else
export function ite<TState, TAction, TConfig>(decisionTask: Task<TState, TAction, TConfig>, ifTask: Task<TState, TAction, TConfig>, elseTask?: Task<TState, TAction, TConfig>): Task<TState, TAction, TConfig> {
    return (state, config, behaviorTree) => {
        const decisionAction = decisionTask(state, config, behaviorTree);

        if (decisionAction.status) {
            return ifTask(state, config, behaviorTree);
        }

        if (elseTask === undefined) {
            return new Action(false);
        }

        return elseTask(state, config, behaviorTree);
    };
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

// synonyms for sequence and fallback
export const and = sequence;
export const or = fallback;
