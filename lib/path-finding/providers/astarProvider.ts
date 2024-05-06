import { AStarProvider } from "..";
import { Vector2Int } from "../datastructures/vectors";

export class Node {
    constructor(public readonly position: Vector2Int, public readonly direction: Vector2Int) {}
}

export class GameProvider implements AStarProvider<Vector2Int, Node> {
	private start:Vector2Int;
	private goal:Vector2Int;
    private currentDirection;
	public _isInitialized: boolean;

	private directionVectors : Vector2Int[];

	get isInitialized(): boolean {
		return this._isInitialized;
	}

	// format is [x][y][t] => t is currently always 0, until implemented
	private grid:number[][][];
	public constructor(){
		this.start = Vector2Int.DEFAULT();//Vector2.DEFAULT();
		this.goal = Vector2Int.DEFAULT();//Vector2.DEFAULT();
        this.currentDirection = Vector2Int.DEFAULT();
		this.grid = [];
		this._isInitialized = false;

		this.directionVectors = [new Vector2Int(-1,0), new Vector2Int(1,0), new Vector2Int(0,1), new Vector2Int(0,-1)];
	}
    isGoalReached(a: Node, b: Node): boolean {
        return a.position.equals(b.position);
    }
	prepare(start: Vector2Int, goal: Vector2Int): void {
		this.start = start;
		this.goal = goal;

		this._isInitialized = true;
	}

	addState(currentDirection: Vector2Int, grid: number[][][]){
        this.currentDirection = currentDirection;
		this.grid = grid;
	}

	clear(): void {
		this.start = Vector2Int.DEFAULT();
		this.goal = Vector2Int.DEFAULT();
		this.grid = [];
		this._isInitialized = false;
	}
	distance(a: Node, b: Node): number {
		return a.position.distance(b.position);
	}
	heuristic(a: Node, b: Node): number {
		return this.distance(a,b);
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

	*getNeighbors(node: Node): IterableIterator<Node> {
        const oppositeDirection = new Vector2Int(-node.direction.x, -node.direction.y);

		for (const directionVector of this.directionVectors) {
			const cell = node.position.add(directionVector);

			if (this.cellInsideBoundaries(cell) && !oppositeDirection.equals(directionVector)) {
				yield new Node(cell, directionVector);
			}
		}
	}
	inMapStart(start: Vector2Int, goal: Vector2Int): Node {
		return new Node(start, this.currentDirection);
	}
    inMapGoal(start: Vector2Int, goal: Vector2Int): Node {
        return new Node(goal, Vector2Int.DEFAULT());
    }
	outMap(data: Node): Vector2Int {
		return data.position;
	}
	outMapStart(node: Node, start: Vector2Int, goal: Vector2Int): Vector2Int {
		return start;
	}
	outMapGoal(node: Node, start: Vector2Int, goal: Vector2Int): Vector2Int {
		return goal;
	}
}
