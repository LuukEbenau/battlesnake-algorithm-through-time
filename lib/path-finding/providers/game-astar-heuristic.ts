import { AbstractAStarProvider } from "..";
import { Vector3Int } from "../../util/vectors";

export class GameAStarNode {
    constructor(public readonly position: Vector3Int, public readonly direction: Vector3Int) {}
}

export class GameAStarProviderHeuristic extends AbstractAStarProvider<Vector3Int, GameAStarNode, string> {
	private readonly directionVectors = [new Vector3Int(-1,0,1), new Vector3Int(1,0,1), new Vector3Int(0,1,1), new Vector3Int(0,-1,1)];

	// format is [x][y][t] => t is currently always 0, until implemented
	private grid: number[][][] = [];
    private currentDirection = Vector3Int.DEFAULT();

	addState(currentDirection: Vector3Int, grid: number[][][]): void {
		this.currentDirection = currentDirection;
		this.grid = grid;
	}

    override isGoal(goalNode: GameAStarNode, node: GameAStarNode): boolean {
        return goalNode.position.x == node.position.x && goalNode.position.y == goalNode.position.y;//NOTE: for now, i dont use equals, might use it later..equals(node.position);
    }

	override distance(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}
	override heuristic(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}

	private cellInsideBoundaries(cell:Vector3Int): boolean{
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
        const oppositeDirection = new Vector3Int(-node.direction.x, -node.direction.y,0);

		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);

			if (this.cellInsideBoundaries(cell) && this.grid[cell.x][cell.y][0] === 0 && !oppositeDirection.equals(directionVector)) {
				yield new GameAStarNode(cell, directionVector);
			}
		}
	}
	override inMapStart(start: Vector3Int, goal: Vector3Int): GameAStarNode {
		return new GameAStarNode(start, this.currentDirection);
	}
    override inMapGoal(start: Vector3Int, goal: Vector3Int): GameAStarNode {
        return new GameAStarNode(goal, Vector3Int.DEFAULT());
    }
	override outMap(data: GameAStarNode): Vector3Int {
		return data.position;
	}
}
