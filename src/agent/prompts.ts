export const NEW_ARTIFACT_PROMPT = `You are an AI assistant tasked with generating a new artifact based on the users request.
Ensure you use markdown syntax when appropriate, as the text you generate will be rendered in markdown.
  
Use the full chat history as context when generating the artifact.`;

export const UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT = `You are an AI assistant, and the user has requested you make an update to a specific part of an artifact you generated in the past.

Here is the relevant part of the artifact, with the highlighted text between <highlight> tags:

{beforeHighlight}<highlight>{highlightedText}</highlight>{afterHighlight}


Please update the highlighted text based on the user's request.

Follow these rules and guidelines:

<rules-guidelines>
- ONLY respond with the updated text, not the entire artifact.
- Do not include the <highlight> tags, or extra content in your response.
- Do not wrap it in any XML tags you see in this prompt.
- Do NOT wrap in markdown blocks (e.g triple backticks) unless the highlighted text ALREADY contains markdown syntax.
  If you insert markdown blocks inside the highlighted text when they are already defined outside the text, you will break the markdown formatting.
- You should use proper markdown syntax when appropriate, as the text you generate will be rendered in markdown.
</rules-guidelines>

Use the user's recent message below to make the edit.`;

export const UPDATE_ENTIRE_ARTIFACT_PROMPT = `You are an AI assistant, and the user has requested you make an update to an artifact you generated in the past.

Here is the current content of the artifact:

<artifact>
{artifactContent}
</artifact>

Please update the artifact based on the user's request.

Follow these rules and guidelines:

<rules-guidelines>
- You should respond with the ENTIRE updated artifact, with no additional text before and after.
- Do not wrap it in any XML tags you see in this prompt.
- You should use proper markdown syntax when appropriate, as the text you generate will be rendered in markdown.
</rules-guidelines>
`;

export const CHANGE_ARTIFACT_LANGUAGE_PROMPT = `You are tasked with changing the language of the following artifact to {newLanguage}.

Here is the current content of the artifact:
<artifact>
{artifactContent}
</artifact>

Rules and guidelines:
- ONLY change the language and nothing else.
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.`;

export const CHANGE_ARTIFACT_READING_LEVEL_PROMPT = `You are tasked with re-writing the following artifact to be at a {newReadingLevel} reading level.
Ensure you do not change the meaning or story behind the artifact, simply update the language to be of the appropriate reading level for a {newReadingLevel} audience.

Here is the current content of the artifact:
<artifact>
{artifactContent}
</artifact>

Rules and guidelines:
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.`;

export const CHANGE_ARTIFACT_TO_PIRATE_PROMPT = `You are tasked with re-writing the following artifact to sound like a pirate.
Ensure you do not change the meaning or story behind the artifact, simply update the language to sound like a pirate.

Here is the current content of the artifact:
<artifact>
{artifactContent}
</artifact>

Rules and guidelines:
- Respond with ONLY the updated artifact, and no additional text before or after.
- Ensure you respond with the entire updated artifact, and not just the new content.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.`;

export const CHANGE_ARTIFACT_LENGTH_PROMPT = `You are tasked with re-writing the following artifact to be {newLength}.
Ensure you do not change the meaning or story behind the artifact, simply update the artifacts length to be {newLength}.

Here is the current content of the artifact:
<artifact>
{artifactContent}
</artifact>

Rules and guidelines:
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.`;

export const ADD_EMOJIS_TO_ARTIFACT_PROMPT = `You are tasked with revising the following artifact by adding emojis to it.
Ensure you do not change the meaning or story behind the artifact, simply include emojis throughout the text where appropriate.

Here is the current content of the artifact:
<artifact>
{artifactContent}
</artifact>

Rules and guidelines:
- Respond with ONLY the updated artifact, and no additional text before or after.
- Ensure you respond with the entire updated artifact, including the emojis.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.`;

export const ROUTE_QUERY_PROMPT = `You are an assistant tasked with routing the users query based on their most recent message.
You should look at this message in isolation and determine where to best route there query.
Your options are as follows:

- 'updateArtifact': The user has requested some sort of change or edit to an existing artifact. Use their recent message and the currently selected artifact (if any) to determine what to do. You should ONLY select this if the user has clearly requested a change to the artifact, otherwise you should lean towards either generating a new artifact or responding to their query.
  It is very important you do not edit the artifact unless clearly requested by the user.
- 'respondToQuery': The user has asked a question, or has submitted a general message which requires a response, but does not require updating or generating an entirely new artifact.
- 'generateArtifact': The user has inputted a request which requires generating a new artifact.

If you believe the user wants to update an existing artifact, you MUST also supply the ID of the artifact they are referring to.

A few of the recent messages in the chat history are:
<recent-messages>
{recentMessages}
</recent-messages>

The following contains every artifact the user has generated in the chat history:
<artifacts>
{artifacts}
</artifacts>

This artifact is the one the user is currently viewing. You should weigh this artifact more heavily compared to the others when determining the route.
<selected-artifact>
{selectedArtifact}
</selected-artifact>`;

export const FOLLOWUP_ARTIFACT_PROMPT = `You are an AI assistant tasked with generating a followup to the artifact the user just generated.
The context is you're having a conversation with the user, and you've just generated an artifact for them. Now you should follow up with a message that notifies them you're done. Make this message creative!

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
</artifact>

This message should be very short. Never generate more than 2-3 short sentences. Your tone should be somewhat formal, but still friendly. Remember, you're an AI assistant.

Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response. Your response to this message should ONLY contain the description/followup message.`;
