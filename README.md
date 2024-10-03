# Streaming Messages

This project contains a Next.js app, with API routes to hit a LangGraph Cloud deployment and demonstrate exactly how the different streaming types work.
To change the streaming type, click on the settings (⚙️) icon in the top right corner of the app and select the desired streaming type.

## [YouTube Video](https://youtu.be/wjn5tFbLgwA)

## Setup

To setup the project, install the dependencies:

```bash
yarn install
```

## Environment variables

The streaming messages project only requires your LangChain API key, the LangGraph Cloud deployment URL, and the name of your graph.

Once you have these, create a `.env` file in this directory and add the following:

```bash
LANGGRAPH_API_URL=http://localhost:8123 # Or your production URL
LANGCHAIN_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_LANGGRAPH_GRAPH_ID=YOUR_GRAPH_ID
```
