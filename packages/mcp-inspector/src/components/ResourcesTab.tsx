/**
 * External dependencies
 */
import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Label,
  Combobox,
  TabsContent,
} from "@google-awlt/design-system";
import {
  type ListResourcesResult,
  type Resource,
  type ResourceTemplate,
  type ListResourceTemplatesResult,
  type ResourceTemplateReference,
  type PromptReference,
} from "@modelcontextprotocol/sdk/types.js";
import { AlertCircle, ChevronRight, FileText, RefreshCw } from "lucide-react";
import { UriTemplate } from "@modelcontextprotocol/sdk/shared/uriTemplate.js";

/**
 * Internal dependencies
 */
import ListPane from "./ListPane";
import JsonView from "./JsonView";
import IconDisplay, { type WithIcons } from "./IconDisplay";
import { useCompletionState } from "../lib/hooks/useCompletionState";

const ResourcesTab = ({
  resources,
  resourceTemplates,
  listResources,
  clearResources,
  listResourceTemplates,
  clearResourceTemplates,
  readResource,
  selectedResource,
  setSelectedResource,
  resourceSubscriptionsSupported,
  resourceSubscriptions,
  subscribeToResource,
  unsubscribeFromResource,
  handleCompletion,
  completionsSupported,
  resourceContent,
  nextCursor,
  nextTemplateCursor,
  error,
}: {
  resources: Resource[];
  resourceTemplates: ResourceTemplate[];
  listResources: () => void;
  clearResources: () => void;
  listResourceTemplates: () => void;
  clearResourceTemplates: () => void;
  readResource: (uri: string) => void;
  selectedResource: Resource | null;
  setSelectedResource: (resource: Resource | null) => void;
  handleCompletion: (
    ref: ResourceTemplateReference | PromptReference,
    argName: string,
    value: string,
    context?: Record<string, string>,
  ) => Promise<string[]>;
  completionsSupported: boolean;
  resourceContent: string;
  nextCursor: ListResourcesResult["nextCursor"];
  nextTemplateCursor: ListResourceTemplatesResult["nextCursor"];
  error: string | null;
  resourceSubscriptionsSupported: boolean;
  resourceSubscriptions: Set<string>;
  subscribeToResource: (uri: string) => void;
  unsubscribeFromResource: (uri: string) => void;
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ResourceTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>(
    {},
  );

  const { completions, clearCompletions, requestCompletions } =
    useCompletionState(handleCompletion, completionsSupported);

  useEffect(() => {
    clearCompletions();
  }, [clearCompletions]);

  const handleTemplateValueChange = useCallback(
    async (key: string, value: string) => {
      setTemplateValues((prev) => ({ ...prev, [key]: value }));

      if (selectedTemplate?.uriTemplate) {
        requestCompletions(
          {
            type: "ref/resource",
            uri: selectedTemplate.uriTemplate,
          },
          key,
          value,
          templateValues,
        );
      }
    },
    [requestCompletions, selectedTemplate, templateValues],
  );

  const handleReadTemplateResource = useCallback(() => {
    if (selectedTemplate) {
      const uri = new UriTemplate(selectedTemplate.uriTemplate).expand(
        templateValues,
      );
      readResource(uri);
      // We don't have the full Resource object here, so we create a partial one
      setSelectedResource({ uri, name: uri } as Resource);
    }
  }, [readResource, setSelectedResource, selectedTemplate, templateValues]);

  const handleClearResources = useCallback(() => {
    clearResources();
    // Condition to check if selected resource is not resource template's resource
    if (!selectedTemplate) {
      setSelectedResource(null);
    }
  }, [clearResources, selectedTemplate, setSelectedResource]);

  const handleSetSelectedResource = useCallback(
    (resource: Resource) => {
      setSelectedResource(resource);
      readResource(resource.uri);
      setSelectedTemplate(null);
    },
    [readResource, setSelectedResource],
  );

  const handleClearResourceTemplates = useCallback(() => {
    clearResourceTemplates();
    // Condition to check if selected resource is resource template's resource
    if (selectedTemplate) {
      setSelectedResource(null);
    }
    setSelectedTemplate(null);
  }, [clearResourceTemplates, selectedTemplate, setSelectedResource]);

  const handleSetSelectedTemplate = useCallback(
    (template: ResourceTemplate) => {
      setSelectedTemplate(template);
      setSelectedResource(null);
      setTemplateValues({});
    },
    [setSelectedResource],
  );

  const handleSubscribe = useCallback(() => {
    if (selectedResource) {
      subscribeToResource(selectedResource.uri);
    }
  }, [selectedResource, subscribeToResource]);

  const handleUnsubscribe = useCallback(() => {
    if (selectedResource) {
      unsubscribeFromResource(selectedResource.uri);
    }
  }, [selectedResource, unsubscribeFromResource]);

  const handleRefresh = useCallback(() => {
    if (selectedResource) {
      readResource(selectedResource.uri);
    }
  }, [readResource, selectedResource]);

  return (
    <TabsContent value="resources">
      <div className="flex gap-5">
        <ListPane
          items={resources}
          listItems={listResources}
          clearItems={handleClearResources}
          setSelectedItem={handleSetSelectedResource}
          renderItem={(resource) => (
            <div className="flex items-center w-full">
              <IconDisplay icons={(resource as WithIcons).icons} size="sm" />
              {!(resource as WithIcons).icons && (
                <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
              )}
              <span className="flex-1 truncate" title={resource.uri.toString()}>
                {resource.name}
              </span>
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
            </div>
          )}
          title="Resources"
          buttonText={nextCursor ? "List More Resources" : "List Resources"}
          isButtonDisabled={!nextCursor && resources.length > 0}
        />

        <ListPane
          items={resourceTemplates}
          listItems={listResourceTemplates}
          clearItems={handleClearResourceTemplates}
          setSelectedItem={handleSetSelectedTemplate}
          renderItem={(template) => (
            <div className="flex items-center w-full">
              <IconDisplay icons={(template as WithIcons).icons} size="sm" />
              {!(template as WithIcons).icons && (
                <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
              )}
              <span className="flex-1 truncate" title={template.uriTemplate}>
                {template.name}
              </span>
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
            </div>
          )}
          title="Resource Templates"
          buttonText={
            nextTemplateCursor ? "List More Templates" : "List Templates"
          }
          isButtonDisabled={!nextTemplateCursor && resourceTemplates.length > 0}
        />

        <div className="bg-card border border-border rounded-lg shadow flex-1">
          <div className="p-4 border-b border-gray-200 dark:border-border flex justify-between items-center">
            <div className="flex items-center gap-2 truncate">
              {(selectedResource || selectedTemplate) && (
                <IconDisplay
                  icons={
                    ((selectedResource || selectedTemplate) as WithIcons).icons
                  }
                  size="md"
                />
              )}
              <h3
                className="font-semibold truncate"
                title={selectedResource?.name || selectedTemplate?.name}
              >
                {selectedResource
                  ? selectedResource.name
                  : selectedTemplate
                    ? selectedTemplate.name
                    : "Select a resource or template"}
              </h3>
            </div>
            {selectedResource && (
              <div className="flex row-auto gap-1 justify-end w-2/5">
                {resourceSubscriptionsSupported &&
                  !resourceSubscriptions.has(selectedResource.uri) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSubscribe}
                    >
                      Subscribe
                    </Button>
                  )}
                {resourceSubscriptionsSupported &&
                  resourceSubscriptions.has(selectedResource.uri) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnsubscribe}
                    >
                      Unsubscribe
                    </Button>
                  )}
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
          <div className="p-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="break-all">
                  {error}
                </AlertDescription>
              </Alert>
            ) : selectedResource ? (
              <JsonView
                data={resourceContent}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm overflow-auto max-h-96 text-gray-900 dark:text-gray-100"
              />
            ) : selectedTemplate ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
                {new UriTemplate(
                  selectedTemplate.uriTemplate,
                ).variableNames?.map((key) => {
                  return (
                    <div key={key}>
                      <Label htmlFor={key}>{key}</Label>
                      <Combobox
                        id={key}
                        placeholder={`Enter ${key}`}
                        value={templateValues[key] || ""}
                        onChange={(value) =>
                          handleTemplateValueChange(key, value)
                        }
                        onInputChange={(value) =>
                          handleTemplateValueChange(key, value)
                        }
                        options={completions[key] || []}
                      />
                    </div>
                  );
                })}
                <Button
                  onClick={handleReadTemplateResource}
                  disabled={Object.keys(templateValues).length === 0}
                >
                  Read Resource
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Select a resource or template from the list to view its
                  contents
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default ResourcesTab;
