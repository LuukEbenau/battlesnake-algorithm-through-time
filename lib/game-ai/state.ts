import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { Vector2Int } from "../path-finding/datastructures/vectors";
import { GameProvider } from "../path-finding/providers/astarProvider";
import { StandardAStar } from "../path-finding/standard-astar";
import { AgentState } from "./agent";

export class GameAgentState implements AgentState {
    private provider: GameProvider;
    private state: GameState | undefined;
    readonly aStar: AStar<Vector2Int>;

    constructor() {
        this.provider = new GameProvider();
        this.aStar = new StandardAStar(this.provider);
    }

    updateState(state: GameState): void {
        this.state = state;

        const { head, body } = state.you;
        const neck = body[1];

        const currentDirection = new Vector2Int(head.x - neck.x, head.y - neck.y);

        this.provider.addState(currentDirection,
            GameAgentState.createGrid(state.board.width, state.board.height));
    }

    private static createGrid(width: number, height: number): number[][][] {
      let grid: number[][][] = new Array(width);

      for (let x: number = 0; x < width; x++) {
          grid[x] = new Array(height);

          for (let y: number = 0; y < height; y++) {
              grid[x][y] = [0];
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
