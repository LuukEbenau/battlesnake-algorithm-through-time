import { GameState } from "../../types";
import { Vector2Int } from "../util/vectors";

export class TeamCommunicator {
    private foods: Vector2Int[] = [];

    private foodToOwner = new Map<string, string>();
    private nextFoodToOwner = new Map<string, string>();

    private agentPaths = new Map<string, Vector2Int[]>();

    tick(gameState: GameState): void {
        this.foods = gameState.board.food.map(f => Vector2Int.fromCoord(f));

        this.foodToOwner = this.nextFoodToOwner;
        this.nextFoodToOwner = new Map();

        this.agentPaths.clear();
    }
    *iterateAvailableFoods(agentId: string): IterableIterator<Vector2Int> {
        for (const food of this.foods) {
            const foodStr = food.toJSONString();
            const foodOwnerId = this.foodToOwner.get(foodStr);
            const nextFoodOwnerId = this.nextFoodToOwner.get(foodStr);

            if ((foodOwnerId === undefined || foodOwnerId === agentId) && (nextFoodOwnerId === undefined || nextFoodOwnerId === agentId)) {
                yield food;
            }
        }
    }
    getAvailableFoods(agentId: string): Vector2Int[] {
        return [...this.iterateAvailableFoods(agentId)];
    }
    claimFood(agentId: string, food: Vector2Int) {
        this.nextFoodToOwner.set(food.toJSONString(), agentId);
    }
    *iterateOtherAgentPaths(agentId: string): IterableIterator<Vector2Int[]> {
        for (const [otherAgentId, path] of this.agentPaths) {
            if (agentId !== otherAgentId) {
                yield path;
            }
        }
    }
    getOtherAgentPaths(agentId: string): Vector2Int[][] {
        return [...this.iterateOtherAgentPaths(agentId)];
    }
    setAgentPath(agentId: string, path: Vector2Int[]): void {
        this.agentPaths.set(agentId, path);
    }
}
