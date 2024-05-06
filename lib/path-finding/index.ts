export interface AStar<T> {
    findPath(start: T, goal: T): T[];
}

export interface AStarProvider<TData, TNode> {
    // format is [x][y][t] => t is currently always 0, until implemented
    prepare(start: TData, goal: TData): void;

    get isInitialized():boolean;

    clear(): void;

    distance(a: TNode, b: TNode): number;

    heuristic(a: TNode, b: TNode): number;

    isGoalReached(a: TNode, b: TNode): boolean;

    getNeighbors(node: TNode): IterableIterator<TNode>;

    inMapStart(start: TData, goal: TData): TNode;

    inMapGoal(start: TData, goal: TData): TNode;

    outMap(data: TNode, start: TData, goal: TData): TData;

    outMapStart(node: TNode, start: TData, goal: TData): TData;

    outMapGoal(node: TNode, start: TData, goal: TData): TData;
}
