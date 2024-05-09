import { AbstractAStarProvider } from "..";
import { Vector2Int } from "../../util/vectors";

export class GridAStarNode {
    constructor(public readonly position: Vector2Int, public readonly direction: Vector2Int) {}
}

export class GridAStarProvider extends AbstractAStarProvider<Vector2Int, GridAStarNode, string> {
	protected readonly directionVectors = [new Vector2Int(-1,0), new Vector2Int(1,0), new Vector2Int(0,1), new Vector2Int(0,-1)];

    override isGoal(goalNode: GridAStarNode, node: GridAStarNode): boolean {
        return goalNode.position.equals(node.position);
    }

	override distance(a: GridAStarNode, b: GridAStarNode): number {
		return a.position.distance(b.position);
	}
	override heuristic(a: GridAStarNode, b: GridAStarNode): number {
		return a.position.distance(b.position);
	}
    override getId(node: GridAStarNode): string {
        return JSON.stringify([node.position.x, node.position.y, node.direction.x, node.direction.y]);
    }

	override *getNeighbors(node: GridAStarNode): IterableIterator<GridAStarNode> {
		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);
            yield new GridAStarNode(cell, directionVector);
		}
	}
	override inMapStart(start: Vector2Int, goal: Vector2Int): GridAStarNode {
		return new GridAStarNode(start, new Vector2Int(0, 0));
	}
    override inMapGoal(start: Vector2Int, goal: Vector2Int): GridAStarNode {
        return new GridAStarNode(goal, Vector2Int.zero());
    }
	override outMap(data: GridAStarNode): Vector2Int {
		return data.position;
	}
}
