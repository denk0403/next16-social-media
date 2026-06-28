'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { Boundary } from '@/components/internal/boundary';
import { Button } from '@/components/ui/button';
import { postDrop } from '@/features/drop/drop-actions';

type Props = {
  avatar: React.ReactNode;
};

export function QuickDropForm({ avatar }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function submitAction(formData: FormData) {
    const result = await postDrop(formData);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success('Dropped!');
    }
  }

  return (
    <Boundary label="QuickDropForm">
      <section className="border-divider/70 dark:border-divider-dark/70 bg-card/30 dark:bg-card-dark/30 hidden border-b p-4 pb-6 sm:block sm:p-5 sm:pb-7">
        <form ref={formRef} action={submitAction} className="flex items-center gap-3">
          {avatar}
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            placeholder="What did you build today?"
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            className="placeholder-gray field-sizing-content flex-1 resize-none border-0 bg-transparent text-sm focus:ring-0 focus:outline-none"
          />
          <Button type="submit">Drop it</Button>
        </form>
      </section>
    </Boundary>
  );
}
