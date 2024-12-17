# Open Canvas

[TRY IT OUT HERE](https://opencanvas.langchain.com/)

![Screenshot of app](./public/screenshot.png)

Open Canvas is an open source web application for collaborating with agents to better write documents. It is inspired by [OpenAI's "Canvas"](https://openai.com/index/introducing-canvas/), but with a few key differences.

1. **Open Source**: All the code, from the frontend, to the content generation agent, to the reflection agent is open source and MIT licensed.
2. **Built in memory**: Open Canvas ships out of the box with a [reflection agent](https://langchain-ai.github.io/langgraphjs/tutorials/reflection/reflection/) which stores style rules and user insights in a [shared memory store](https://langchain-ai.github.io/langgraphjs/concepts/memory/). This allows Open Canvas to remember facts about you across sessions.
3. **Start from existing documents**: Open Canvas allows users to start with a blank text, or code editor in the language of their choice, allowing you to start the session with your existing content, instead of being forced to start with a chat interaction. We believe this is an ideal UX because many times you will already have some content to start with, and want to iterate on-top of it.

## Features

- **Memory**: Open Canvas has a built in memory system which will automatically generate reflections and memories on you, and your chat history. These are then included in subsequent chat interactions to give a more personalized experience.
- **Custom quick actions**: Custom quick actions allow you to define your own prompts which are tied to your user, and persist across sessions. These then can be easily invoked through a single click, and apply to the artifact you're currently viewing.
- **Pre-built quick actions**: There are also a series of pre-built quick actions for common writing and coding tasks that are always available.
- **Artifact versioning**: All artifacts have a "version" tied to them, allowing you to travel back in time and see previous versions of your artifact.
- **Code, Markdown, or both**: The artifact view allows for viewing and editing both code, and markdown. You can even have chats which generate code, and markdown artifacts, and switch between them.
- **Live markdown rendering & editing**: Open Canvas's markdown editor allows you to view the rendered markdown while you're editing, without having to toggle back and fourth.

## Setup locally

This guide will cover how to setup and run Open Canvas locally. If you prefer a YouTube video guide, check out [this video](https://youtu.be/SDnbX7v-i9M).

### Prerequisites

Open Canvas requires the following API keys and external services:

#### Package Manager

- [Yarn](https://yarnpkg.com/)

#### LLM APIs

- [OpenAI API key](https://platform.openai.com/signup/)
- [Anthropic API key](https://console.anthropic.com/)
- (optional) [Google GenAI API key](https://aistudio.google.com/apikey)
- (optional) [Fireworks AI API key](https://fireworks.ai/login)

#### Authentication

- [Supabase](https://supabase.com/) account for authentication

#### LangGraph Cloud

- [LangGraph Studio](https://studio.langchain.com/) (if running on MacOS) OR [LangGraph CLI](https://langchain-ai.github.io/langgraph/cloud/reference/cli/) (for Windows/Linux/etc) for running the graph locally

#### LangSmith

- (optional) [LangSmith](https://smith.langchain.com/) for tracing & observability (required if using LangGraph CLI)


### Installation

First, clone the repository:

```bash
git clone https://github.com/langchain-ai/open-canvas.git
cd open-canvas
```

Next, install the dependencies:

```bash
yarn install
```

After installing dependencies, copy the `.env.example` file contents into `.env` and set the required values:

```bash
cp .env.example .env
```

Then, setup authentication with Supabase.

### Setup Authentication

After creating a Supabase account, visit your [dashboard](https://supabase.com/dashboard/projects) and create a new project.

Next, navigate to the `Project Settings` page inside your project, and then to the `API` tag. Copy the `Project URL`, and `anon public` project API key. Paste them into the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in the `.env` file.

After this, navigate to the `Authentication` page, and the `Providers` tab. Make sure `Email` is enabled (also ensure you've enabled `Confirm Email`). You may also enable `GitHub`, and/or `Google` if you'd like to use those for authentication. (see these pages for documentation on how to setup each provider: [GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google))

#### Test authentication

To verify authentication works, run `yarn dev` and visit [localhost:3000](http://localhost:3000). This should redirect you to the [login page](http://localhost:3000/auth/login). From here, you can either login with Google or GitHub, or if you did not configure these providers, navigate to the [signup page](http://localhost:3000/auth/signup) and create a new account with an email and password. This should then redirect you to a conformation page, and after confirming your email you should be redirected to the [home page](http://localhost:3000).

### Setup LangGraph Server

Now we'll cover how to setup and run the LangGraph server locally. There are two ways to do this, depending on whether or not you're running on MacOS.

<details>
<summary>🍎 MacOS Guide</summary>

First, ensure you have [LangGraph Studio](https://studio.langchain.com/) installed.

After installing, configure the default port for your LangGraph server to be `54367` (can be different, this is what the code defaults to, however it can be edited by setting a different `LANGGRAPH_API_URL` in the `.env`, or updating the fallback value of `LANGGRAPH_API_URL` in `constants.ts`).

Next, open the Open Canvas folder in Studio to start the LangGraph server. Once this finishes pulling the Docker image and installing dependencies, you should see the graph displayed in the UI.

</details>

<details>
<summary>💻 Linux/Windows/etc Guide</summary>

Follow the [`Installation` instructions in the LangGraph docs](https://langchain-ai.github.io/langgraph/cloud/reference/cli/#installation) to install the LangGraph CLI.

Once installed, navigate to the root of the Open Canvas repo and run `LANGSMITH_API_KEY="<YOUR_LANGSMITH_API_KEY>" langgraph up --watch --port 54367` (replacing `<YOUR_LANGSMITH_API_KEY>` with your LangSmith API key).

Once it finishes pulling the docker image and installing dependencies, you should see it log:

```
Ready!       
- API: http://localhost:54367
- Docs: http://localhost:54367/docs
- LangGraph Studio: https://smith.langchain.com/studio/?baseUrl=http://*********:54367
```

</details>

After your LangGraph server is running, execute the following command to start the Open Canvas app:

```bash
yarn dev
```

Then, open [localhost:3000](http://localhost:3000) with your browser and start interacting!


## LLM Models

Open Canvas is designed to be compatible with any LLM model. The current deployment has the following models configured:

- **Anthropic Claude 3 Haiku 👤**: Haiku is Anthropic's fastest model, great for quick tasks like making edits to your document. Sign up for an Anthropic account [here](https://console.anthropic.com/).
- **Fireworks Llama 3 70B 🦙**: Llama 3 is a SOTA open source model from Meta, powered by [Fireworks AI](https://fireworks.ai/). You can sign up for an account [here](https://fireworks.ai/login).
- **OpenAI GPT 4o Mini 💨**: GPT 4o Mini is OpenAI's newest, smallest model. You can sign up for an API key [here](https://platform.openai.com/signup/).

If you'd like to add a new model, follow these simple steps:

1. Add to or update the model provider variables in `constants.ts`.
2. Install the necessary package for the provider (e.g. `@langchain/anthropic`).
3. Update the `getModelNameAndProviderFromConfig` function in `src/agent/utils.ts` to include your new model name and provider.
4. Manually test by checking you can:
  > - 4a. Generate a new artifact
  >
  > - 4b. Generate a followup message (happens automatically after generating an artifact)
  >
  > - 4c. Update an artifact via a message in chat
  >
  > - 4d. Update an artifact via a quick action
  >
  > - 4e. Repeat for text/code (ensure both work)

## Roadmap

### Features

Below is a list of features we'd like to add to Open Canvas in the near future:

- **Render React in the editor**: Ideally, if you have Open Canvas generate React (or HTML) code, we should be able to render it live in the editor. **Edit**: This is in the planning stage now!
- **Multiple assistants**: Users should be able to create multiple assistants, each having their own memory store.
- **Give assistants custom 'tools'**: Once we've implemented `RemoteGraph` in LangGraph.js, users should be able to give assistants access to call their own graphs as tools. This means you could customize your assistant to have access to current events, your own personal knowledge graph, etc.

Do you have a feature request? Please [open an issue](https://github.com/langchain-ai/open-canvas/issues/new)!

### Contributing

We'd like to continue developing and improving Open Canvas, and want your help!

To start, there are a handful of GitHub issues with feature requests outlining improvements and additions to make the app's UX even better.
There are three main labels:

- `frontend`: This label is added to issues which are UI focused, and do not require much if any work on the agent(s).
- `ai`: This label is added to issues which are focused on improving the LLM agent(s).
- `fullstack`: This label is added to issues which require touching both the frontend and agent code.

If you have questions about contributing, please reach out to me via email: `brace(at)langchain(dot)dev`. For general bugs/issues with the code, please [open an issue on GitHub](https://github.com/langchain-ai/open-canvas/issues/new).
