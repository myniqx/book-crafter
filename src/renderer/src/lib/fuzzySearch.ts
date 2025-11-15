/**
 * Simple fuzzy search implementation
 * Scores items based on how well they match the search query
 */

/**
 * Calculate fuzzy match score for a string
 * Returns a score between 0-1 (higher is better match)
 * Returns 0 if no match
 */
export const fuzzyScore = (str: string, query: string): number => {
  if (!query) return 1 // Empty query matches everything
  if (!str) return 0

  const lowerStr = str.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match gets highest score
  if (lowerStr === lowerQuery) return 1

  // Contains gets high score
  if (lowerStr.includes(lowerQuery)) return 0.9

  // Fuzzy matching
  let queryIndex = 0
  let score = 0
  let previousMatchIndex = -1
  let consecutiveMatches = 0

  for (let i = 0; i < lowerStr.length && queryIndex < lowerQuery.length; i++) {
    if (lowerStr[i] === lowerQuery[queryIndex]) {
      // Character match found
      queryIndex++

      // Bonus for consecutive matches
      if (previousMatchIndex === i - 1) {
        consecutiveMatches++
        score += 1 + consecutiveMatches * 0.5
      } else {
        consecutiveMatches = 0
        score += 1
      }

      // Bonus for matching at word start
      if (i === 0 || lowerStr[i - 1] === ' ' || lowerStr[i - 1] === '-') {
        score += 2
      }

      previousMatchIndex = i
    }
  }

  // Not all query characters found
  if (queryIndex < lowerQuery.length) return 0

  // Normalize score based on string length
  const maxScore = lowerQuery.length * 3 // Rough max score estimation
  return Math.min(score / maxScore, 0.8)
}

/**
 * Fuzzy search in an array of items
 * Returns sorted array of matching items
 */
export const fuzzySearch = <T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string | string[]
): T[] => {
  if (!query.trim()) return items

  const scoredItems = items
    .map((item) => {
      const rawTexts = getSearchableText(item)
      const searchTexts = Array.isArray(rawTexts) ? rawTexts : [rawTexts]

      // Flatten and convert to strings
      const textStrings = searchTexts.flat().map(text =>
        typeof text === 'string' ? text : String(text)
      )

      // Get best score from all searchable texts
      const score = Math.max(...textStrings.map((text) => fuzzyScore(text, query)))

      return { item, score }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)

  return scoredItems.map((result) => result.item)
}

/**
 * Highlight matching characters in a string
 * Returns array of segments with highlighted portions
 */
export const highlightMatches = (
  str: string,
  query: string
): Array<{ text: string; match: boolean }> => {
  if (!query) return [{ text: str, match: false }]

  const lowerStr = str.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const segments: Array<{ text: string; match: boolean }> = []

  let queryIndex = 0
  let segmentStart = 0

  for (let i = 0; i < str.length && queryIndex < lowerQuery.length; i++) {
    if (lowerStr[i] === lowerQuery[queryIndex]) {
      // Add non-matching segment before this match
      if (i > segmentStart) {
        segments.push({ text: str.substring(segmentStart, i), match: false })
      }

      // Add matching character
      segments.push({ text: str[i], match: true })

      queryIndex++
      segmentStart = i + 1
    }
  }

  // Add remaining non-matching text
  if (segmentStart < str.length) {
    segments.push({ text: str.substring(segmentStart), match: false })
  }

  return segments
}
