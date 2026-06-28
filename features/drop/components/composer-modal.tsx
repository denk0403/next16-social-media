'use client';

import * as Ariakit from '@ariakit/react';
import { Plus } from 'lucide-react';
import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Boundary } from '@/components/internal/boundary';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { postDrop } from '@/features/drop/drop-actions';

type Props = {
  avatar: ReactNode;
  onOpenTrigger?: ReactNode;
};

type State = { error: string | null; submittedAt: number };

const INITIAL: State = { error: null, submittedAt: 0 };

export function NewDropModal({ avatar, onOpenTrigger }: Props) {
  const dialog = Ariakit.useDialogStore();
  const [state, formAction] = useActionState(async (_: State, formData: FormData) => {
    const result = await postDrop(formData);
    if (!result.ok) {
      toast.error(result.error);
      return { error: result.error, submittedAt: 0 };
    }
    toast.success('Dropped!');
    return { error: null, submittedAt: Date.now() };
  }, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.submittedAt > 0) dialog.hide();
  }, [state.submittedAt, dialog]);

  return (
    <Boundary label="NewDropModal">
      <>
        {onOpenTrigger ? (
          <button
            type="button"
            onClick={() => {
              dialog.show();
            }}
          >
            {onOpenTrigger}
          </button>
        ) : (
          <Button
            className="w-full py-3"
            onClick={() => {
              dialog.show();
            }}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden lg:inline">New drop</span>
          </Button>
        )}
        <Modal store={dialog} title="New drop" initialFocus={textareaRef}>
          <form ref={formRef} action={formAction} className="flex min-h-0 flex-col overflow-hidden">
            <div className="flex flex-1 items-start gap-3 overflow-y-auto px-5 pt-4 pb-3">
              {avatar}
              <Ariakit.VisuallyHidden>
                <label htmlFor="new-drop-body">Drop body</label>
              </Ariakit.VisuallyHidden>
              <textarea
                id="new-drop-body"
                name="body"
                ref={textareaRef}
                rows={6}
                required
                maxLength={1000}
                placeholder={'What did you build today?\n\nWrap code in ```ts ... ``` to embed a snippet.'}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    formRef.current?.requestSubmit();
                  }
                }}
                className="placeholder-gray flex-1 resize-none border-0 bg-transparent pt-2 text-base focus:ring-0 focus:outline-none"
              />
            </div>
            {state.error ? (
              <p role="alert" className="text-danger px-5 pb-2 text-xs">
                {state.error}
              </p>
            ) : null}
            <footer className="border-divider/70 dark:border-divider-dark/70 flex items-center justify-end gap-2 border-t px-5 py-3">
              <Ariakit.DialogDismiss render={<Button variant="secondary">Cancel</Button>} />
              <Button type="submit">Drop it</Button>
            </footer>
          </form>
        </Modal>
      </>
    </Boundary>
  );
}
