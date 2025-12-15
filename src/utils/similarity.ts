
export function dotProduct(a: number[], b: number[]): number {
    return a.reduce((acc, val, i) => acc + val * b[i], 0);
  }
  
  export function cosineSimilarity(a: number[], b: number[]): number {
    const dot = dotProduct(a, b);
    const magA = Math.sqrt(dotProduct(a, a));
    const magB = Math.sqrt(dotProduct(b, b));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }
