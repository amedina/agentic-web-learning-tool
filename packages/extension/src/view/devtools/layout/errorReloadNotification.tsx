/**
 * External dependencies.
 */
import { Button } from '@google-awlt/design-system';

interface ExtensionReloadNotificationProps {
  tabId?: number;
  texts: {
    displayText: string;
    buttonText: string;
  };
}

const ExtensionReloadNotification = ({
  tabId,
  texts,
}: ExtensionReloadNotificationProps) => {
  return (
    <div className="w-full h-full px-2 flex flex-col items-center justify-center border-b border-american-silver dark:border-quartz bg-white dark:bg-charleston-green dark:text-white">
      <p className="text-xl text-center px-4">{texts.displayText}</p>
      <div className="ml-2 mt-4">
        <Button
          onClick={() => {
            globalThis?.location?.reload();
            if (localStorage.getItem('psatOpenedAfterPageLoad') && tabId) {
              try {
                chrome.tabs.reload(tabId);
                localStorage.removeItem('psatOpenedAfterPageLoad');
              } catch (error) {
                //Fail silenlty
              }
            }
          }}
        >
          {texts.buttonText}
        </Button>
      </div>
    </div>
  );
};

export default ExtensionReloadNotification;
