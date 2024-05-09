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

    // private generateNewGridLayerForTimestep(t:number, currentNode: GridAStarNode){
    //     let prevPath = this.getPrevCellsInPath(currentNode);

    //     let width = this.grid[0].length;
    //     let height = this.grid[0][0].length;

    //     let gridLayer = new Array(width);
    //     for (let x: number = 0; x < width; x++) {
    //         gridLayer[x] = new Array(height);

    //         for (let y: number = 0; y < height; y++) {
    //             gridLayer[x][y] = 1;
    //         }
    //     }

    //     // Now, we need to add a obstacle for each of the tail segments which would still be there at the given timestep. Say the snake is 10 steps long,  we can remove
    //     return gridLayer;
    // }

    private getCoefficient(curNode:GridAStarNode, nextNode: GridAStarNode):number{
        // let timestepsInGrid = this.obstacleMap.getGridAtTime(0).length;
        let coefficient = this.obstacleMap.getGridAtTime(nextNode.position.z)[nextNode.position.x][nextNode.position.y];
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
		if(cell.x >= this.obstacleMap.getGridAtTime(0)?.length){
			return false;
		}
		if(cell.y >= this.obstacleMap?.getGridAtTime(0)[0]?.length){
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
