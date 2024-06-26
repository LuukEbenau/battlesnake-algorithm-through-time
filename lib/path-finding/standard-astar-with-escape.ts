import { AStar, AStarProvider } from ".";
import { GameState } from "../../types";
import { LOGLEVEL, logInfo, loglevel } from "../config";
import { PriorityQueue } from "../util/priority-queue";
import { GameAStarProvider } from "./providers/game-astar";
import { GridAStarNode } from "./providers/grid-astar";

export class StandardAStarWithEscape<TData, TNode extends GridAStarNode, TNodeId> implements AStar<TData> {

    constructor(private readonly provider: AStarProvider<TData, TNode, TNodeId>, private state: GameState, private maxIterationCount = 1000) {
    }

    findPath(start: TData, ...goals: TData[]): TData[] {
        if (goals.length === 0) {
            return [];
        }
        let goal = goals[0]; // we only want to consider one goal in our case.
        if(goals.length > 1 && loglevel <= LOGLEVEL.WARNING) console.warn("more than 1 goal is supplied. not supported by curreny A* algorithm, subsequent goals are ignored.")

        this.provider.prepare(start, goals);

        const goalNode = this.provider.inMap(goal);
        let startNode = this.provider.inMap(start);


        let nodeStore = new Map<TNodeId, TNode>();

        const cameFrom = new Map<TNodeId, TNodeId>();

        const startNodeId = this.provider.getId(startNode);
        const goalNodeId = this.provider.getId(goalNode);
        nodeStore.set(startNodeId, startNode);
        nodeStore.set(goalNodeId, goalNode);


        const path = this.findSinglePath(startNodeId, goalNodeId, nodeStore, cameFrom);
        if (path.length === 0) {
            return [];
        }
        let gameprov = this.provider as unknown as GameAStarProvider;
        gameprov.snakeExtraLength += 1;

        //Now, we need to check if we can still escape from this point forward. To do this, we can simply clear the openset to only contain the surrounding nodes, and see if it can survive.
        let lastPos = path[path.length-1];

        // lastPos.position
        this.state.you.body = [lastPos.position, ...this.state.you.body]; //CHECKME: i think this will kind of fix the fact that eating food will make the snake 1 tile longer. but idk about sideeffects.

        //now, try to see if the snake can survive for at least <snakesize*1.25> amount of timesteps
        let lastTimeStep = lastPos.position.z;
        let bodyLength = this.state.you.body.length;

        let timestepsToSurvive = bodyLength;

        logInfo(`Turn ${this.state.turn}: Trying to find an escape path from timestep ${lastTimeStep} for ${bodyLength} timesteps`);

        nodeStore = new Map<TNodeId, TNode>();
        nodeStore.set(this.provider.getId(lastPos), lastPos); // if i dont do it it crashes?

        //TODO: PROBLEM WITH ESCAPE PATH: right now it only checks one entrance of the 4 possible entrances to get to the goal node. What we would want to do is consider all 4 possible entrance paths. This way, it will not block its escape path.

        //TODO: when food is eaten, our snake is effectively 1 time extra long, but this is not yet taken into account. Therefore, it could happen that it walks into its own tail since it assumes the tail will disappear.

        let escapePathFound : boolean = this.findIfEscapePathIsAvailable(this.provider.getId(lastPos), lastTimeStep+timestepsToSurvive, nodeStore, cameFrom);

        if(!escapePathFound){
            logInfo(`Turn ${this.state.turn}: No escape path found after gathering food, finding alternative routes...`);
            return [];
        }

        const outPath = path.map(node => this.provider.outMap(node));

        this.provider.clear();

        return outPath;
    }

    private findIfEscapePathIsAvailable(startNodeId: TNodeId, goalTimeStep:number, nodeStore: Map<TNodeId, TNode>, cameFrom: Map<TNodeId, TNodeId>) : boolean {
        const openSet = new PriorityQueue<TNodeId>();
        let startNode = this.safeGet(nodeStore, startNodeId);

        // to encourage breath first searching, it takes elements with highest distance first
        openSet.clear();
        openSet.enqueue(startNodeId, 0);

        const gScore = new Map<TNodeId, number>();
        gScore.set(startNodeId, 0);

        let iterationCount = 0;

        while (!openSet.isEmpty()) {
            const currentId = openSet.dequeue();

            iterationCount++;
            if(iterationCount> this.maxIterationCount){
                console.warn(`Astar timed out after trying ${this.maxIterationCount} iterations. Why did this happen? do we need to increase iteration count?`)
                break;
            }
            const current = this.safeGet(nodeStore, currentId);

            //EXIT CONDITION: being at a timestep
            if (current.position.z >= goalTimeStep) {
                return true;
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

                    //CHANGE: negative FScore instead of positive, and encouraging higher z (time dimension) scores for bread first
                    const neighborFScore = 1000 - (neighbor.position.z + this.provider.heuristic(neighbor, startNode));
                    openSet.enqueue(neighborId, neighborFScore);
                }
            }
        }

        return false;
    }


    private findSinglePath(startNodeId: TNodeId, goalNodeId: TNodeId, nodeStore: Map<TNodeId, TNode>, cameFrom: Map<TNodeId, TNodeId>): TNode[] {
        const openSet = new PriorityQueue<TNodeId>();
        let startNode = this.safeGet(nodeStore, startNodeId);
        let goalNode = this.safeGet(nodeStore, goalNodeId);

        // if (this.provider.isGoal(startNode, goalNode, startNodeId, goalNodeId)) {
        //     return [startNode, goalNode];
        // }

        const gScore = new Map<TNodeId, number>();
        gScore.set(startNodeId, 0);

        const startFScore = this.provider.heuristic(startNode, goalNode);
        openSet.enqueue(startNodeId, startFScore);

        let iterationCount = 0;

        while (!openSet.isEmpty()) {
            const currentId = openSet.dequeue();

            iterationCount++;
            if(iterationCount> this.maxIterationCount){
                console.warn(`Astar timed out after trying ${this.maxIterationCount} iterations. Why did this happen? do we need to increase iteration count?`)
                break;
            }
            const current = this.safeGet(nodeStore, currentId);

            if (this.provider.isGoal(current, goalNode, currentId, goalNodeId)) {
                goalNode.position.z = current.position.z; // its kinda hacky, but i put the time step in here once the goal is found. for some reason the nodelist otherwise doesnt update
                const path = this.reconstructPath(nodeStore, cameFrom, goalNode, currentId);
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

                    neighbor.prevNode = current; // NOTE: i now set it in here instead of in the provider. this seems cleaner, since the cameFrom is also set here. would be even better to have the cameFrom function in here, but this is good enough
                    cameFrom.set(neighborId, currentId);
                    gScore.set(neighborId, tentativeGScore);

                    const neighborFScore = tentativeGScore + this.provider.heuristic(neighbor, goalNode);
                    openSet.enqueue(neighborId, neighborFScore);
                }
            }
        }

        return [];
    }

    private reconstructPath(nodeStore: Map<TNodeId, TNode>, cameFrom: Map<TNodeId, TNodeId>, goalNode: TNode, currentGoalNodeId: TNodeId): TNode[] {
        const totalPath: TNode[] = [];
        totalPath.push(goalNode);

        let previousId = currentGoalNodeId;

        while (cameFrom.has(previousId)) {
            const currentId = this.safeGet(cameFrom, previousId);
            const current = this.safeGet(nodeStore, currentId);

            totalPath.push(current);
            previousId = currentId;
        }

        totalPath.reverse();
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
