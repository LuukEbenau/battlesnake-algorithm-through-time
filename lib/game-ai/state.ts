import { GameState } from "../../types";
import { AStar } from "../path-finding";
import { Vector2Int } from "../path-finding/datastructures/vectors";
import { GameProvider } from "../path-finding/providers/astarProvider";
import { StandardAStar } from "../path-finding/standard";
import { AgentState } from "./agent";

export class GameAgentState implements AgentState {
    private state: GameState | undefined;
    readonly aStar: AStar<Vector2Int>;

    constructor() {
        this.aStar = new StandardAStar(new GameProvider());
    }

    updateState(state: GameState): void {
        this.state = state;
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
