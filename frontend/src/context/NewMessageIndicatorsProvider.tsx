import React, { createContext } from "react";
import {
  useNewMessageIndicators,
  type NewMessageIndicators,
} from "../hooks/useNewMessageIndicators";

interface NewMessageIndicatorsContextType {
  indicators: NewMessageIndicators;
  checkCourseIndicators: (courseIds: number[]) => Promise<void>;
  checkPrivateIndicators: (userIds: number[]) => Promise<void>;
  markCourseAsViewed: (courseId: number) => Promise<void>;
  markPrivateConversationAsViewed: (userId: number) => Promise<void>;
  getCourseIndicator: (courseId: number) => boolean;
  getPrivateIndicator: (userId: number) => boolean;
  handleCourseMessageUpdate: (courseId: number, senderId: string) => void;
}

const NewMessageIndicatorsContext = createContext<
  NewMessageIndicatorsContextType | undefined
>(undefined);

export { NewMessageIndicatorsContext };

export function NewMessageIndicatorsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const indicatorHook = useNewMessageIndicators();

  return (
    <NewMessageIndicatorsContext.Provider value={indicatorHook}>
      {children}
    </NewMessageIndicatorsContext.Provider>
  );
}
