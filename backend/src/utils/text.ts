const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "build", "building",
  "want", "would", "like", "using", "use", "need", "needs", "project", "system",
  "based", "create", "make", "our", "their", "will", "can", "should", "have",
  "has", "are", "was", "were", "about", "help", "platform", "application", "app",
  "something", "which", "when", "where", "there", "then", "than", "them", "they",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function uniqueTokens(text: string): string[] {
  return Array.from(new Set(tokenize(text)));
}

export function matchedKeywords(projectText: string, corpusText: string): string[] {
  const corpus = new Set(tokenize(corpusText));
  return uniqueTokens(projectText).filter((token) => corpus.has(token));
}
