import { useRef } from "react";
import {
  createCollaboration,
  observeOutput,
  observeLanguage,
} from "../Collaboration/Collaboration";

export const useCollaboration = () => {
  const collaborationRef = useRef(null);

  const joinCollaboration = (roomId, onLocalTyping, setOutput, setLanguage) => {
    const collaboration = createCollaboration(roomId, onLocalTyping);

    collaborationRef.current = collaboration;

    observeOutput(collaboration.doc, setOutput);
    observeLanguage(collaboration.doc, setLanguage);

    return collaboration;
  };

  return {
    collaborationRef,
    joinCollaboration,
  };
};
