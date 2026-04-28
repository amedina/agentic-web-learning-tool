/**
 * External dependencies.
 */
import React, { createContext, useContext } from "react";

/**
 * Internal dependencies.
 */
import { type StatsClient } from "../types/statsClient";

const StatsClientContext = createContext<StatsClient | null>(null);

export function useStatsClient(): StatsClient {
  const client = useContext(StatsClientContext);
  if (!client) {
    throw new Error("useStatsClient must be used inside a StatsClientProvider");
  }
  return client;
}

interface StatsClientProviderProps {
  client: StatsClient;
  children: React.ReactNode;
}

export const StatsClientProvider: React.FC<StatsClientProviderProps> = ({
  client,
  children,
}) => (
  <StatsClientContext.Provider value={client}>
    {children}
  </StatsClientContext.Provider>
);
