/**
 * External dependencies
 */
import Logger from 'loglevel';
/**
 * Internal dependencies
 */
import { settingsGetter } from './settingsGetter';

export default async function setLogLevelFromSyncSettings(){
    const { logLevel } = await settingsGetter();
    Logger.setLevel(logLevel);
}