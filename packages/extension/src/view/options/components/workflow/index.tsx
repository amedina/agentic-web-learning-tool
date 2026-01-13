/**
 * External dependencies
 */
import { Workflow as Panel } from '@google-awlt/workflow-ui';

/**
 * Internal depedencies
 */
import { useSettings } from '../../../stateProviders';

const Workflow = () => {
  const theme = useSettings(({ state }) => state.theme);

  return <Panel theme={theme === 'auto' ? 'system' : theme} />;
};

export default Workflow;
