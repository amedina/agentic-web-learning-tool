/**
 * External dependencies
 */
import { Workflow as Panel } from '@google-awlt/workflow-ui';

/**
 * Internal depedencies
 */
import { useSettings } from '../../../stateProviders';

const Workflow = () => {
  const { theme, workflowId, setWorkflowId } = useSettings(
    ({ state, actions }) => ({
      theme: state.theme,
      workflowId: state.workflowId,
      setWorkflowId: actions.setWorkflowId,
    })
  );

  return (
    <Panel
      theme={theme === 'auto' ? 'system' : theme}
      workflowId={workflowId}
      setWorkflowId={setWorkflowId}
    />
  );
};

export default Workflow;
