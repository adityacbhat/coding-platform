/**
 * Sanitise LLM-generated Mermaid code so special characters inside node labels
 * don't cause parse errors. Strategy: ensure every node label is double-quoted.
 */
export function sanitizeMermaid(raw: string): string {
  let s = raw;

  // 0. Ensure it starts with flowchart directive
  s = s.trim();
  if (!s.toLowerCase().startsWith('flowchart') && !s.toLowerCase().startsWith('graph')) {
    s = 'flowchart TD\n' + s;
  }
  
  // Replace "graph" with "flowchart" if used
  s = s.replace(/^graph\s+(TD|TB|BT|RL|LR)/im, 'flowchart $1');

  // 1. Strip HTML line-breaks and tags from labels
  s = s.replace(/<br\s*\/?>/gi, ' ');
  s = s.replace(/<[^>]+>/g, '');

  // Helper: given the inner text of a label, return a safely double-quoted version.
  // We also replace characters that confuse Mermaid's tokeniser even inside quotes:
  //   [ ]  →  ( )   (array-index notation like stack[-1] breaks the parser)
  //   { }  →  ( )   (nested braces)
  //   "    →  '     (internal double-quotes close the string early)
  //   |    →  /     (pipe is used for edge labels in flowcharts)
  //   <>   →  ()    (angle brackets can be mistaken for HTML)
  //   #    →  Nr    (hash can be interpreted as color)
  //   &    →  and   (ampersand can break)
  //   ;    →  ,     (semicolon can terminate)
  const q = (inner: string) => {
    if (inner.startsWith('"') && inner.endsWith('"')) {
      // already quoted — still sanitise the content inside
      inner = inner.slice(1, -1);
    }
    const safe = inner
      .replace(/"/g, "'")
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/\{/g, '(')
      .replace(/\}/g, ')')
      .replace(/\|/g, '/')
      .replace(/</g, '(')
      .replace(/>/g, ')')
      .replace(/#/g, 'Nr')
      .replace(/&/g, ' and ')
      .replace(/;/g, ',');
    return `"${safe}"`;
  };

  // 2. Square bracket nodes: id[label] — skip parallelograms (/…/)
  s = s.replace(/(\b\w[\w\d]*)\[([^[\]]+)\]/g, (match, id, inner) => {
    if (inner.startsWith('/') || inner.endsWith('/')) return match;
    return `${id}[${q(inner)}]`;
  });

  // 3. Curly brace (diamond) nodes: id{label} → always quote
  s = s.replace(/(\b\w[\w\d]*)\{([^{}]+)\}/g, (_m, id, inner) => `${id}{${q(inner)}}`);

  // 4. Round bracket nodes per line — skip subgraph lines
  s = s
    .split('\n')
    .map((line) => {
      if (/^\s*subgraph/i.test(line)) return line;
      // Double paren: id((label))
      line = line.replace(/(\b\w[\w\d]*)\(\(([^()]+)\)\)/g, (_m, id, inner) => `${id}((${q(inner)}))`);
      // Single paren: id(label)
      line = line.replace(/((?:^|[\s>])(\w[\w\d]*))\(([^()[\]]+)\)/g, (match, prefix, id, inner) => {
        const lead = prefix.slice(0, prefix.length - id.length);
        return `${lead}${id}(${q(inner)})`;
      });
      return line;
    })
    .join('\n');

  // 5. Strip HTML inside style lines
  s = s.replace(/style\s+\S+\s+[^\n]*/g, (m) => m.replace(/<[^>]+>/g, ''));

  // 6. Remove any empty lines at the start after the directive
  const lines = s.split('\n');
  const firstLine = lines[0];
  const restLines = lines.slice(1).filter(l => l.trim() !== '' || l.includes('-->') || l.includes('---'));
  s = [firstLine, ...restLines].join('\n');

  return s;
}
