import { Coord } from "../../types";

export class Vector2Int {
    public static fromCoord(coord: Coord): Vector2Int {
        return new Vector2Int(coord.x, coord.y);
    }

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
	public static zero(): Vector2Int {
		return new Vector2Int(0,0);
	}

	public add(v2:Vector2Int){
		return new Vector2Int(this.x + v2.x, this.y + v2.y); // dont change the instance, since this will give sideeffects
	}

    public sub(v2: Vector2Int): Vector2Int {
        return new Vector2Int(this.x - v2.x, this.y - v2.y);
    }

    public toJSONString() {
        return JSON.stringify({ x: this.x, y: this.y })
    }

    public static fromJSONString(jsonString: string): Vector2Int {
        const vector = JSON.parse(jsonString);

        if (typeof vector.x !== 'number' || typeof vector.y !== 'number') {
            throw new Error('parsing error');
        }

        return new Vector2Int(vector.x, vector.y);
    }
}

/**
 * The x and y represent the grid, the z axis represents the time dimension
 */
export class Vector3Int extends Vector2Int{
	public constructor(x:number, y:number,public readonly z:number){
		super(x,y)
	}

	public equals(v3: Vector3Int): boolean {
        //TODO: whould we also do equality check the z axis? this might give side effects so be careful
		return this.x === v3.x && this.y === v3.y &&
            (v3.z == 0 || this.z == 0 || this.z == v3.z);
            //NOTE: z is the timestep, so basically we will evaluate a cell again for each timestep, except if the z is 0, in which case we dont consider time. This is handy for the equality check for for example the goalPos

	}
	public distance(v2:Vector3Int){
		return Math.sqrt((v2.x - this.x) ** 2 + (v2.y - this.y) ** 2);
	}
	public static zero(): Vector3Int{
		return new Vector3Int(0,0,0);
	}

	public add(v2:Vector3Int){
		return new Vector3Int(this.x + v2.x, this.y + v2.y, this.z + v2.z); // dont change the instance, since this will give sideeffects
	}


    public toJSONString() {
        return JSON.stringify({ x: this.x, y: this.y })
    }

    public static fromJSONString(jsonString: string): Vector3Int {
        const vector = JSON.parse(jsonString);

        if (typeof vector.x !== 'number' || typeof vector.y !== 'number' || typeof vector.z !== 'number') {
            throw new Error('parsing error');
        }

        return new Vector3Int(vector.x, vector.y, vector.z);
    }
}
