/**
 * Internal dependencies
 */
import setLogLevelFromSyncSettings from '../../utils/setLogLevelFromSyncSettings';

export default async function syncStorageChangeCallback(){
    await setLogLevelFromSyncSettings()
}