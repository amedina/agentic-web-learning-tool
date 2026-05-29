/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { EdgeLabel } from "./edgeLabel";
import type { CycleEdge } from "./types";

/**
 * Inline arrow label used in the compact pill chain at the top of the
 * row. Defers all rendering to `EdgeLabel` in `inline` variant so the
 * two surfaces stay in sync.
 */
export const ArrowWithSymbols: FC<{ edge: CycleEdge | undefined }> = ({
  edge,
}) => {
  return <EdgeLabel edge={edge} variant="inline" />;
};
