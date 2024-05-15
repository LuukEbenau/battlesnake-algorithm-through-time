import { Behavior, BehaviorTree, Task } from ".";
import { treeSucceed } from "./tasks";

export class BehaviorTreeBuilder<TState, TAction, TConfig> implements BehaviorTree<TState, TAction, TConfig> {
    private readonly trees = new Map<string, Task<TState, TAction, TConfig>>();
    private rootName = '';

    constructor(private readonly noopAction: TAction) {
        this.setRootTree('root', treeSucceed());
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
        return this.getTree(this.rootName);
    }

    setRootTree(name: string, tree: Task<TState, TAction, TConfig>): BehaviorTreeBuilder<TState, TAction, TConfig> {
        this.rootName = name;
        return this.setTree(name, tree);
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
