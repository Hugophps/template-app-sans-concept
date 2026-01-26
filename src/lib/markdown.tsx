import React from 'react';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list'; items: string[] };

const flushParagraph = (paragraph: string[], blocks: Block[]) => {
  if (paragraph.length === 0) return;
  blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  paragraph.length = 0;
};

const flushList = (listItems: string[], blocks: Block[]) => {
  if (listItems.length === 0) return;
  blocks.push({ type: 'list', items: [...listItems] });
  listItems.length = 0;
};

const parseMarkdown = (content: string): Block[] => {
  const lines = content.split(/\r?\n/);
  const blocks: Block[] = [];
  const paragraph: string[] = [];
  const listItems: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph(paragraph, blocks);
      flushList(listItems, blocks);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph(paragraph, blocks);
      listItems.push(line.slice(2).trim());
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph(paragraph, blocks);
      flushList(listItems, blocks);
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      continue;
    }

    if (listItems.length > 0) {
      flushList(listItems, blocks);
    }

    paragraph.push(line);
  }

  flushParagraph(paragraph, blocks);
  flushList(listItems, blocks);

  return blocks;
};

export const renderMarkdown = (content: string): React.ReactNode => {
  const blocks = parseMarkdown(content);

  return (
    <div className="markdown-content">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return <p key={`p-${index}`}>{block.text}</p>;
        }

        if (block.type === 'list') {
          return (
            <ul key={`ul-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`li-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.level === 1) {
          return <h1 key={`h1-${index}`}>{block.text}</h1>;
        }

        if (block.level === 2) {
          return <h2 key={`h2-${index}`}>{block.text}</h2>;
        }

        return <h3 key={`h3-${index}`}>{block.text}</h3>;
      })}
    </div>
  );
};
