import { Vector2Int } from "../../util/vectors";
import { GridAStarNode, GridAStarProvider } from "./grid-astar";

export class GameAStarProvider extends GridAStarProvider {
	// format is [x][y][t] => t is currently always 0, until implemented
	private grid: number[][][] = [];

	updateState(grid: number[][][]): void {
		this.grid = grid;
	}

    distance(a: GridAStarNode, b: GridAStarNode): number {
        return super.distance(a, b);
    }

	private cellInsideBoundaries(cell: Vector2Int): boolean {
		if(cell.x <0){
			return false;
		}
		if(cell.y < 0){
			return false;
		}
		if(cell.x >= this.grid.length){
			return false;
		}
		if(cell.y >= this.grid[0].length){
			return false;
		}
		return true;
	}

    *getNeighbors(node: GridAStarNode): IterableIterator<GridAStarNode> {
        const oppositeDirection = new Vector2Int(-node.direction.x, -node.direction.y);
        const noDirection = oppositeDirection.equals(Vector2Int.zero());

		for (const neighbor of super.getNeighbors(node)) {
            const cell = neighbor.position;
            const direction = neighbor.direction;

			if (this.cellInsideBoundaries(cell) && this.grid[cell.x][cell.y][0] === 0
                && (noDirection || !oppositeDirection.equals(direction))) {
				yield neighbor;
			}
		}
    }
}
