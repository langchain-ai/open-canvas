import { Artifact } from "@/types";
import { parsePartialJson } from "@langchain/core/output_parsers";

const realNewline = `
`;

function parseGeneratedArtifact(
  event: { event: string; data: Record<string, any> },
  extra: {
    generationData: {
      artifactId: string;
      fullArtifactGenerationStr: string;
    };
    setGenerationData: React.Dispatch<
      React.SetStateAction<{
        artifactId: string;
        fullArtifactGenerationStr: string;
      }>
    >;
    setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
  }
) {
  const { setArtifacts, setGenerationData, generationData } = extra;
  const { artifactId, fullArtifactGenerationStr } = generationData;

  if (
    event.data.event === "on_chat_model_stream" &&
    event.data.metadata.langgraph_node === "generateArtifact"
  ) {
    if (!artifactId && event.data.data.chunk[1].id) {
      setGenerationData((prevData) => ({
        ...prevData,
        artifactId: event.data.data.chunk[1].id,
      }));
    }
    setGenerationData((prevData) => ({
      ...prevData,
      fullArtifactGenerationStr:
        prevData.fullArtifactGenerationStr +
        event.data.data.chunk[1].tool_call_chunks[0].args,
    }));
    try {
      const artifact = parsePartialJson(fullArtifactGenerationStr);
      if (artifact.artifact && artifactId) {
        setArtifacts((prev) => {
          const allWithoutCurrent = prev.filter((a) => a.id !== artifactId);
          return [
            ...allWithoutCurrent,
            {
              id: artifactId,
              title: artifact.title ?? "",
              content: artifact.artifact.replaceAll("\n", realNewline),
            },
          ];
        });
      }
    } catch (e) {
      // no-op
    }
  }
}

export function processStreamEvent(
  event: { event: string; data: Record<string, any> },
  extra: {
    generationData: {
      artifactId: string;
      fullArtifactGenerationStr: string;
    };
    setGenerationData: React.Dispatch<
      React.SetStateAction<{
        artifactId: string;
        fullArtifactGenerationStr: string;
      }>
    >;
    setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
  }
) {
  parseGeneratedArtifact(event, extra);
}
