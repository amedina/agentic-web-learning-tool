/**
 * Internal dependencies
 */
import { setLogLevelFromSyncSettings } from '../../utils';

export default async function syncStorageChangeCallback(changes: {
  [key: string]: chrome.storage.StorageChange;
}) {
  if (!changes.extensionSettings) {
    return;
  }
  await setLogLevelFromSyncSettings();
}
