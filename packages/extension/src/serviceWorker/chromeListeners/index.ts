/**
 * Internal dependencies
 */
import syncStorageChangeCallback from "./syncStorageChangeCallback";

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
