import { LOGLEVEL, loglevel } from "../../config";
import { ObstacleGrid } from "../../game-ai/obstaclegrid";
import { Vector2Int, Vector3Int } from "../../util/vectors";
import { GridAStarNode, GridAStarProvider } from "./grid-astar";

export class GameAStarProvider extends GridAStarProvider {
    /**format is [t][x][y] */
	private obstacleMap!: ObstacleGrid;
    private _maxHeuristicValue : number = 10000; // maximum heuristic value possible before a node is not searchable.

	updateState(grid:ObstacleGrid): void {
		this.obstacleMap = grid;
	}

    /**
     *
     * @param node
     * @returns a list of previously explored cells, starting from the last timestep
     */
    private getPrevCellsInPath(node:GridAStarNode):GridAStarNode[] {
        let prevPath: GridAStarNode[] = []

        let currentNode: GridAStarNode | undefined = node;
        while(currentNode != undefined){
            prevPath.push(currentNode);
            currentNode = currentNode?.prevNode;
        }

        return prevPath
    }

    /**
     * This function checks if a cell is part of the current snake body at the given timestep.
     * @param curNode The node where the snake is currently at
     * @param nextNode The node which we are checking right now, so a possible new cell for the snake head
     * @returns
     */
    private _getAvoidPreviousPathCoefficient(curNode:GridAStarNode, nextNode: GridAStarNode){
        // For now, check if node is part of path. If this is true, don't consider it
        let prevNodes = this.getPrevCellsInPath(curNode);
        let currentPathLength = prevNodes.length;
        let snakeLength = this.obstacleMap.state.you.body.length;

        // WHICH of the coords of the previous path should we treat as a obstacle? only obstacles which will still be blocked at this moment in time.
        let numToSkip = currentPathLength - (snakeLength as number);
        if(numToSkip <0) numToSkip = 0;
        let cellCountToCheck = currentPathLength - numToSkip;
        if(cellCountToCheck > 0){
            let currentCellsToChecks = prevNodes.slice(0, cellCountToCheck)// only the cells occupied by the snake at the current timestep

            if(loglevel <= LOGLEVEL.DEBUG && snakeLength && snakeLength===4){
                let snakeString = "";
                for(let cell of currentCellsToChecks){
                    snakeString += "("+`${cell.position.x}|${cell.position.y}` + ")-";
                }
                console.log(`Snake of length ${snakeLength} and shape at timestep ${nextNode.position.z}: ${snakeString}`);
            }

            let partOfPrevNodes = currentCellsToChecks.some(prevNode => nextNode.position.equals(prevNode.position));

            if(partOfPrevNodes){
                return 20000;
            }
        }

        return 0;
    }

    private getCoefficient(curNode:GridAStarNode, nextNode: GridAStarNode):number{
        let coefficient = this.obstacleMap.getGridAtTime(nextNode.position.z)[nextNode.position.x][nextNode.position.y];

        let nextNodeCoefficient = this._getAvoidPreviousPathCoefficient(curNode,nextNode)
        if(nextNodeCoefficient>0){
            coefficient = nextNodeCoefficient;
        }

        return coefficient;
    }

    override distance(a: GridAStarNode, b: GridAStarNode): number {
        return this.getCoefficient(a,b) * super.distance(a, b);
    }

	private cellInsideBoundaries(cell: Vector2Int): boolean {
		if(cell.x < 0){
			return false;
		}
		if(cell.y < 0){
			return false;
		}
		if(cell.x >= this.obstacleMap.getGridAtTime(0).length){
			return false;
		}
		if(cell.y >= this.obstacleMap?.getGridAtTime(0)[0].length){
			return false;
		}
		return true;
	}

    override *getNeighbors(node: GridAStarNode): IterableIterator<GridAStarNode> {
        const oppositeDirection = new Vector2Int(-node.direction.x, -node.direction.y);
        const noDirection = oppositeDirection.equals(Vector2Int.zero());

		for (const neighbor of super.getNeighbors(node)) {
            const cell = neighbor.position;
            const direction = neighbor.direction;

			if (this.cellInsideBoundaries(cell) && this.getCoefficient(node,neighbor) < this._maxHeuristicValue // just a high number
                    && (noDirection || !oppositeDirection.equals(direction))) {
				yield neighbor;
			}
		}
	}
}
