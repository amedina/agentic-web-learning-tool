/**
 * Internal dependencies
 */
import { setLogLevelFromSyncSettings } from '../../utils';

export default async function syncStorageChangeCallback() {
	await setLogLevelFromSyncSettings();
}
