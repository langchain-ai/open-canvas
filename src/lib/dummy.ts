import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";

const defaultContent = `Here is a short story for you:

The Unexpected Journey

It was a crisp autumn morning when Emily set out on her daily walk through the park. The leaves crunched beneath her feet as she meandered along the familiar path, lost in her own thoughts. Suddenly, a flash of movement in the corner of her eye caught her attention.

There, in the distance, was a small puppy cowering behind a bush. Emily's heart immediately went out to the frightened creature. She approached slowly, not wanting to star she could see the puppy was shivering, its fur matted and dirty.

"Hey there, little one," Emily said softly, kneeling down. The puppy e but didn't run away. Gently, Emily reached out and stroked its trembling body. "Where did you come from?"

The puppy seemed to sense Emily's kindness. It inched closer, letting out a small whimper. That's when Emily noticed the collar around its neck - it had a tag, but the information was too worn to read.

Without hesitation, Emily scooped up the puppy and continued on her walk, cradling the small bundle in her arms. She knew she couldn't just leave the helpless animal behind. As she walked, she tried to figure out what to do. She couldn't keep the puppy, but she also couldn't bear the thought of it being alone and afraid.

By the time Emily reached her apartment, she had made up her mind. She would take the puppy to the local animal shelter, where it could be cared for and hopefully reunited with its owner. As she carried the puppy inside, she couldn't help but feel a twinge of sadness. This unexpected encounter had touched her in a way she didn't expect.

Little did Emily know, this chance meeting was the start of an adventure that would change both of their lives forever.`;

export const DEFAULT_MESSAGES = [
  new HumanMessage({ content: "Hello", id: uuidv4() }),
  new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "artifact_ui",
        args: {
          title: "The Unexpected Journey",
        },
        id: "Dummy_id_123",
      },
    ],
  }),
  new AIMessage({
    content: "I hope this suspenseful story is to your liking.",
    id: uuidv4(),
  }),
];

export const DEFAULT_ARTIFACTS = [
  {
    id: "Dummy_id_123",
    content: defaultContent,
    title: "The Unexpected Journey",
  },
];
