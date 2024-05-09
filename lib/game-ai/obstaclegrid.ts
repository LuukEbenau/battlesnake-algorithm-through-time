import { Battlesnake, GameState } from "../../types";

export class ObstacleGrid{
    private readonly snakeBodyPenalty = 20000 // some high number, as long as its >10000 it should be fine
    public width:number;
    public height:number;
    public state:GameState | undefined;

    private grid: number[][][];
    public getGridAtTime(t:number):number[][]{
        let currentGridSize = this.grid.length;
        if(t>=currentGridSize){
            // add extra layers, in case it doesnt exist yet
            for(let i = currentGridSize; i <= t; i++){
                this.grid[i] = this.createGridLayer(i,this.width, this.height, this.state?.board.snakes as Battlesnake[])
            }
        }

        return this.grid[t];
    }

    public constructor(){
        this.width = 0
        this.height = 0
        this.state = undefined;
        this.grid = [];
    }

    public createInitialGrid(width:number, height:number, state:GameState){
        this.width = width;
        this.height = height;
        this.state = state;
        this.grid = [];
    }

    private createGridLayer(t:number, width:number, height: number, snakes:Battlesnake[] ){
        let gridLayer = new Array(width);
        let currentTime : number = 0; // might implement this later if we need it. its basically at which time step we observed the snakes.
        for (let x: number = 0; x < width; x++) {
          gridLayer[x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
            gridLayer[x][y] = 1;
          }
        }
        // Own positions of snakes
        for (const snake of snakes) {
          this.addSnakeToGrid(currentTime, t, snake, gridLayer);
        }

        return gridLayer;
    }

    /**
     *
     * @param currentTime This is the current time step that we are right now
     * @param t this is the time step which we are trying to predict
     * @param snake
     * @param grid
     */
    private addSnakeToGrid(currentTime:number, t:number, snake:Battlesnake, grid: number[][]){
        let timeDiff : number = t - currentTime;
        let snakeLengthToConsider = snake.body.length - timeDiff;

        if(snakeLengthToConsider > 0){
            for(let bodyPartI: number = 0; bodyPartI < snakeLengthToConsider; bodyPartI++){
                let bodyPart = snake.body[bodyPartI];
                grid[bodyPart.x][bodyPart.y] = this.snakeBodyPenalty;
            }
        }
    }
}
