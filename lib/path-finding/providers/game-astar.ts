import { Vector2Int } from "../../util/vectors";
import { GridAStarNode, GridAStarProvider } from "./grid-astar";

export class GameAStarProvider extends GridAStarProvider {
    /**format is [t][x][y] */
	private grid: number[][][] = [];

	updateState(grid: number[][][]): void {
		this.grid = grid;
	}

    private getCoefficient(node: GridAStarNode):number{
        return this.grid[node.position.z][node.position.x][node.position.y];
    }

    override distance(a: GridAStarNode, b: GridAStarNode): number {
        return this.getCoefficient(b) * super.distance(a, b);
    }

	private cellInsideBoundaries(cell: Vector2Int): boolean {
		if(cell.x < 0){
			return false;
		}
		if(cell.y < 0){
			return false;
		}
		if(cell.x >= this.grid[0].length){
			return false;
		}
		if(cell.y >= this.grid[0][0].length){
			return false;
		}
		return true;
	}

    private _maxHeuristicValue : number = 10000; // maximum heuristic value possible before a node is not searchable.
    override *getNeighbors(node: GridAStarNode): IterableIterator<GridAStarNode> {
        const oppositeDirection = new Vector2Int(-node.direction.x, -node.direction.y);
        const noDirection = oppositeDirection.equals(Vector2Int.zero());

		for (const neighbor of super.getNeighbors(node)) {
            const cell = neighbor.position;
            const direction = neighbor.direction;

			if (this.cellInsideBoundaries(cell) && this.getCoefficient(neighbor) < this._maxHeuristicValue // just a high number
                    && (noDirection || !oppositeDirection.equals(direction))) {
				yield neighbor;
			}
		}
	}
}
