import { AStarProvider } from "..";
import { Vector2Int } from "../datastructures/vectors";

export class GameProvider implements AStarProvider<Vector2Int,Vector2Int>{
	private start:Vector2Int;
	private goal:Vector2Int;
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
		this.grid = [];
		this._isInitialized = false;

		this.directionVectors = [new Vector2Int(-1,0), new Vector2Int(1,0), new Vector2Int(0,1), new Vector2Int(0,-1)];
	}

	equals(a: Vector2Int, b: Vector2Int): boolean {
		return a.equals(b);
	}
	prepare(start: Vector2Int, goal: Vector2Int, grid: number[][][]): void {
		this.start = start;
		this.goal = goal;
		this.grid = grid;
		this._isInitialized = true;
	}
	clear(): void {
		this.start = Vector2Int.DEFAULT();
		this.goal = Vector2Int.DEFAULT();
		this.grid = [];
		this._isInitialized = false;
	}
	distance(a: Vector2Int, b: Vector2Int): number {
		return a.distance(b);
	}
	heuristic(a: Vector2Int, b: Vector2Int): number {
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

	*getNeighbors(node: Vector2Int): IterableIterator<Vector2Int> {
		for(const directionVector of this.directionVectors){
			const cell = node.add(directionVector);
			if(this.cellInsideBoundaries(cell)){
				yield cell;
			}
		}
	}
	inMap(data: Vector2Int): Vector2Int {
		return data;
	}
	outMap(data: Vector2Int): Vector2Int {
		return data;
	}
	outMapStart(node: Vector2Int, start: Vector2Int, goal: Vector2Int): Vector2Int {
		return start;
	}
	outMapGoal(node: Vector2Int, start: Vector2Int, goal: Vector2Int): Vector2Int {
		return goal;
	}
}