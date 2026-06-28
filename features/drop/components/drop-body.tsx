import Link from 'next/link';
import { CodeBlock } from '@/components/ui/code-block';

type Props = {
  body: string;
  compact?: boolean;
  detail?: boolean;
};

export function DropBody({ body, compact = false, detail = false }: Props) {
  const segments = splitCode(body);
  return (
    <div className="flex flex-col gap-2">
      {segments.map((segment, i) => {
        if (segment.type === 'code') {
          if (compact) return null;
          return (
            <div key={i} className="relative z-20">
              <CodeBlock lang={segment.lang} code={segment.code} />
            </div>
          );
        }
        return (
          <p
            key={i}
            className={
              detail
                ? 'text-[17px] leading-relaxed text-black dark:text-white'
                : 'text-[15px] leading-snug text-black dark:text-white'
            }
          >
            {renderText(segment.text)}
          </p>
        );
      })}
    </div>
  );
}

type Segment = { type: 'text'; text: string } | { type: 'code'; lang: string; code: string };

const FENCE = /```(\w*)\n([\s\S]*?)\n?```/g;

function splitCode(body: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of body.matchAll(FENCE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      const text = body.slice(lastIndex, start).trim();
      if (text) segments.push({ text, type: 'text' });
    }
    segments.push({ code: match[2], lang: match[1] || 'bash', type: 'code' });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < body.length) {
    const text = body.slice(lastIndex).trim();
    if (text) segments.push({ text, type: 'text' });
  }
  if (segments.length === 0) {
    segments.push({ text: body, type: 'text' });
  }
  return segments;
}

const URL_RE = /(https?:\/\/[^\s<]+)/g;
const TAG_RE = /(#\w+)/g;
const TOKEN_RE = new RegExp(`${URL_RE.source}|${TAG_RE.source}`, 'g');

function renderText(text: string) {
  const lines = text.split('\n');
  return lines.flatMap((line, lineIdx) => {
    const parts = line
      .split(TOKEN_RE)
      .filter(Boolean)
      .map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link
              prefetch={true}
              key={`${lineIdx}-${i}`}
              href={`/tag/${tag}`}
              className="text-accent relative z-20 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.match(/^https?:\/\//)) {
          return (
            <a
              key={`${lineIdx}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent relative z-20 break-all hover:underline"
            >
              {part.replace(/^https?:\/\//, '')}
            </a>
          );
        }
        return <span key={`${lineIdx}-${i}`}>{part}</span>;
      });
    if (lineIdx < lines.length - 1) {
      parts.push(<br key={`br-${lineIdx}`} />);
    }
    return parts;
  });
}
