import { GameState } from "../../types";
import { Vector2Int } from "../util/vectors";

export class TeamCommunicator {
    tick(gameState: GameState): void {
    }
    getAvailableFoods(agentId: number): Vector2Int[] {
        return [];
    }
    claimFood(agentId: number, food: Vector2Int) {
        return [];
    }
    getOtherAgentPaths(agentId: number): Vector2Int[][] {
        return [];
    }
    setAgentPath(agentId: number, path: Vector2Int[]): void {
    }
}
