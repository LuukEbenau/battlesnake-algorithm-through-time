import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { GameAStarProvider } from "../path-finding/providers/game-astar";
import { StandardAStar } from "../path-finding/standard-astar";
import { Vector2Int } from "../util/vectors";
import { AgentState } from "./agent";

export class GameAgentState implements AgentState {
    private provider: GameAStarProvider;
    private state: GameState | undefined;
    readonly aStar: AStar<Vector2Int>;

    constructor() {
        this.provider = new GameAStarProvider();
        this.aStar = new StandardAStar(this.provider);
    }

    updateState(state: GameState): void {
        this.state = state;

        const { head, body } = state.you;
        const neck = body[1];

        const currentDirection = new Vector2Int(head.x - neck.x, head.y - neck.y);

        this.provider.addState(currentDirection,
            GameAgentState.createGrid(state.board.width, state.board.height,state));
    }

    private static createGrid(width: number, height: number, state: GameState): number[][][] {
      let grid: number[][][] = new Array(width);


      for (let x: number = 0; x < width; x++) {
          grid[x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
              grid[x][y] = [0];
          }
      }

      for (const snake of state.board.snakes) {
        for (const coord of snake.body) {
            grid[coord.x][coord.y][0] = 1; //TODO: instead of putting it to 0, we can put it basically on the snake.body.length - (current index in body), and then at each time step just do -1 for all indexes this might be a more scalable method? however, might also bring some drawbacks, since its not 3d astar anymore
            
        }
      }

      return grid;
    }

    get currentPosition(): Vector2Int {
        const head = this.state?.you.head;

        if (head === undefined) {
            throw new Error("brain not braining");
        }

        return new Vector2Int(head.x, head.y);
    }

    getClosestFood(): Vector2Int | undefined {
        const position = this.currentPosition;

        return this.state?.board
            .food
            .map(f => new Vector2Int(f.x, f.y))
            .map(f => ({ position: f, distance: position.distance(f) }))
            .sort((a, b) => a.distance - b.distance)[0]
            ?.position;
    }
}
