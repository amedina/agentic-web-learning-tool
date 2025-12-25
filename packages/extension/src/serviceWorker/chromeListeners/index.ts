/**
 * Internal dependencies
 */
import { onInstalledCallback } from "./onInstalledListener";

chrome.runtime.onInstalled.addListener(onInstalledCallback);
