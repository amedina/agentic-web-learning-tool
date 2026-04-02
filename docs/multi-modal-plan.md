# Multi-Modal Input for Sidepanel Chat

## Context

The Sidepanel chat interface has a Paperclip icon below the chat input that is intended to let users attach images, but it's currently a disabled button with no functionality. Users also cannot paste images from their clipboard into the chat. This plan wires up the existing `@assistant-ui/react` attachment primitives (which are already available in the installed v0.11.51 but unused) to enable image attachments via file picker, clipboard paste, and drag-and-drop.

The key insight is that almost all the infrastructure already exists -- the framework has `SimpleImageAttachmentAdapter`, `ComposerPrimitive.AddAttachment`, `ComposerPrimitive.Attachments`, and `AttachmentPrimitive.*` components. The AI SDK's `convertToModelMessages()` + `streamText()` pipeline already handles image content parts for cloud providers. We just need to connect the pieces.

## Files to Modify

1. `packages/extension/src/view/sidePanel/customRuntime/customRuntimeProvider.tsx`
2. `packages/extension/src/view/sidePanel/components/chatBot/chatBotUI.tsx`
3. `packages/extension/src/view/sidePanel/components/chatBot/userMessage.tsx`
4. `packages/extension/src/view/sidePanel/utils/convertMessages.ts`

## Implementation Steps

### Step 1: Register the Attachment Adapter in the Runtime

- [ ] **File:** `customRuntimeProvider.tsx`
- [ ] Import `SimpleImageAttachmentAdapter` from `@assistant-ui/react`
- [ ] Pass it to `useChatRuntime()` via the `adapters` option:

```ts
return useChatRuntime({
  messages: [],
  transport,
  sendAutomaticallyWhen: (messages) =>
    lastAssistantMessageIsCompleteWithToolCalls(messages),
  adapters: {
    attachments: new SimpleImageAttachmentAdapter(),
  },
});
```

This activates the entire attachment infrastructure. `SimpleImageAttachmentAdapter` accepts `image/*` files, converts them to base64 data URLs on send, and produces `{ type: "image", image: dataURL }` content parts that `convertToModelMessages()` already handles.

### Step 2: Wire the Paperclip Button + Add Attachment Previews

**File:** `chatBotUI.tsx`

- [ ] **2a.** Replace the disabled Paperclip button (lines 232-234) with `ComposerPrimitive.AddAttachment`:

```tsx
<ComposerPrimitive.AddAttachment asChild>
  <Button variant="ghost" title="Attach image" size="icon">
    <Paperclip size={18} />
  </Button>
</ComposerPrimitive.AddAttachment>
```

Using `asChild` merges the click handler onto the existing `<Button>`, preserving styling. Clicking opens the native file picker filtered to `image/*`.

- [ ] **2b.** Add `ComposerPrimitive.Attachments` between the Input and the toolbar to show image previews before sending. Create an `ImageAttachmentPreview` component using `AttachmentPrimitive.Root`, `AttachmentPrimitive.Thumb`, and `AttachmentPrimitive.Remove`.

- [ ] **2c.** Wrap the composer in `ComposerPrimitive.AttachmentDropzone` for drag-and-drop support.

- [ ] **2d.** Conditionally disable the attach button when Gemini Nano (`browser-ai`) is selected, since it doesn't support images. The `selectedAgent` is already available in the component.

### Step 3: Clipboard Paste (Free)

- [ ] Verify clipboard paste works automatically

No code changes needed. `ComposerPrimitive.Input` already supports `addAttachmentOnPaste` (defaults to `true`). Once the adapter is registered in Step 1, pasting images from clipboard automatically works.

### Step 4: Display Images in Sent User Messages

- [ ] **File:** `userMessage.tsx`
- [ ] Pass an `Image` component to `MessagePrimitive.Parts`:

```tsx
<MessagePrimitive.Parts
  components={{
    Image: ({ image }) => (
      <img
        src={image}
        alt="Attached image"
        className="max-w-full rounded-lg my-2"
      />
    ),
  }}
/>
```

The `ImageMessagePart` type has `{ type: "image", image: string }` where `image` is the data URL.

### Step 5: Handle Gemini Nano Gracefully

- [ ] **File:** `convertMessages.ts`
- [ ] Change the `case 'user'` block (lines 34-45) to filter instead of throw for non-text content parts:

```ts
case 'user': {
  const content = message.content
    .filter((part) => part.type === 'text')
    .map((part) => ({
      type: 'text' as const,
      value: part.text || '',
    }));
  // ...
```

This prevents crashes when a user sends an image with the on-device model selected. The text part of the message still gets processed.

## Verification Checklist

- [ ] **Build**: Run `pnpm build` to ensure no TypeScript errors
- [ ] **File picker**: Click the Paperclip icon -- native file picker should open, filtered to images
- [ ] **Preview**: After selecting an image, a thumbnail with remove button should appear in the composer area
- [ ] **Send**: Send a message with an attached image -- the image should appear in the user message bubble
- [ ] **AI response**: The cloud AI provider (Claude, GPT-4o, Gemini) should respond with awareness of the image content
- [ ] **Clipboard paste**: Copy an image to clipboard, paste into the chat input -- should add as attachment
- [ ] **Drag-and-drop**: Drag an image file over the composer -- should add as attachment
- [ ] **Gemini Nano**: Select browser-ai model, attach button should be disabled. If image is somehow sent (e.g. model switched after attaching), no crash should occur
- [ ] **Remove**: Click the X on a preview thumbnail -- attachment should be removed before sending
