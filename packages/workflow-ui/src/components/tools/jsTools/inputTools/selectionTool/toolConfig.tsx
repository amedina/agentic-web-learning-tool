/**
 * External dependencies
 */
import { useImperativeHandle } from "react";
import {
  SelectionToolConfigSchema,
  type SelectionToolConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import logger from "../../../../../logger";
interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => SelectionToolConfig | undefined;
  }>;
  config: SelectionToolConfig;
}

const ToolConfig = ({ ref }: ToolConfigProps) => {
  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;

        const configResult = {
          title,
        };

        const validation = SelectionToolConfigSchema.safeParse(configResult);
        if (!validation.success) {
          logger(["error"], ["Invalid configuration:", validation.error]);
          return undefined;
        }

        return validation.data;
      },
    }),
    [],
  );

  return null;
};

export default ToolConfig;
