import { AStar, AStarProvider } from ".";
import { PriorityQueue } from "../util/priority-queue";

export class StandardAStar<TData, TNode> implements AStar<TData> {

    constructor(private readonly provider: AStarProvider<TData, TNode>) {
    }

    findPath(start: TData, goal: TData): TData[] {
        this.provider.prepare(start, goal);

        const startNode = this.provider.inMap(start);
        const goalNode = this.provider.inMap(goal);

        if (this.provider.equals(startNode, goalNode)) {
            return [
                this.provider.outMapStart(startNode, start, goal),
                this.provider.outMapGoal(goalNode, start, goal),
            ];
        }

        const cameFrom = new Map<TNode, TNode>();

        const gScore = new Map<TNode, number>();
        gScore.set(startNode, 0);

        const openSet = new PriorityQueue<TNode>();
        const closedSet = new Set<TNode>();

        const startFScore = this.provider.heuristic(startNode, goalNode);
        openSet.enqueue(startNode, startFScore);

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();

            if (this.provider.equals(current, goalNode)) {
                const path = this.reconstructPath(cameFrom, startNode, current, start, goal);
                this.provider.clear();

                return path;
            }

            if (closedSet.has(current)) {
                continue;
            }

            closedSet.add(current);

            const currentGScore = gScore.get(current);

            if (currentGScore === undefined) {
                throw new Error("invalid state");
            }

            for (const neighbor of this.provider.getNeighbors(current)) {
                const tentativeGScore = currentGScore + this.provider.distance(current, neighbor);
                const neighborGScore = gScore.get(neighbor);

                if (neighborGScore === undefined || tentativeGScore < neighborGScore) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);

                    const neighborFScore = tentativeGScore + this.provider.heuristic(neighbor, goalNode);
                    openSet.enqueue(neighbor, neighborFScore);
                }
            }
        }

        this.provider.clear();
        return [];
    }

    private reconstructPath(cameFrom: Map<TNode, TNode>, startNode: TNode, goalNode: TNode, start: TData, goal: TData): TData[] {
        const totalPath: TData[] = [];
        totalPath.push(this.provider.outMapGoal(goalNode, start, goal));

        let previous = goalNode;

        while (cameFrom.has(previous)) {
            // TODO: improve type safety?
            const current = cameFrom.get(previous)!;

            totalPath.push(this.provider.outMap(current, start, goal));
            previous = current;
        }

        totalPath.reverse();
        totalPath[0] = this.provider.outMapStart(startNode, start, goal);

        return totalPath;
    }

}
