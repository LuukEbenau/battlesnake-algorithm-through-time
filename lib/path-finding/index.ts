export interface AStar<T> {
    findPath(start: T, goal: T): T[];
}

export interface AStarProvider<TData, TNode, TNodeId> {
    prepare(start: TData, goal: TData): void;

    clear(): void;

    distance(a: TNode, b: TNode): number;

    heuristic(a: TNode, b: TNode): number;

    isGoal(goalNode: TNode, node: TNode, goalNodeId: TNodeId, nodeId: TNodeId): boolean;

    getId(node: TNode): TNodeId;

    getNeighbors(node: TNode): IterableIterator<TNode>;

    inMapStart(start: TData, goal: TData): TNode;

    inMapGoal(start: TData, goal: TData): TNode;

    outMap(node: TNode, start: TData, goal: TData): TData;

    outMapStart(node: TNode, start: TData, goal: TData): TData;

    outMapGoal(node: TNode, start: TData, goal: TData): TData;
}

export abstract class AbstractAStarProvider<TData, TNode, TNodeId> implements AStarProvider<TData, TNode, TNodeId> {
    prepare(): void {
    }
    clear(): void {
    }
    abstract distance(a: TNode, b: TNode): number;
    heuristic(a: TNode, b: TNode): number {
        return this.distance(a, b);
    }
    isGoal(goalNode: TNode, node: TNode, goalNodeId: TNodeId, nodeId: TNodeId): boolean {
        return goalNodeId === nodeId;
    }
    abstract getId(node: TNode): TNodeId;
    abstract getNeighbors(node: TNode): IterableIterator<TNode>;
    abstract inMapStart(start: TData, goal: TData): TNode;
    abstract inMapGoal(start: TData, goal: TData): TNode;
    abstract outMap(data: TNode, start: TData, goal: TData): TData;
    outMapStart(node: TNode, start: TData, goal: TData): TData {
        return start;
    }
    outMapGoal(node: TNode, start: TData, goal: TData): TData {
        return goal;
    }

}
