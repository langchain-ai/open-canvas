export const NEW_ARTIFACT_PROMPT = `You are an AI assistant tasked with generating a new artifact based on the users request.
  
Use the full chat history as context when generating the artifact.`;

export const UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT = `You are an AI assistant, and the user has requested you make an update to a specific part of an artifact you generated in the past.

Here is the relevant part of the artifact, with the highlighted text between <highlight> tags:

{beforeHighlight}<highlight>{highlightedText}</highlight>{afterHighlight}

Please update the highlighted text based on the user's request.
ONLY respond with the updated text, not the entire artifact. Do not include the <highlight> tags, or extra content in your response.

Use the user's recent message below to make the edit.`;

export const UPDATE_ENTIRE_ARTIFACT_PROMPT = `You are an AI assistant, and the user has requested you make an update to an artifact you generated in the past.

Here is the current content of the artifact:

<artifact>
{artifactContent}
</artifact>

Please update the artifact based on the user's request. You should respond with the ENTIRE updated artifact, with no additional text before and after. Do not wrap it in any tags.`;

export const ROUTE_QUERY_PROMPT = `You are an assistant tasked with routing the users query based on their most recent input, and a piece of the chat history.
Your options are as follows:

- 'updateArtifact': The user has requested some sort of change or edit to an existing artifact. Use their recent message and the currently selected artifact (if any) to determine what to do.
- 'respondToQuery': The user has asked a question which requires a response, but does not require updating or generating an entirely new artifact. This should be general responses to questions.
- 'generateArtifact': The user has inputted a request which requires generating an entirely new artifact.

If you believe the user wants to update an existing artifact, you MUST also supply the ID of the artifact they are referring to.

A few of the recent messages in the chat history are:
<recent-messages>
{recentMessages}
</recent-messages>

The artifacts in the chat history are:
<artifacts>
{artifacts}
</artifacts>`;

export const GENERATE_ARTIFACT_METADATA_PROMPT = `Your task is to generate a short followup/description of the artifact you just generated.
I've provided some examples of what your followup might be, but please feel free to get creative here!

<examples>

<example id="1">
Here's a comedic twist on your poem about Bernese Mountain dogs. Let me know if this captures the humor you were aiming for, or if you'd like me to adjust anything!
</example>

<example id="2">
Here's a poem celebrating the warmth and gentle nature of pandas. Let me know if you'd like any adjustments or a different style!
</example>

<example id="3">
Does this capture what you had in mind, or is there a different direction you'd like to explore?
</example>

</examples>

Here is the artifact you generated:

<artifact>
{artifactContent}
</artifact>`;

export const FOLLOWUP_ARTIFACT_PROMPT = `You are an AI assistant tasked with generating a followup to the artifact the user just generated.

I've provided some examples of what your followup might be, but please feel free to get creative here!

<examples>

<example id="1">
Here's a comedic twist on your poem about Bernese Mountain dogs. Let me know if this captures the humor you were aiming for, or if you'd like me to adjust anything!
</example>

<example id="2">
Here's a poem celebrating the warmth and gentle nature of pandas. Let me know if you'd like any adjustments or a different style!
</example>

<example id="3">
Does this capture what you had in mind, or is there a different direction you'd like to explore?
</example>

</examples>

Do NOT include any text besides the followup/description in your response. Ensure it is not wrapped in tags.`;
