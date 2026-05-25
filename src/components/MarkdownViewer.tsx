type MarkdownViewerOptions = {
  wikiLinkBasePath?: string;
  wikiLinkResolver?: (target: string) => string | undefined;
};

function parseInline(text: string, options: MarkdownViewerOptions = {}) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\[\[([^\]|]+)(?:\|([^\]]+))?\]\])|(!\[([^\]]*)\]\(([^\s)]+)\))|(\[([^\]]+)\]\(([^\s)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[2]) {
      const target = match[2].trim().replace(/\.md$/i, '').split('#')[0];
      const label = match[3] || match[2];
      const href = options.wikiLinkResolver?.(target) ?? (options.wikiLinkBasePath ? `${options.wikiLinkBasePath}/${target}` : undefined);
      nodes.push(href ? <a className="wiki-link" href={href} key={match.index}>{label}</a> : <span className="wiki-link" key={match.index}>{label}</span>);
    } else if (match[5] !== undefined && match[6]) {
      nodes.push(<img alt={match[5]} key={match.index} src={match[6]} />);
    } else if (match[8] && match[9]) {
      nodes.push(<a href={match[9]} key={match.index}>{match[8]}</a>);
    } else if (match[11]) {
      nodes.push(<code key={match.index}>{match[11]}</code>);
    } else if (match[13]) {
      nodes.push(<strong key={match.index}>{match[13]}</strong>);
    } else if (match[15]) {
      nodes.push(<em key={match.index}>{match[15]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function collectParagraph(lines: string[], start: number) {
  const paragraphLines: string[] = [];
  let index = start;

  while (index < lines.length) {
    const current = lines[index];
    const trimmed = current.trim();
    const next = lines[index + 1];
    if (!trimmed) break;
    if (trimmed.startsWith('```')) break;
    if (/^(#{1,6})\s+/.test(trimmed)) break;
    if (/^[-*]\s+/.test(trimmed)) break;
    if (/^\d+\.\s+/.test(trimmed)) break;
    if (/^---+$/.test(trimmed)) break;
    if (trimmed.startsWith('>')) break;
    if (trimmed.includes('|') && next && isTableDivider(next)) break;
    paragraphLines.push(trimmed);
    index += 1;
  }

  return { text: paragraphLines.join(' '), nextIndex: index };
}

export function MarkdownViewer({ content, wikiLinkBasePath, wikiLinkResolver }: { content: string; wikiLinkBasePath?: string; wikiLinkResolver?: (target: string) => string | undefined }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <figure className="markdown-code" key={index}>
          {language && <figcaption>{language}</figcaption>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </figure>,
      );
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push(<hr key={index} />);
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const text = parseInline(heading[2], { wikiLinkBasePath, wikiLinkResolver });
      if (level === 1) blocks.push(<h1 key={index}>{text}</h1>);
      if (level === 2) blocks.push(<h2 key={index}>{text}</h2>);
      if (level === 3) blocks.push(<h3 key={index}>{text}</h3>);
      if (level >= 4) blocks.push(<h4 key={index}>{text}</h4>);
      index += 1;
      continue;
    }

    if (trimmed.includes('|') && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="markdown-table-wrap" key={index}>
          <table>
            <thead><tr>{headers.map((header) => <th key={header}>{parseInline(header, { wikiLinkBasePath, wikiLinkResolver })}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${row.join('|')}-${rowIndex}`}>
                  {headers.map((header, cellIndex) => <td key={`${header}-${cellIndex}`}>{parseInline(row[cellIndex] ?? '', { wikiLinkBasePath, wikiLinkResolver })}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(<ul key={index}>{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{parseInline(item, { wikiLinkBasePath, wikiLinkResolver })}</li>)}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(<ol key={index}>{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{parseInline(item, { wikiLinkBasePath, wikiLinkResolver })}</li>)}</ol>);
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quotes: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quotes.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={index}>{parseInline(quotes.join(' '), { wikiLinkBasePath, wikiLinkResolver })}</blockquote>);
      continue;
    }

    const paragraph = collectParagraph(lines, index);
    blocks.push(<p key={index}>{parseInline(paragraph.text, { wikiLinkBasePath, wikiLinkResolver })}</p>);
    index = paragraph.nextIndex;
  }

  return <article className="content-card markdown-viewer">{blocks}</article>;
}
