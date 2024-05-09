import { Battlesnake, GameState } from "../../types";

export class ObstacleGrid{
    private readonly snakeBodyPenalty = 20000 // some high number, as long as its >10000 it should be fine
    public width:number;
    public height:number;
    public state:GameState | undefined;

    public grid: number[][][];
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
        this.grid = this.createGrid(width,height, state.board.snakes);
    }

    /**
     *
     * @param width Width of the grid
     * @param height height of the grid
     * @param state current gamestate
     * @returns a grid, containing a obstacle map with heuristic coefficients for each grid cell at a given time. output format is T*X*Y
     */
    private createGrid(width: number, height: number, snakes: Battlesnake[]): number[][][] {
        let maxTimesteps: number = 100;// state.you.body.length;
        let grid: number[][][] = new Array(maxTimesteps);

        for (let t:number = 0; t< maxTimesteps; t++){
            grid[t] = this.createGridLayer(0, t,width,height, snakes);
        }

        return grid;
    }

    private createGridLayer(currentTime: number, t:number, width:number, height: number, snakes:Battlesnake[] ){
        let gridLayer = new Array(width);

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
          for(let bodyPartI:number = 0; bodyPartI < snakeLengthToConsider; bodyPartI++){
            let bodyPart = snake.body[bodyPartI];
            grid[bodyPart.x][bodyPart.y] = this.snakeBodyPenalty;
          }
        }
      }
}
