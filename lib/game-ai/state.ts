import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";

export class GameAgentState implements AgentState {
    private readonly provider: GameAStarProvider;

    readonly aStar: AStar<Vector2Int>;
    state: GameState | undefined;

    private readonly snakeBodyPenalty = 40;

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

        this.provider.updateState(this.createGrid(state.board.width, state.board.height,state));
    }

    private createGrid(width: number, height: number, state: GameState): number[][][] {
      let grid: number[][][] = new Array(width);

      for (let x: number = 0; x < width; x++) {
          grid[x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
              grid[x][y] = [1];
          }
      }

      for (const snake of state.board.snakes) {
        for (const coord of snake.body) {
            grid[coord.x][coord.y][0] = this.snakeBodyPenalty; //TODO: instead of putting it to 0, we can put it basically on the snake.body.length - (current index in body), and then at each time step just do -1 for all indexes this might be a more scalable method? however, might also bring some drawbacks, since its not 3d astar anymore

        }
      }

      return grid;
    }

    get currentPosition(): Vector2Int {
        return Vector2Int.fromCoord(this.gameState.you.head);
    }
}
