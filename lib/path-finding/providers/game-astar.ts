import { Vector2Int } from "../../util/vectors";
import { GridAStarNode, GridAStarProvider } from "./grid-astar";

export class GameAStarProvider extends GridAStarProvider {
	// format is [x][y][t] => t is currently always 0, until implemented
	private grid: number[][][] = [];

	updateState(grid: number[][][]): void {
		this.grid = grid;

	}

    private getCoefficient(node: GridAStarNode):number{
        // TODO: use time dimension
        let coefficient = this.grid[node.position.x][node.position.y][0];
        console.log("Coefficient is" + coefficient);
        return coefficient;
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
		if(cell.x >= this.grid.length-1){
			return false;
		}
		if(cell.y >= this.grid[0].length-1){
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

			if (this.cellInsideBoundaries(cell) && (noDirection || !oppositeDirection.equals(direction))) {
				yield neighbor;
			}
		}
	}
}
