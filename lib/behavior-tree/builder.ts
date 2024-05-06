import { Behavior, BehaviorTree, Task } from ".";
import { succeed } from "./tasks";

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
            const rootTree = this.getRootTree();
            const action = rootTree(state, config, this);

            if (!action.status) {
                return this.noopAction;
            }

            return action.action ?? this.noopAction;
        }
    }
}
