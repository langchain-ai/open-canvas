import { ReflectionsDialog } from "../../reflections-dialog/ReflectionsDialog";
import { ArtifactTitle } from "./artifact-title";
import { NavigateArtifactHistory } from "./navigate-artifact-history";
import { ArtifactCodeV3, ArtifactMarkdownV3 } from "@/types";
import { Assistant } from "@langchain/langgraph-sdk";

interface ArtifactHeaderProps {
  isBackwardsDisabled: boolean;
  isForwardDisabled: boolean;
  setSelectedArtifact: (index: number) => void;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  isArtifactSaved: boolean;
  totalArtifactVersions: number;
  selectedAssistant: Assistant | undefined;
  artifactUpdateFailed: boolean;
}

export function ArtifactHeader(props: ArtifactHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <ArtifactTitle
        title={props.currentArtifactContent.title}
        isArtifactSaved={props.isArtifactSaved}
        artifactUpdateFailed={props.artifactUpdateFailed}
      />
      <div className="flex gap-2 items-end mt-[10px] mr-[6px]">
        <NavigateArtifactHistory
          isBackwardsDisabled={props.isBackwardsDisabled}
          isForwardDisabled={props.isForwardDisabled}
          setSelectedArtifact={props.setSelectedArtifact}
          currentArtifactIndex={props.currentArtifactContent.index}
          totalArtifactVersions={props.totalArtifactVersions}
        />
        <ReflectionsDialog selectedAssistant={props.selectedAssistant} />
      </div>
    </div>
  );
}
