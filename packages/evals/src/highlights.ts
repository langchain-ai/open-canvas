import { type Example, Run } from "langsmith";
import { graph } from "@opencanvas/agents/dist/open-canvas/index";
import { evaluate, EvaluationResult } from "langsmith/evaluation";
import "dotenv/config";

const runGraph = async (
  input: Record<string, any>
): Promise<Record<string, any>> => {
  // Interrupt after updating the artifact
  graph.interruptAfter = ["updateArtifact"];
  return await graph.invoke(input);
};

const evaluateHighlights = (run: Run, example?: Example): EvaluationResult => {
  if (!example) {
    throw new Error("No example provided");
  }
  if (!example.outputs) {
    throw new Error("No example outputs provided");
  }
  if (!run.outputs) {
    throw new Error("No run outputs provided");
  }

  const { expectedGeneration } = example.outputs;
  const { highlighted, artifacts } = example.inputs;
  const expectedGenerationStart = artifacts[0].content.slice(
    0,
    highlighted.startCharIndex
  );
  const expectedGenerationEnd = artifacts[0].content.slice(
    highlighted.endCharIndex
  );
  const fullExpectedArtifact = `${expectedGenerationStart}${expectedGeneration}${expectedGenerationEnd}`;

  const generatedArtifact = run.outputs.artifacts[0].content;
  if (generatedArtifact !== fullExpectedArtifact) {
    return {
      key: "correct_generation",
      score: false,
    };
  }
  return {
    key: "correct_generation",
    score: true,
  };
};

async function runHighlightEval() {
  const datasetName = "open-canvas-deterministic-highlights";
  await evaluate(runGraph, {
    data: datasetName,
    evaluators: [evaluateHighlights],
    experimentPrefix: "Highlight generation",
  });
}

runHighlightEval().catch(console.error);
