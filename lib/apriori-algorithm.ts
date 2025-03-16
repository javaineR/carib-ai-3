/**
 * A basic Apriori algorithm implementation.
 * @param transactions - An array of transactions, where each transaction is an array of string items.
 * @param minSupport - The minimum support threshold (number of occurrences) for an item set to be considered frequent.
 * @returns An array of frequent item sets.
 */
export function apriori(transactions: string[][], minSupport: number): string[][] {
  // Count frequency of individual items
  const itemCount: { [item: string]: number } = {};
  transactions.forEach(transaction => {
    transaction.forEach(item => {
      itemCount[item] = (itemCount[item] || 0) + 1;
    });
  });

  // Filter items to get frequent 1-item sets
  let frequentItems: string[][] = [];
  const L1 = Object.entries(itemCount)
    .filter(([_, count]) => count >= minSupport)
    .map(([item]) => [item]);

  if (L1.length === 0) return [];

  frequentItems = L1;
  let currentL = L1;
  let k = 2;

  // Continue finding frequent item sets until no new ones are found
  while (currentL.length > 0) {
    const candidates: string[][] = generateCandidates(currentL, k);
    
    // Prune candidates that have non-frequent subsets
    const prunedCandidates = pruneCandidates(candidates, currentL, k);

    // Count support for each candidate
    const candidateCounts: Map<string, number> = new Map();
    prunedCandidates.forEach(candidate => {
      const key = candidate.join(',');
      candidateCounts.set(key, 0);
      
      // Increment count for each transaction containing all items in candidate
      transactions.forEach(transaction => {
        if (isSubset(candidate, transaction)) {
          candidateCounts.set(key, (candidateCounts.get(key) || 0) + 1);
        }
      });
    });

    // Filter candidates that meet the minimum support
    const Lk = prunedCandidates.filter(candidate => {
      const key = candidate.join(',');
      return (candidateCounts.get(key) || 0) >= minSupport;
    });

    if (Lk.length === 0) break;
    
    currentL = Lk;
    frequentItems = frequentItems.concat(Lk);
    k++;
  }

  return frequentItems;
}

/**
 * Generate candidate itemsets of size k from frequent itemsets of size k-1.
 * Uses the more efficient approach of joining itemsets that share k-2 items.
 */
function generateCandidates(frequentItemsets: string[][], k: number): string[][] {
  const candidates: string[][] = [];
  
  // For k=2, simply join all frequent 1-itemsets
  if (k === 2) {
    for (let i = 0; i < frequentItemsets.length; i++) {
      for (let j = i + 1; j < frequentItemsets.length; j++) {
        candidates.push([...frequentItemsets[i], ...frequentItemsets[j]].sort());
      }
    }
    return candidates;
  }
  
  // For k>2, join itemsets that share first k-2 items
  for (let i = 0; i < frequentItemsets.length; i++) {
    for (let j = i + 1; j < frequentItemsets.length; j++) {
      // Check if first k-2 items are the same
      let canJoin = true;
      for (let l = 0; l < k - 2; l++) {
        if (frequentItemsets[i][l] !== frequentItemsets[j][l]) {
          canJoin = false;
          break;
        }
      }
      
      // Join if first k-2 items match and last items are different
      if (canJoin && frequentItemsets[i][k-2] < frequentItemsets[j][k-2]) {
        const candidate = [...frequentItemsets[i].slice(0, k-1), frequentItemsets[j][k-2]];
        candidates.push(candidate);
      }
    }
  }
  
  return candidates;
}

/**
 * Prune candidates that have infrequent subsets.
 * Based on the Apriori property: if any subset of length k-1 is not frequent,
 * then the k-length candidate cannot be frequent.
 */
function pruneCandidates(candidates: string[][], frequentItems: string[][], k: number): string[][] {
  if (k <= 2) return candidates; // No pruning needed for k=2
  
  return candidates.filter(candidate => {
    // Generate all k-1 subsets of the candidate
    const subsets = generateSubsets(candidate, k-1);
    
    // Check if all subsets are frequent
    return subsets.every(subset => {
      const subsetKey = subset.join(',');
      return frequentItems.some(item => item.join(',') === subsetKey);
    });
  });
}

/**
 * Generate all subsets of size n from the given set.
 */
function generateSubsets(set: string[], n: number): string[][] {
  const result: string[][] = [];
  
  function backtrack(start: number, current: string[]) {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < set.length; i++) {
      current.push(set[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

/**
 * Check if all items in subset are present in set.
 */
function isSubset(subset: string[], set: string[]): boolean {
  return subset.every(item => set.includes(item));
} 