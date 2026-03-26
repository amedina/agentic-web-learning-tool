/**
 * External dependencies
 */
import {
  MessagePrimitive,
  ActionBarPrimitive,
  AttachmentPrimitive,
} from '@assistant-ui/react';
import { Pencil1Icon } from '@radix-ui/react-icons';
/**
 * Internal dependencies
 */
import ActionButton from './actionButton';

const UserImagePart = ({ image }: { image: string }) => (
  <img
    src={image}
    alt="User attachment"
    className="max-w-full max-h-60 rounded-lg"
  />
);

const UserMessageAttachment = () => (
  <AttachmentPrimitive.Root className="inline-block">
    <AttachmentPrimitive.unstable_Thumb className="w-16 h-16 rounded-md overflow-hidden" />
  </AttachmentPrimitive.Root>
);

const UserMessage = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md flex-col items-end gap-1">
      <div className="flex justify-end mb-8 w-full">
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          autohideFloat="single-branch"
          className="mt-2"
        >
          <ActionBarPrimitive.Edit asChild>
            <ActionButton tooltip="Edit">
              <Pencil1Icon />
            </ActionButton>
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
        <div className="max-w-[85%] bg-volcanic-sand text-primary px-5 py-3.5 rounded-[20px] rounded-tr-sm text-[15px] leading-relaxed shadow-sm">
          <MessagePrimitive.Attachments
            components={{ Image: UserMessageAttachment }}
          />
          <MessagePrimitive.Parts
            components={{ Image: UserImagePart }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

export default UserMessage;
