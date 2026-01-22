/**
 * External dependencies
 */
import { AlertCircle, Plus, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { listWorkflows } from "@google-awlt/engine-extension";

/**
 * Internal dependencies
 */
import { useApi } from "../../stateProviders";

export const WorkflowConfig = () => {
  const { workflowMeta, updateWorkflowMeta } = useApi(({ state, actions }) => ({
    workflowMeta: state.workflowMeta,
    updateWorkflowMeta: actions.updateWorkflowMeta,
  }));

  const [domainInput, setDomainInput] = useState("");

  const handleAddDomain = useCallback(() => {
    if (!domainInput) return;
    const currentDomains = workflowMeta.allowedDomains || [];

    if (!currentDomains.includes(domainInput)) {
      updateWorkflowMeta({
        allowedDomains: [...currentDomains, domainInput],
      });
    }

    setDomainInput("");
  }, [domainInput, workflowMeta.allowedDomains, updateWorkflowMeta]);

  const handleRemoveDomain = useCallback(
    (domain: string) => {
      const currentDomains = workflowMeta.allowedDomains || [];
      updateWorkflowMeta({
        allowedDomains: currentDomains.filter((d) => d !== domain),
      });
    },
    [workflowMeta.allowedDomains, updateWorkflowMeta],
  );

  const [otherWorkflowNames, setOtherWorkflowNames] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    listWorkflows().then((json) => {
      const others = json
        .filter(({ meta }) => meta.id !== workflowMeta.id)
        .map(({ meta }) => meta.name);

      setOtherWorkflowNames(new Set(others));
    });
  }, [workflowMeta.id]);

  const [errors, setErrors] = useState<string[]>([]);

  const handleIsWebMCPChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecking = e.target.checked;

      if (isChecking) {
        const newErrors: string[] = [];
        if (!workflowMeta.description) {
          newErrors.push("Description is required when WebMCP is enabled.");
        }

        if (
          !workflowMeta.allowedDomains ||
          workflowMeta.allowedDomains.length === 0
        ) {
          newErrors.push(
            "At least one allowed domain is required when WebMCP is enabled.",
          );
        }

        if (otherWorkflowNames.has(workflowMeta.name)) {
          newErrors.push(
            `The name "${workflowMeta.name}" is already used by another workflow. Please change the name for unique identification.`,
          );
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
          return;
        }

        setErrors([]);
      } else {
        setErrors([]);
      }

      updateWorkflowMeta({
        isWebMCP: isChecking,
        enabled: isChecking,
      });
    },
    [
      updateWorkflowMeta,
      workflowMeta.description,
      workflowMeta.allowedDomains,
      workflowMeta.name,
      workflowMeta.enabled,
      otherWorkflowNames,
    ],
  );

  return (
    <div className="p-4 space-y-6">
      <div className="bg-slate-100 dark:bg-zinc-800/50 rounded-lg p-3 border border-slate-200 dark:border-border">
        <div className="text-xs text-slate-500 dark:text-zinc-500 mb-1 uppercase tracking-wide">
          Workflow
        </div>
        <div className="text-sm font-medium text-slate-800 dark:text-zinc-200">
          Global Settings
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2"
            htmlFor="wf-name"
          >
            Name
          </label>
          <input
            id="wf-name"
            type="text"
            className="w-full p-3 border border-slate-300 dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-foreground"
            value={workflowMeta.name}
            onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
            placeholder="Workflow Name"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2"
            htmlFor="wf-desc"
          >
            Description
            {workflowMeta.isWebMCP && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <textarea
            id="wf-desc"
            className="w-full p-3 border border-slate-300 dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white dark:bg-zinc-950 text-slate-900 dark:text-foreground"
            rows={4}
            value={workflowMeta.description || ""}
            onChange={(e) =>
              updateWorkflowMeta({ description: e.target.value })
            }
            placeholder="Describe what this workflow does..."
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2"
            htmlFor="wf-domains"
          >
            Allowed Domains
            {workflowMeta.isWebMCP && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
          <div className="flex gap-2 mb-2">
            <input
              id="wf-domains"
              type="text"
              className="flex-1 p-2 border border-slate-300 dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-zinc-950 text-slate-900 dark:text-foreground"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddDomain();
                }
              }}
              placeholder="example.com"
            />
            <button
              onClick={handleAddDomain}
              className="p-2 bg-slate-200 dark:bg-zinc-700 rounded-md hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflowMeta.allowedDomains?.map((domain) => (
              <div
                key={domain}
                className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md text-xs border border-indigo-200 dark:border-indigo-800"
              >
                <span>{domain}</span>
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="hover:text-indigo-900 dark:hover:text-indigo-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-border">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                checked={!!workflowMeta.isWebMCP}
                onChange={handleIsWebMCPChange}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Enable as WebMCP Tool
              </span>
            </label>

            {workflowMeta.isWebMCP && (
              <label className="flex items-center gap-2 cursor-pointer ml-6">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  checked={workflowMeta.enabled !== false}
                  onChange={(e) =>
                    updateWorkflowMeta({ enabled: e.target.checked })
                  }
                />
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Active
                </span>
              </label>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 ml-6">
            Allows this workflow to be used as a tool by AI agents. Requires
            unique name, description and allowed domains.
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-1">
            <AlertCircle size={16} />
            Correction Needed
          </div>
          <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-1 ml-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
