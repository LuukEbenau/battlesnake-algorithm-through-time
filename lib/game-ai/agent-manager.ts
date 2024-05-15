import { GameState } from "../../types";
import { Behavior } from "../behavior-tree";
import { AgentAction, AgentConfig, AgentState, defineAgent } from "./agent";
import { GameAgentState, GameAgentStateConfig } from "./state";

interface AgentData {
    state: GameAgentState;
    agent: Behavior<AgentState, AgentAction>;
}

export interface AgentManagerConfig extends AgentConfig, GameAgentStateConfig {
}

export class AgentManager {
    private readonly agents = new Map<string, AgentData>();

    constructor(private readonly config: AgentManagerConfig) {}

    performAction(gameState: GameState): AgentAction {
        const agentId = gameState.you.id;
        let agentData = this.agents.get(agentId);

        if (agentData === undefined) {
            agentData = {
                state: new GameAgentState(this.config, gameState),
                agent: defineAgent(this.config),
            }
            this.agents.set(agentId, agentData);
        }

        agentData.state.updateState(gameState);
        return agentData.agent(agentData.state);
    }
}
