export interface AStar<T> {
    findPath(start: T, goal: T): T[];
}

export interface AStarProvider<TData, TNode, TNodeId> {
    prepare(start: TData, goals: TData[]): void;

    clear(): void;

    distance(a: TNode, b: TNode): number;

    heuristic(a: TNode, b: TNode): number;

    isGoal(goalNode: TNode, node: TNode, goalNodeId: TNodeId, nodeId: TNodeId): boolean;

    getId(node: TNode): TNodeId;

    getNeighbors(node: TNode): IterableIterator<TNode>;

    inMap(data: TData): TNode;

    outMap(node: TNode): TData;
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
    abstract inMap(data: TData): TNode;
    abstract outMap(node: TNode): TData;

}
