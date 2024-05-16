import { GameState } from "../../types";
import { Behavior } from "../behavior-tree";
import { AgentAction, AgentConfig, AgentState, defineAgent } from "./agent";
import { GameAgentState, GameAgentStateConfig } from "./state";
import { TeamCommunicator } from "./team-communicator";

interface AgentData {
    state: GameAgentState;
    agent: Behavior<AgentState, AgentAction>;
}

export interface AgentManagerConfig extends AgentConfig, GameAgentStateConfig {
}

export class AgentManager {
    private readonly teamCommunicator: TeamCommunicator;
    private readonly agents = new Map<string, AgentData>();
    private registeredTurnId: number | undefined;

    constructor(private readonly config: AgentManagerConfig) {
        this.teamCommunicator = new TeamCommunicator(config.maxAgentsPerformingCutoff);
    }

    tick(gameState: GameState): void {
        const turnId = gameState.turn;

        if (turnId === this.registeredTurnId) {
            return;
        }

        this.registeredTurnId = turnId;
        this.teamCommunicator.tick(gameState);
    }

    performAction(gameState: GameState): AgentAction {
        const agentId = gameState.you.id;
        let agentData = this.agents.get(agentId);

        if (agentData === undefined) {
            agentData = {
                state: new GameAgentState(this.config, gameState, this.teamCommunicator),
                agent: defineAgent(this.config),
            }
            this.agents.set(agentId, agentData);
        }

        agentData.state.updateState(gameState);
        return agentData.agent(agentData.state);
    }
}
