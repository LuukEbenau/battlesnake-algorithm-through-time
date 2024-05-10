import { AStar, AStarProvider } from ".";
import { PriorityQueue } from "../util/priority-queue";

export class StandardAStar<TData, TNode, TNodeId> implements AStar<TData> {

    constructor(private readonly provider: AStarProvider<TData, TNode, TNodeId>, private maxIterationCount = Number.MAX_VALUE) {
    }
    findPath(start: TData, goal: TData): TData[] {
        let iterationCount = 0;

        this.provider.prepare(start, goal);

        const startNode = this.provider.inMapStart(start, goal);
        const goalNode = this.provider.inMapGoal(start, goal);

        const startNodeId = this.provider.getId(startNode);
        const goalNodeId = this.provider.getId(goalNode);

        if (this.provider.isGoal(startNode, goalNode, startNodeId, goalNodeId)) {
            return [
                this.provider.outMapStart(startNode, start, goal),
                this.provider.outMapGoal(goalNode, start, goal),
            ];
        }

        const nodeStore = new Map<TNodeId, TNode>();
        nodeStore.set(startNodeId, startNode);
        nodeStore.set(goalNodeId, goalNode);

        const cameFrom = new Map<TNodeId, TNodeId>();

        const gScore = new Map<TNodeId, number>();
        gScore.set(startNodeId, 0);

        const openSet = new PriorityQueue<TNodeId>();

        const startFScore = this.provider.heuristic(startNode, goalNode);
        openSet.enqueue(startNodeId, startFScore);

        while (!openSet.isEmpty()) {
            const currentId = openSet.dequeue();

            iterationCount++;
            if(iterationCount> this.maxIterationCount){
                console.warn(`Astar timed out after trying ${this.maxIterationCount} iterations. Why did this happen? do we need to increase iteration count?`)
                break;
            }
            const current = this.safeGet(nodeStore, currentId);

            if (this.provider.isGoal(current, goalNode, currentId, goalNodeId)) {
                const path = this.reconstructPath(nodeStore, cameFrom, startNode, goalNode, currentId, start, goal);
                this.provider.clear();

                return path;
            }

            const currentGScore = this.safeGet(gScore, currentId);

            for (const neighbor of this.provider.getNeighbors(current)) {
                const neighborId = this.provider.getId(neighbor);

                const tentativeGScore = currentGScore + this.provider.distance(current, neighbor);
                const neighborGScore = gScore.get(neighborId);

                if (neighborGScore === undefined || tentativeGScore < neighborGScore) {
                    nodeStore.set(neighborId, neighbor);

                    cameFrom.set(neighborId, currentId);
                    gScore.set(neighborId, tentativeGScore);

                    const neighborFScore = tentativeGScore + this.provider.heuristic(neighbor, goalNode);
                    openSet.enqueue(neighborId, neighborFScore);
                }
            }
        }

        this.provider.clear();
        return [];
    }

    private reconstructPath(nodeStore: Map<TNodeId, TNode>, cameFrom: Map<TNodeId, TNodeId>, startNode: TNode, goalNode: TNode, currentGoalNodeId: TNodeId, start: TData, goal: TData): TData[] {
        const totalPath: TData[] = [];
        totalPath.push(this.provider.outMapGoal(goalNode, start, goal));

        let previousId = currentGoalNodeId;

        while (cameFrom.has(previousId)) {
            const currentId = this.safeGet(cameFrom, previousId);
            const current = this.safeGet(nodeStore, currentId);

            totalPath.push(this.provider.outMap(current, start, goal));
            previousId = currentId;
        }

        totalPath.reverse();
        totalPath[0] = this.provider.outMapStart(startNode, start, goal);

        return totalPath;
    }

    private safeGet<K, V>(map: Map<K, V>, key: K): V {
        const value = map.get(key);

        if (value === undefined) {
            throw new Error("invalid state");
        }

        return value;
    }

}
