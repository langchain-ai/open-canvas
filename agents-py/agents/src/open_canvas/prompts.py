DEFAULT_CODE_PROMPT_RULES = """- Do NOT include triple backticks when generating code. The code should be in plain text."""

APP_CONTEXT = """
<app-context>
The name of the application is "Open Canvas". Open Canvas is a web application where users have a chat window and a canvas to display an artifact.
Artifacts can be any sort of writing content, emails, code, or other creative writing work. Think of artifacts as content, or writing you might find on you might find on a blog, Google doc, or other writing platform.
Users only have a single artifact per conversation, however they have the ability to go back and fourth between artifact edits/revisions.
If a user asks you to generate something completely different from the current artifact, you may do this, as the UI displaying the artifacts will be updated to show whatever they've requested.
Even if the user goes from a 'text' artifact to a 'code' artifact.
</app-context>
"""

NEW_ARTIFACT_PROMPT = f"""You are an AI assistant tasked with generating a new artifact based on the users request.
Ensure you use markdown syntax when appropriate, as the text you generate will be rendered in markdown.
  
Use the full chat history as context when generating the artifact.

Follow these rules and guidelines:
<rules-guidelines>
- Do not wrap it in any XML tags you see in this prompt.
- If writing code, do not add inline comments unless the user has specifically requested them. This is very important as we don't want to clutter the code.
{DEFAULT_CODE_PROMPT_RULES}
- Make sure you fulfill ALL aspects of a user's request. For example, if they ask for an output involving an LLM, prefer examples using OpenAI models with LangChain agents.
</rules-guidelines>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>
{{disable_chain_of_thought}}"""

UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT = """You are an AI assistant, and the user has requested you make an update to a specific part of an artifact you generated in the past.

Here is the relevant part of the artifact, with the highlighted text between <highlight> tags:

{{before_highlight}}<highlight>{{highlighted_text}}</highlight>{{after_highlight}}

Please update the highlighted text based on the user's request.

Follow these rules and guidelines:
<rules-guidelines>
- ONLY respond with the updated text, not the entire artifact.
- Do not include the <highlight> tags, or extra content in your response.
- Do not wrap it in any XML tags you see in this prompt.
- Do NOT wrap in markdown blocks (e.g triple backticks) unless the highlighted text ALREADY contains markdown syntax.
  If you insert markdown blocks inside the highlighted text when they are already defined outside the text, you will break the markdown formatting.
- You should use proper markdown syntax when appropriate, as the text you generate will be rendered in markdown.
- NEVER generate content that is not included in the highlighted text. Whether the highlighted text be a single character, split a single word,
  an incomplete sentence, or an entire paragraph, you should ONLY generate content that is within the highlighted text.
{0}
</rules-guidelines>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Use the user's recent message below to make the edit.""".format(DEFAULT_CODE_PROMPT_RULES)

GET_TITLE_TYPE_REWRITE_ARTIFACT = f"""You are an AI assistant who has been tasked with analyzing the users request to rewrite an artifact.

Your task is to determine what the title and type of the artifact should be based on the users request.
You should NOT modify the title unless the users request indicates the artifact subject/topic has changed.
You do NOT need to change the type unless it is clear the user is asking for their artifact to be a different type.
Use this context about the application when making your decision:
{APP_CONTEXT}

The types you can choose from are:
- 'text': This is a general text artifact. This could be a poem, story, email, or any other type of writing.
- 'code': This is a code artifact. This could be a code snippet, a full program, or any other type of code.

Be careful when selecting the type, as this will update how the artifact is displayed in the UI.

Remember, if you change the type from 'text' to 'code' you must also define the programming language the code should be written in.

Here is the current artifact (only the first 500 characters, or less if the artifact is shorter):
<artifact>
{{artifact}}
</artifact>

The users message below is the most recent message they sent. Use this to determine what the title and type of the artifact should be."""

OPTIONALLY_UPDATE_META_PROMPT = """It has been pre-determined based on the users message and other context that the type of the artifact should be:
{{artifact_type}}

{{artifact_title}}

You should use this as context when generating your response."""

UPDATE_ENTIRE_ARTIFACT_PROMPT = """You are an AI assistant, and the user has requested you make an update to an artifact you generated in the past.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Please update the artifact based on the user's request.

Follow these rules and guidelines:
<rules-guidelines>
- You should respond with the ENTIRE updated artifact, with no additional text before and after.
- Do not wrap it in any XML tags you see in this prompt.
- You should use proper markdown syntax when appropriate, as the text you generate will be rendered in markdown. UNLESS YOU ARE WRITING CODE.
- When you generate code, a markdown renderer is NOT used so if you respond with code in markdown syntax, or wrap the code in tipple backticks it will break the UI for the user.
- If generating code, it is imperative you never wrap it in triple backticks, or prefix/suffix it with plain text. Ensure you ONLY respond with the code.
{0}
</rules-guidelines>

{{update_meta_prompt}}

Ensure you ONLY reply with the rewritten artifact and NO other content.""".format(DEFAULT_CODE_PROMPT_RULES)

# ----- Text modification prompts -----
CHANGE_ARTIFACT_LANGUAGE_PROMPT = """You are tasked with changing the language of the following artifact to {{new_language}}.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Rules and guidelines:
<rules-guidelines>
- ONLY change the language and nothing else.
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.
</rules-guidelines>"""

CHANGE_ARTIFACT_READING_LEVEL_PROMPT = """You are tasked with re-writing the following artifact to be at a {{new_reading_level}} reading level.
Ensure you do not change the meaning or story behind the artifact, simply update the language to be of the appropriate reading level for a {{new_reading_level}} audience.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.
</rules-guidelines>"""

CHANGE_ARTIFACT_TO_PIRATE_PROMPT = """You are tasked with re-writing the following artifact to sound like a pirate.
Ensure you do not change the meaning or story behind the artifact, simply update the language to sound like a pirate.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Ensure you respond with the entire updated artifact, and not just the new content.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.
</rules-guidelines>"""

CHANGE_ARTIFACT_LENGTH_PROMPT = """You are tasked with re-writing the following artifact to be {{new_length}}.
Ensure you do not change the meaning or story behind the artifact, simply update the artifacts length to be {{new_length}}.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.
</rules-guidelines>"""

ADD_EMOJIS_TO_ARTIFACT_PROMPT = """You are tasked with revising the following artifact by adding emojis to it.
Ensure you do not change the meaning or story behind the artifact, simply include emojis throughout the text where appropriate.

Here is the current content of the artifact:
<artifact>
{{artifact_content}}
</artifact>

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Ensure you respond with the entire updated artifact, including the emojis.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated artifact.
</rules-guidelines>"""

# ----- End text modification prompts -----

ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS = """
- 'rewrite_artifact': The user has requested some sort of change, or revision to the artifact, or to write a completely new artifact independent of the current artifact. Use their recent message and the currently selected artifact (if any) to determine what to do. You should ONLY select this if the user has clearly requested a change to the artifact, otherwise you should lean towards either generating a new artifact or responding to their query.
  It is very important you do not edit the artifact unless clearly requested by the user.
- 'reply_to_general_input': The user submitted a general input which does not require making an update, edit or generating a new artifact. This should ONLY be used if you are ABSOLUTELY sure the user does NOT want to make an edit, update or generate a new artifact."""

ROUTE_QUERY_OPTIONS_NO_ARTIFACTS = """
- 'generate_artifact': The user has inputted a request which requires generating an artifact.
- 'reply_to_general_input': The user submitted a general input which does not require making an update, edit or generating a new artifact. This should ONLY be used if you are ABSOLUTELY sure the user does NOT want to make an edit, update or generate a new artifact."""

CURRENT_ARTIFACT_PROMPT = """This artifact is the one the user is currently viewing.
<artifact>
{{artifact}}
</artifact>"""

NO_ARTIFACT_PROMPT = """The user has not generated an artifact yet."""

ROUTE_QUERY_PROMPT = f"""You are an assistant tasked with routing the users query based on their most recent message.
You should look at this message in isolation and determine where to best route there query.

Use this context about the application and its features when determining where to route to:
{APP_CONTEXT}

Your options are as follows:
<options>
{{artifact_options}}
</options>

A few of the recent messages in the chat history are:
<recent-messages>
{{recent_messages}}
</recent-messages>

If you have previously generated an artifact and the user asks a question that seems actionable, the likely choice is to take that action and rewrite the artifact.

{{current_artifact_prompt}}"""

FOLLOWUP_ARTIFACT_PROMPT = """You are an AI assistant tasked with generating a followup to the artifact the user just generated.
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
{{artifact_content}}
</artifact>

You also have the following reflections on general memories/facts about the user to use when generating your response.
<reflections>
{{reflections}}
</reflections>

Finally, here is the chat history between you and the user:
<conversation>
{{conversation}}
</conversation>

This message should be very short. Never generate more than 2-3 short sentences. Your tone should be somewhat formal, but still friendly. Remember, you're an AI assistant.

Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response. Your response to this message should ONLY contain the description/followup message."""

ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT = """You are an expert software engineer, tasked with updating the following code by adding comments to it.
Ensure you do NOT modify any logic or functionality of the code, simply add comments to explain the code.

Your comments should be clear and concise. Do not add unnecessary or redundant comments.

Here is the code to add comments to
<code>
{{artifact_content}}
</code>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the updated code, and no additional text before or after.
- Ensure you respond with the entire updated code, including the comments. Do not leave out any code from the original input.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated code.
{0}
</rules-guidelines>""".format(DEFAULT_CODE_PROMPT_RULES)

ADD_LOGS_TO_CODE_ARTIFACT_PROMPT = """You are an expert software engineer, tasked with updating the following code by adding log statements to it.
Ensure you do NOT modify any logic or functionality of the code, simply add logs throughout the code to help with debugging.

Your logs should be clear and concise. Do not add redundant logs.

Here is the code to add logs to
<code>
{{artifact_content}}
</code>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated code, and no additional text before or after.
- Ensure you respond with the entire updated code, including the logs. Do not leave out any code from the original input.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated code.
{0}
</rules-guidelines>""".format(DEFAULT_CODE_PROMPT_RULES)

FIX_BUGS_CODE_ARTIFACT_PROMPT = """You are an expert software engineer, tasked with fixing any bugs in the following code.
Read through all the code carefully before making any changes. Think through the logic, and ensure you do not introduce new bugs.

Before updating the code, ask yourself:
- Does this code contain logic or syntax errors?
- From what you can infer, does it have missing business logic?
- Can you improve the code's performance?
- How can you make the code more clear and concise?

Here is the code to potentially fix bugs in:
<code>
{{artifact_content}}
</code>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated code, and no additional text before or after.
- Ensure you respond with the entire updated code. Do not leave out any code from the original input.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated code
- Ensure you are not making meaningless changes.
{0}
</rules-guidelines>""".format(DEFAULT_CODE_PROMPT_RULES)

PORT_LANGUAGE_CODE_ARTIFACT_PROMPT = """You are an expert software engineer, tasked with re-writing the following code in {{new_language}}.
Read through all the code carefully before making any changes. Think through the logic, and ensure you do not introduce bugs.

Here is the code to port to {{new_language}}:
<code>
{{artifact_content}}
</code>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated code, and no additional text before or after.
- Ensure you respond with the entire updated code. Your user expects a fully translated code snippet.
- Do not wrap it in any XML tags you see in this prompt. Ensure it's just the updated code
- Ensure you do not port over language specific modules. E.g if the code contains imports from Node's fs module, you must use the closest equivalent in {{new_language}}.
{0}
</rules-guidelines>""".format(DEFAULT_CODE_PROMPT_RULES) 