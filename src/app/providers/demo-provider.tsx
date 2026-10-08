"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createRequestMock,
  type RequestRepository,
} from "@/features/request-project";
import { createChatMock, type ChatRepository } from "@/features/ai-chat";
import { createServiceMock, type ServiceRepository } from "@/entities/service";
import type { DemoScenario } from "@/shared/api";
type DemoContext = {
  scenario: DemoScenario;
  setScenario: (value: DemoScenario) => void;
  request: RequestRepository;
  chat: ChatRepository;
  services: ServiceRepository;
};
const serviceRepository = createServiceMock();
const Context = createContext<DemoContext | null>(null);
export function DemoProvider({
  children,
}: {
  children: (value: DemoContext) => ReactNode;
}) {
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const value = useMemo(
    () => ({
      scenario,
      setScenario,
      request: createRequestMock(scenario),
      chat: createChatMock(scenario),
      services: serviceRepository,
    }),
    [scenario],
  );
  return <Context.Provider value={value}>{children(value)}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("DemoProvider is required");
  return value;
}
