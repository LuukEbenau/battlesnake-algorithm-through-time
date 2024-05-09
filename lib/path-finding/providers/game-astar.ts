import { AbstractAStarProvider } from "..";
import { Vector2Int } from "../../util/vectors";

export class GameAStarNode {
    constructor(public readonly position: Vector2Int, public readonly direction: Vector2Int) {}
}

export class GameAStarProvider extends AbstractAStarProvider<Vector2Int, GameAStarNode, string> {
	private readonly directionVectors = [new Vector2Int(-1,0), new Vector2Int(1,0), new Vector2Int(0,1), new Vector2Int(0,-1)];

	// format is [x][y][t] => t is currently always 0, until implemented
	private grid: number[][][] = [];
    private currentDirection = Vector2Int.DEFAULT();

	addState(currentDirection: Vector2Int, grid: number[][][]): void {
        this.currentDirection = currentDirection;
		this.grid = grid;
	}

    override isGoal(goalNode: GameAStarNode, node: GameAStarNode): boolean {
        return goalNode.position.equals(node.position);
    }

	override distance(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}
	override heuristic(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}

	private cellInsideBoundaries(cell:Vector2Int): boolean{
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

    override getId(node: GameAStarNode): string {
        return JSON.stringify([node.position.x, node.position.y, node.direction.x, node.direction.y]);
    }

	override *getNeighbors(node: GameAStarNode): IterableIterator<GameAStarNode> {
        const oppositeDirection = new Vector2Int(-node.direction.x, -node.direction.y);

		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);

			if (this.cellInsideBoundaries(cell) && this.grid[cell.x][cell.y][0] === 0 && !oppositeDirection.equals(directionVector)) {
				yield new GameAStarNode(cell, directionVector);
			}
		}
	}
	override inMapStart(start: Vector2Int, goal: Vector2Int): GameAStarNode {
		return new GameAStarNode(start, this.currentDirection);
	}
    override inMapGoal(start: Vector2Int, goal: Vector2Int): GameAStarNode {
        return new GameAStarNode(goal, Vector2Int.DEFAULT());
    }
	override outMap(data: GameAStarNode): Vector2Int {
		return data.position;
	}
}
