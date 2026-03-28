import React from 'react';

export function parseMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  return <FormattedText content={text} />;
}

function FormattedText({ content }) {
  const rawLines = content.split(/\n/);
  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // --- Fenced code block (``` or ~~~) ---
    const fenceMatch = trimmed.match(/^(```|~~~)([\w-]*)/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const lang = fenceMatch[2] || '';
      const codeLines = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith(fence)) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: 'code_block', lang, content: codeLines.join('\n') });
      continue;
    }

    // --- Blockquote ---
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    // --- Table ---
    if (trimmed.includes('|') && rawLines[i + 1] && /^\s*\|?\s*[-:]+\s*\|/.test(rawLines[i + 1])) {
      const tableLines = [];
      while (i < rawLines.length && rawLines[i].includes('|')) {
        tableLines.push(rawLines[i]);
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    // --- Horizontal rule ---
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // --- Numbered list: collect consecutive items ---
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // --- Unordered list: collect consecutive items ---
    if (/^(\*|-|•)\s/.test(trimmed)) {
      const items = [];
      while (i < rawLines.length && /^(\*|-|•)\s/.test(rawLines[i].trim())) {
        items.push(rawLines[i].trim().replace(/^(\*|-|•)\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    blocks.push({ type: 'line', content: line });
    i++;
  }

  return (
    <div style={{ lineHeight: '1.6', fontSize: 'inherit', color: 'inherit', overflowX: 'auto' }}>
      {blocks.map((block, idx) => {
        switch (block.type) {

          case 'code_block':
            return (
              <div key={idx} style={{ position: 'relative', marginBottom: '12px' }}>
                {block.lang && (
                  <div style={{
                    fontSize: '0.75em',
                    padding: '2px 10px',
                    background: '#2a2a2a',
                    color: '#888',
                    borderRadius: '6px 6px 0 0',
                    display: 'inline-block',
                    fontFamily: 'monospace',
                  }}>
                    {block.lang}
                  </div>
                )}
                <pre style={{
                  background: '#1a1a1a',
                  padding: '12px 16px',
                  borderRadius: block.lang ? '0 6px 6px 6px' : '6px',
                  overflowX: 'auto',
                  margin: 0,
                  fontSize: '0.9em',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre',
                }}>
                  <code>{block.content}</code>
                </pre>
              </div>
            );

          case 'blockquote':
            return (
              <blockquote key={idx} style={{
                borderLeft: '3px solid #555',
                margin: '8px 0',
                paddingLeft: '14px',
                color: '#aaa',
                fontStyle: 'italic',
              }}>
                {block.lines.map((l, j) => (
                  <div key={j}>{parseInline(l)}</div>
                ))}
              </blockquote>
            );

          case 'table':
            return <MarkdownTable key={idx} lines={block.lines} />;

          case 'hr':
            return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #333', margin: '16px 0' }} />;

          case 'ol':
            return (
              <ol key={idx} style={{ paddingLeft: '24px', marginBottom: '8px' }}>
                {block.items.map((item, j) => (
                  <li key={j} style={{ marginBottom: '4px' }}>{parseInline(item)}</li>
                ))}
              </ol>
            );

          case 'ul':
            return (
              <ul key={idx} style={{ paddingLeft: '24px', marginBottom: '8px', listStyle: 'disc' }}>
                {block.items.map((item, j) => (
                  <li key={j} style={{ marginBottom: '4px' }}>{parseInline(item)}</li>
                ))}
              </ul>
            );

          case 'line': {
            const line = block.content;
            const trimmed = line.trim();
            if (!trimmed) return null;

            const h3 = trimmed.match(/^###\s+(.+)/);
            if (h3) return <h3 key={idx} style={{ margin: '12px 0 4px', fontSize: '1.05em', fontWeight: 700 }}>{parseInline(h3[1])}</h3>;

            const h2 = trimmed.match(/^##\s+(.+)/);
            if (h2) return <h2 key={idx} style={{ margin: '14px 0 6px', fontSize: '1.15em', fontWeight: 700 }}>{parseInline(h2[1])}</h2>;

            const h1 = trimmed.match(/^#\s+(.+)/);
            if (h1) return <h1 key={idx} style={{ margin: '16px 0 8px', fontSize: '1.3em', fontWeight: 700 }}>{parseInline(h1[1])}</h1>;

            return (
              <div key={idx} style={{ marginBottom: '8px' }}>
                {parseInline(line)}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

function MarkdownTable({ lines }) {
  const rows = lines
    .filter(line => !/^\s*\|?\s*[-:]+(\s*\|\s*[-:]+)+\s*\|?\s*$/.test(line))
    .map(line =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim())
    );

  if (rows.length === 0) return null;
  const [headerRow, ...bodyRows] = rows;

  return (
    <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 'inherit' }}>
        <thead>
          <tr>
            {headerRow.map((cell, i) => (
              <th key={i} style={{
                border: '1px solid #444',
                padding: '6px 12px',
                textAlign: 'left',
                fontWeight: 700,
                background: '#1a1a1a',
                whiteSpace: 'nowrap',
              }}>
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#111' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ border: '1px solid #444', padding: '6px 12px', verticalAlign: 'top' }}>
                  {parseCellContent(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseCellContent(cell) {
  if (!cell) return null;
  const parts = cell.split(/<br\s*\/?>/gi);
  if (parts.length === 1) return parseInline(cell);
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {parseInline(part)}
          {i < parts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

function parseInline(text) {
  if (!text || typeof text !== 'string') return text;

  // Handle <br> tags
  if (/<br\s*\/?>/i.test(text)) {
    const parts = text.split(/<br\s*\/?>/gi);
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {parseInline(part)}
            {i < parts.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  }

  const parts = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {

    // Bold+italic ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (boldItalicMatch) {
      parts.push(
        <strong key={`bi-${keyIdx++}`} style={{ fontWeight: 700, fontStyle: 'italic' }}>
          {boldItalicMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(
        <strong key={`b-${keyIdx++}`} style={{ fontWeight: 700 }}>
          {parseInline(boldMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* (not **)
    const italicMatch = remaining.match(/^\*(?!\*)(.+?)\*/);
    if (italicMatch) {
      parts.push(
        <em key={`i-${keyIdx++}`} style={{ fontStyle: 'italic' }}>
          {parseInline(italicMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Italic _text_
    const italicUnderMatch = remaining.match(/^_(?!_)(.+?)_/);
    if (italicUnderMatch) {
      parts.push(
        <em key={`iu-${keyIdx++}`} style={{ fontStyle: 'italic' }}>
          {parseInline(italicUnderMatch[1])}
        </em>
      );
      remaining = remaining.slice(italicUnderMatch[0].length);
      continue;
    }

    // Bold __text__
    const boldUnderMatch = remaining.match(/^__(.+?)__/);
    if (boldUnderMatch) {
      parts.push(
        <strong key={`bu-${keyIdx++}`} style={{ fontWeight: 700 }}>
          {parseInline(boldUnderMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldUnderMatch[0].length);
      continue;
    }

    // Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      parts.push(
        <span key={`s-${keyIdx++}`} style={{ textDecoration: 'line-through', opacity: 0.7 }}>
          {parseInline(strikeMatch[1])}
        </span>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Inline code `text`
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      parts.push(
        <code key={`c-${keyIdx++}`} style={{
          background: '#1a1a1a',
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '0.9em',
        }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((https?:\/\/[^\s)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a key={`l-${keyIdx++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#60a5fa', textDecoration: 'underline' }}>
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Advance past unmatched marker
    const nextMarker = remaining.search(/(\*\*\*|\*\*|__|~~|\*|_|`|\[)/);
    if (nextMarker === -1) {
      parts.push(remaining);
      break;
    } else if (nextMarker === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextMarker));
      remaining = remaining.slice(nextMarker);
    }
  }

  return parts.length === 0
    ? text
    : parts.length === 1 && typeof parts[0] === 'string'
    ? parts[0]
    : <>{parts}</>;
}