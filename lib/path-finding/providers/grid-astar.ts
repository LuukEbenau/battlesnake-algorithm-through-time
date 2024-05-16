import { AbstractAStarProvider } from "..";
import { getDirections } from "../../util/grid";
import { Vector3Int, Vector2Int } from "../../util/vectors";

export class GridAStarNode {
    constructor(public readonly position: Vector3Int, public readonly direction: Vector3Int, public prevNode : GridAStarNode|undefined = undefined) {}
}

export class GridAStarProvider extends AbstractAStarProvider<Vector2Int, GridAStarNode, string> {
	private readonly directionVectors = getDirections().map(v => new Vector3Int(v.x, v.y, 1));

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
            yield new GridAStarNode(cell, directionVector, node); //NOTE: this node is gonna be overridden, so shouldnt even be needed here
		}
	}
	override inMap(data: Vector2Int): GridAStarNode {
        let startPos3d = new Vector3Int(data.x,data.y,0);
		return new GridAStarNode(startPos3d, Vector3Int.zero(), undefined);
	}
	override outMap(data: GridAStarNode): Vector2Int {
		return new Vector2Int(data.position.x, data.position.y);
	}
}
