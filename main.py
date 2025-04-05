from pydantic_ai import Agent
import asyncio
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.providers.groq import GroqProvider
import dotenv
import os

dotenv.load_dotenv()

groq_api = os.getenv('GROQ_API_KEY')
model = GroqModel(
    'llama-3.3-70b-versatile',
    provider=GroqProvider(api_key=groq_api),
)

agent = Agent(model)

async def main():
    nodes = []
    # Begin an AgentRun, which is an async-iterable over the nodes of the agent's graph
    async with agent.iter('What is the capital of France?') as agent_run:
        async for node in agent_run:
            # Each node represents a step in the agent's execution
            nodes.append(node)
    print(nodes)
    """
    [
        ModelRequestNode(
            request=ModelRequest(
                parts=[
                    UserPromptPart(
                        content='What is the capital of France?',
                        timestamp=datetime.datetime(...),
                        part_kind='user-prompt',
                    )
                ],
                kind='request',
            )
        ),
        CallToolsNode(
            model_response=ModelResponse(
                parts=[TextPart(content='Paris', part_kind='text')],
                model_name='gpt-4o',
                timestamp=datetime.datetime(...),
                kind='response',
            )
        ),
        End(data=FinalResult(data='Paris', tool_name=None, tool_call_id=None)),
    ]
    """
    print(agent_run.result.data)
    #> Paris

asyncio.run(main())