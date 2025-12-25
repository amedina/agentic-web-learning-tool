/**
 * External dependencies
 */
import Logger from 'loglevel';
/**
 * Internal dependencies
 */
import { settingsGetter } from '../../utils/settingsGetter';

export default async function syncStorageChangeCallback(){
    const { logLevel } = await settingsGetter();
    Logger.setLevel(logLevel);
}