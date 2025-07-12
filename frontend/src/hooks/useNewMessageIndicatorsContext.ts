import { useContext } from "react";
import { NewMessageIndicatorsContext } from "../context/NewMessageIndicatorsProvider";

export function useNewMessageIndicatorsContext() {
  const context = useContext(NewMessageIndicatorsContext);
  if (context === undefined) {
    throw new Error(
      "useNewMessageIndicatorsContext must be used within a NewMessageIndicatorsProvider"
    );
  }
  return context;
}
