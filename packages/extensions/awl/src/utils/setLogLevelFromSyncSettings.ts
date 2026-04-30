/**
 * External dependencies
 */
import { Logger } from '@agentic-web-labs/common';
/**
 * Internal dependencies
 */
import { settingsGetter } from './settingsGetter';

export default async function setLogLevelFromSyncSettings() {
  const { logLevel } = await settingsGetter();
  Logger.setLevel(logLevel);
}
