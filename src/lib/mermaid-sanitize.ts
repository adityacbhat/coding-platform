/**
 * Sanitise LLM-generated Mermaid code so special characters inside node labels
 * don't cause parse errors. 
 * 
 * Key insight: The LLM already generates properly quoted labels. We only need to:
 * 1. Escape special characters INSIDE the quoted labels
 * 2. NOT touch the structure outside labels
 */
export function sanitizeMermaid(raw: string): string {
  let s = raw.trim();

  // 0. Ensure it starts with flowchart directive
  if (!s.toLowerCase().startsWith('flowchart') && !s.toLowerCase().startsWith('graph')) {
    s = 'flowchart TD\n' + s;
  }
  
  // Replace "graph" with "flowchart" if used
  s = s.replace(/^graph\s+(TD|TB|BT|RL|LR)/im, 'flowchart $1');

  // 1. Strip HTML line-breaks
  s = s.replace(/<br\s*\/?>/gi, ' ');

  // Helper: sanitize content inside a label
  // Escape characters that break Mermaid parsing even inside quotes
  const sanitizeLabel = (content: string) => {
    return content
      .replace(/</g, 'ᐸ')       // less-than -> unicode
      .replace(/>/g, 'ᐳ')       // greater-than -> unicode  
      .replace(/#(?![0-9a-fA-F]{3,6}[;\s])/g, 'Nr');  // hash (but not color codes)
  };

  // 2. Process only the content INSIDE quoted labels
  // Match quoted strings in node definitions: ["..."], {"..."}, ("...")
  // The pattern: bracket/brace + " + content + " + closing bracket/brace
  
  // Square brackets: ["content"]
  s = s.replace(/\["([^"]+)"\]/g, (_m, content) => {
    return `["${sanitizeLabel(content)}"]`;
  });
  
  // Curly braces (diamonds): {"content"}
  s = s.replace(/\{"([^"]+)"\}/g, (_m, content) => {
    return `{"${sanitizeLabel(content)}"}`;
  });
  
  // Double parentheses (circles): (("content"))
  s = s.replace(/\(\("([^"]+)"\)\)/g, (_m, content) => {
    return `(("${sanitizeLabel(content)}"))`;
  });
  
  // Single parentheses (rounded): ("content")
  s = s.replace(/\("([^"]+)"\)(?!\))/g, (_m, content) => {
    return `("${sanitizeLabel(content)}")`;
  });

  // 3. Remove empty lines
  const lines = s.split('\n').filter((l, i) => {
    if (i === 0) return true;
    return l.trim() !== '';
  });

  return lines.join('\n');
}
