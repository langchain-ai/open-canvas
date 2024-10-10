# Open Canvas

![Diagram of the Open Canvas graph](./public//lg_studio_graph_diagram.png)

Open Canvas is an open source web application with built in memory powered by dual agents. It is inspired by [OpenAI's "Canvas"](https://openai.com/index/introducing-canvas/), but with a few key differences.

1. Open Canvas is open source and free to use. All the code, from the frontend, to the content generation agent, to the reflection agent is open source and MIT licensed.
2. Built in memory. Open Canvas ships out of the box with a [reflection agent](https://langchain-ai.github.io/langgraphjs/tutorials/reflection/reflection/) which stores style rules and user insights in a [shared memory store](https://langchain-ai.github.io/langgraphjs/concepts/memory/). This allows Open Canvas to remember facts about you across sessions.
3. Start from existing documents. Open Canvas allows users to start with a blank text, or code editor in the language of their choice, allowing you to start the session with your existing content, instead of being forced to start with a chat interaction. We believe this is an ideal UX because many times you will already have some content to start with, and want to iterate on-top of it.

## How to use

You can use our deployed version for free by visiting [open-canvas-lc.vercel.app](https://open-canvas-lc.vercel.app/)

or

You can clone this repository and run locally/deploy to your own cloud. See the next section for steps on how to do this.

## Development

Running or developing Open Canvas is easy. Start by cloning this repository and navigating into the directory.

```bash
git clone https://github.com/langchain-ai/open-canvas.git

cd open-canvas
```

Next, install the dependencies via Yarn:

```bash
yarn install
```

Then [install LangGraph Studio](https://studio.langchain.com/) which is required to run the graphs locally, or [create a LangSmith account](https://smith.langchain.com/) to deploy to production on LangGraph Cloud.

After that, copy the `.env.example` file contents into `.env` and set the required values:

```bash
# LangSmith tracing (optional, but recomended.)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=

# LLM API keys
# Anthropic used for reflection
ANTHROPIC_API_KEY=
# OpenAI used for content generation
OPENAI_API_KEY=

# Vercel KV stores. Used for system prompt storage.
KV_REST_API_URL=
KV_REST_API_TOKEN=

# LangGraph Deployment, or local development server via LangGraph Studio.
LANGGRAPH_API_URL=
```

Finally, start the development server:

```bash
yarn dev
```

Then, open [localhost:3000](http://localhost:3000) with your browser and start interacting!