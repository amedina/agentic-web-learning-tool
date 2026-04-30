/**
 * External dependencies
 */
import { Logger } from '@agentic-labs/common';
/**
 * Internal dependencies
 */
import { settingsGetter } from './settingsGetter';

export default async function setLogLevelFromSyncSettings() {
  const { logLevel } = await settingsGetter();
  Logger.setLevel(logLevel);
}
