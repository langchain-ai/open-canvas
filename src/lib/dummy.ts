// import { Artifact } from "@/types";
// import { HumanMessage, AIMessage } from "@langchain/core/messages";
// import { v4 as uuidv4 } from "uuid";

import { CustomQuickAction } from "@/types";

// const defaultContent = `Here is a short story for you:

// The Unexpected Journey

// It was a crisp autumn morning when Emily set out on her daily walk through the park. The leaves crunched beneath her feet as she meandered along the familiar path, lost in her own thoughts. Suddenly, a flash of movement in the corner of her eye caught her attention.

// There, in the distance, was a small puppy cowering behind a bush. Emily's heart immediately went out to the frightened creature. She approached slowly, not wanting to star she could see the puppy was shivering, its fur matted and dirty.

// "Hey there, little one," Emily said softly, kneeling down. The puppy e but didn't run away. Gently, Emily reached out and stroked its trembling body. "Where did you come from?"

// The puppy seemed to sense Emily's kindness. It inched closer, letting out a small whimper. That's when Emily noticed the collar around its neck - it had a tag, but the information was too worn to read.

// Without hesitation, Emily scooped up the puppy and continued on her walk, cradling the small bundle in her arms. She knew she couldn't just leave the helpless animal behind. As she walked, she tried to figure out what to do. She couldn't keep the puppy, but she also couldn't bear the thought of it being alone and afraid.

// By the time Emily reached her apartment, she had made up her mind. She would take the puppy to the local animal shelter, where it could be cared for and hopefully reunited with its owner. As she carried the puppy inside, she couldn't help but feel a twinge of sadness. This unexpected encounter had touched her in a way she didn't expect.

// Little did Emily know, this chance meeting was the start of an adventure that would change both of their lives forever.`;

// const dummyCodeContent = `import React, { useState } from 'react';

// function TodoApp() {
//   const [todos, setTodos] = useState([]);
//   const [inputValue, setInputValue] = useState('');

//   const addTodo = () => {
//     if (inputValue.trim()) {
//       setTodos([...todos, inputValue.trim()]);
//       setInputValue('');
//     }
//   };

//   const removeTodo = (index) => {
//     const newTodos = todos.filter((_, i) => i !== index);
//     setTodos(newTodos);
//   };

//   return (
//     <div>
//       <h1>Todo List</h1>
//       <input
//         type="text"
//         value={inputValue}
//         onChange={(e) => setInputValue(e.target.value)}
//         placeholder="Add a new todo"
//       />
//       <button onClick={addTodo}>Add</button>
//       <ul>
//         {todos.map((todo, index) => (
//           <li key={index}>
//             {todo} <button onClick={() => removeTodo(index)}>Remove</button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default TodoApp;`;

// export const DEFAULT_MESSAGES = [
//   new HumanMessage({ content: "Hello", id: uuidv4() }),
//   new AIMessage({
//     content: "",
//     tool_calls: [
//       {
//         name: "artifact_ui",
//         args: {
//           title: "The Unexpected Journey",
//         },
//         id: "Dummy_id_123",
//       },
//     ],
//   }),
//   new AIMessage({
//     content: "I hope this suspenseful story is to your liking.",
//     id: uuidv4(),
//   }),
//   new HumanMessage({ content: "Write me a react todo app", id: uuidv4() }),
//   new AIMessage({
//     content: "",
//     tool_calls: [
//       {
//         name: "artifact_ui",
//         args: {
//           title: "React Todo App",
//         },
//         id: "dummy_code_123",
//       },
//     ],
//   }),
//   new AIMessage({
//     content: "Boom! You're ready to raise a seed round now!",
//     id: uuidv4(),
//   }),
// ];

// export const DEFAULT_ARTIFACTS: Artifact[] = [
//   {
//     id: "Dummy_id_123",
//     content: defaultContent,
//     title: "The Unexpected Journey",
//     language: "english",
//     type: "text",
//   },
//   {
//     id: "dummy_code_123",
//     content: dummyCodeContent,
//     title: "React Todo App",
//     language: "javascript",
//     type: "code",
//   },
// ];

export const DUMMY_QUICK_ACTIONS: CustomQuickAction[] = [
  {
    id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    title: "Explain Code",
    prompt: "",
    includeReflections: true,
    includePrefix: true,
    includeRecentHistory: true,
  },
  {
    id: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
    title: "Optimize Function",
    prompt: "",
    includeReflections: false,
    includePrefix: true,
    includeRecentHistory: false,
  },
  {
    id: "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
    title: "Debug Issue",
    prompt: "",
    includeReflections: true,
    includePrefix: false,
    includeRecentHistory: true,
  },
  {
    id: "4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
    title: "Refactor Class",
    prompt: "",
    includeReflections: false,
    includePrefix: true,
    includeRecentHistory: true,
  },
  {
    id: "5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
    title: "Add Comments",
    prompt: "",
    includeReflections: true,
    includePrefix: false,
    includeRecentHistory: false,
  },
  {
    id: "6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u",
    title: "Convert to TypeScript",
    prompt: "",
    includeReflections: false,
    includePrefix: true,
    includeRecentHistory: false,
  },
  {
    id: "7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v",
    title: "Generate Tests",
    prompt: "",
    includeReflections: true,
    includePrefix: true,
    includeRecentHistory: true,
  },
  {
    id: "8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w",
    title: "Implement Interface",
    prompt: "",
    includeReflections: false,
    includePrefix: false,
    includeRecentHistory: true,
  },
  {
    id: "9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x",
    title: "Dockerize App",
    prompt: "",
    includeReflections: true,
    includePrefix: true,
    includeRecentHistory: false,
  },
  {
    id: "0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y",
    title: "API Documentation",
    prompt: "",
    includeReflections: false,
    includePrefix: true,
    includeRecentHistory: true,
  },
];
