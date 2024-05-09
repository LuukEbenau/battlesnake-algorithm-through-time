import { AbstractAStarProvider } from "..";
import { Vector2Int } from "../../util/vectors";

export class GameAStarNode {
    constructor(public readonly position: Vector2Int, public readonly direction: Vector2Int) {}
}

export class GameAStarProvider extends AbstractAStarProvider<Vector2Int, GameAStarNode, string> {
	protected readonly directionVectors = [new Vector2Int(-1,0), new Vector2Int(1,0), new Vector2Int(0,1), new Vector2Int(0,-1)];

    override isGoal(goalNode: GameAStarNode, node: GameAStarNode): boolean {
        return goalNode.position.equals(node.position);
    }

	override distance(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}
	override heuristic(a: GameAStarNode, b: GameAStarNode): number {
		return a.position.distance(b.position);
	}
    override getId(node: GameAStarNode): string {
        return JSON.stringify([node.position.x, node.position.y, node.direction.x, node.direction.y]);
    }

	override *getNeighbors(node: GameAStarNode): IterableIterator<GameAStarNode> {
		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);
            yield new GameAStarNode(cell, directionVector);
		}
	}
	override inMapStart(start: Vector2Int, goal: Vector2Int): GameAStarNode {
		return new GameAStarNode(start, new Vector2Int(0, 0));
	}
    override inMapGoal(start: Vector2Int, goal: Vector2Int): GameAStarNode {
        return new GameAStarNode(goal, Vector2Int.zero());
    }
	override outMap(data: GameAStarNode): Vector2Int {
		return data.position;
	}
}
