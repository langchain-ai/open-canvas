export function registerArtifactFlow(builder: any) {
  return builder
    .addEdge("generateArtifact", "generateFollowup")
    .addEdge("updateArtifact", "generateFollowup")
    .addEdge("updateHighlightedText", "generateFollowup")
    .addEdge("rewriteArtifact", "generateFollowup")
    .addEdge("rewriteArtifactTheme", "generateFollowup")
    .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
    .addEdge("customAction", "generateFollowup")
    .addEdge("webSearch", "routePostWebSearch");
}
