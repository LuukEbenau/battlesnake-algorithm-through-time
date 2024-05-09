import { AbstractAStarProvider } from "..";
import { Vector3Int, Vector2Int } from "../../util/vectors";

export class GridAStarNode {
    constructor(public readonly position: Vector3Int, public readonly direction: Vector3Int, public prevNode : GridAStarNode|undefined) {}
}

export class GridAStarProvider extends AbstractAStarProvider<Vector2Int, GridAStarNode, string> {
	protected readonly directionVectors = [new Vector3Int(-1,0,1), new Vector3Int(1,0,1), new Vector3Int(0,1,1), new Vector3Int(0,-1,1)];

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
        return JSON.stringify([node.position.x, node.position.y, node.position.z, node.direction.x, node.direction.y]);
    }

	override *getNeighbors(node: GridAStarNode): IterableIterator<GridAStarNode> {
		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);
            yield new GridAStarNode(cell, directionVector, node);
		}
	}
	override inMapStart(start: Vector2Int, goal: Vector2Int): GridAStarNode {
        let startPos3d = new Vector3Int(start.x,start.y,0);
		return new GridAStarNode(startPos3d, Vector3Int.zero(), undefined);
	}
    override inMapGoal(start: Vector2Int, goal: Vector2Int): GridAStarNode {
        let goalPos3d = new Vector3Int(goal.x,goal.y,0);
        return new GridAStarNode(goalPos3d, Vector3Int.zero(), undefined);
    }
	override outMap(data: GridAStarNode): Vector2Int {
		return new Vector2Int(data.position.x, data.position.y);
	}
}
