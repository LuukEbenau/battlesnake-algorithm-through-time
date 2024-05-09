import { stat } from "fs";
import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";

export class GameAgentState implements AgentState {
    private readonly provider: GameAStarProvider;
    readonly aStar: AStar<Vector2Int>;

    private grid: number[][][] = [];
    state: GameState | undefined;

    private readonly snakeBodyPenalty = 20000 // some high number, as long as its >10000 it should be fine

    constructor() {
        this.provider = new GameAStarProvider();
        this.aStar = new StandardAStar(this.provider);
    }

    get gameState() {
        if (this.state === undefined) {
            throw new Error("GameState not defined");
        }

        return this.state;
    }

    updateState(state: GameState): void {
        this.state = state;

        this.provider.updateState(this.grid);
    }

    /**
     *
     * @param width Width of the grid
     * @param height height of the grid
     * @param state current gamestate
     * @returns a grid, containing a obstacle map with heuristic coefficients for each grid cell at a given time. output format is T*X*Y
     */
    private createGrid(width: number, height: number, state: GameState): number[][][] {
			//head: body[0], neck[1], etc

      let maxTimesteps: number = 100;// state.you.body.length;
      let grid: number[][][] = new Array(maxTimesteps);


      //TODO: after the own snakes body, also take into account enemy snakes
      //TODO: in the astar algorithm, also view the snakes own previous path steps as dynamic obstacles of length <snake length>

      for (let t:number = 0; t< maxTimesteps; t++){
        grid[t] = new Array(width);

        for (let x: number = 0; x < width; x++) {
          grid[t][x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
            grid[t][x][y] = 1;
          }
        }
        // Own positions of snakes
        for (const snake of state.board.snakes) {
          let snakeLengthToConsider = snake.body.length - t;

          // if higher than this, it means that the snake can be everywhere at this point.
          //TODO: have some gradient penalty around it's head position?
          if(snakeLengthToConsider > 0){

            for(let bodyPartI:number = 0; bodyPartI < snakeLengthToConsider; bodyPartI++){
              let bodyPart = snake.body[bodyPartI];
              grid[t][bodyPart.x][bodyPart.y] = this.snakeBodyPenalty;

            }
          }
        }
      }

      return grid;
    }

    get currentPosition(): Vector2Int {
        return Vector2Int.fromCoord(this.gameState.you.head);
    }

    isCellOccupied(cell: Vector2Int): boolean {
        return false;
    }
}
