import * as Icons from "lucide-react";
import React from "react";

export const getIcon = (iconName?: string) => {
  if (iconName && Icons[iconName as keyof typeof Icons]) {
    return React.createElement(
      Icons[iconName as keyof typeof Icons] as React.ElementType
    );
  }
  return React.createElement(Icons.User);
};
