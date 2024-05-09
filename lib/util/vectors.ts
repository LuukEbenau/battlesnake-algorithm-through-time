export class Vector2Int {
	public constructor(public readonly x:number,public readonly y:number){
		if( x % 1 >0){
			throw new Error(`While initializing Vector2Int, x value of ${x} was not a integer`);
		}
		if(y % 1 >0){
			throw new Error(`While initializing Vector2Int, y value of ${y} was not a integer`);
		}
	}

	public equals(v2: Vector2Int): boolean {
		return this.x === v2.x && this.y === v2.y;
	}
	public distance(v2:Vector2Int){
		return Math.sqrt((v2.x - this.x) ** 2 + (v2.y - this.y) ** 2);
	}
	public static DEFAULT(): Vector2Int{
		return new Vector2Int(0,0);
	}

	public add(v2:Vector2Int){
		return new Vector2Int(this.x + v2.x, this.y + v2.y); // dont change the instance, since this will give sideeffects
	}
}

export class Vector3Int extends Vector2Int{
	public constructor(x:number, y:number,public readonly z:number){
		super(x,y)
	}

	public equals(v2: Vector3Int): boolean {
		return this.x === v2.x && this.y === v2.y;
	}
	public distance(v2:Vector3Int){
		return Math.sqrt((v2.x - this.x) ** 2 + (v2.y - this.y) ** 2);
	}
	public static DEFAULT(): Vector3Int{
		return new Vector3Int(0,0,0);
	}

	public add(v2:Vector3Int){
		return new Vector3Int(this.x + v2.x, this.y + v2.y, this.z + v2.z); // dont change the instance, since this will give sideeffects
	}
}