export type CodeLine = {
  code: string;
  explanation: string;
};

export type Example = {
  input: string;
  output: string;
  explanation: string;
};

export type PatternProblem = {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
  examples: Example[];
  codeLines: CodeLine[];
  recognitionCues: string[];
  corePattern: string;
  mentalChecklist: string[];
};

export type SubConceptContent = {
  slug: string;
  title: string;
  description: string;
  whenToUse: string[];
  problems: PatternProblem[];
  /** For general-concept module: code examples with explanations */
  pythonExamples?: { code: string; explanation: string }[];
};

export type ModuleContent = {
  slug: string;
  title: string;
  description: string;
  subConcepts: SubConceptContent[];
  position: { x: number; y: number };
  dependencies: string[];
};

export const MODULES: ModuleContent[] = [
  {
    slug: 'general-concept',
    title: 'General Concepts',
    description: 'Essential Python syntax and built-in structures you need before tackling DSA patterns.',
    position: { x: 320, y: 0 },
    dependencies: [],
    subConcepts: [
      {
        slug: 'list-slicing',
        title: 'List Slicing',
        description: 'Extract portions of lists using start:stop:step syntax. Negative indices count from end.',
        whenToUse: ['Extracting subarrays', 'Reversing or stepping through lists', 'Iterating backward'],
        problems: [],
        pythonExamples: [
          {
            code: `nums = [10, 20, 30, 40, 50, 60, 70]

nums[1:4]      # [20, 30, 40] - index 1 to 3
nums[:3]       # [10, 20, 30] - first 3
nums[3:]       # [40, 50, 60, 70] - from index 3
nums[::2]      # [10, 30, 50, 70] - every 2nd
nums[::-1]     # [70, 60, 50, 40, 30, 20, 10] - reversed
nums[-3:]      # [50, 60, 70] - last 3`,
            explanation: 'list[start:stop:step] where stop is exclusive. Omitted values default to start=0, stop=len, step=1.',
          },
          {
            code: `# Iterating backward
for i in range(n - 1, -1, -1):
    print(arr[i])  # n-1, n-2, ..., 1, 0`,
            explanation: 'range(start, stop, step) with negative step for reverse iteration. Useful when problem depends on "future" elements.',
          },
        ],
      },
      {
        slug: 'string-methods',
        title: 'String Methods',
        description: 'Character checks, case conversion, splitting and joining strings.',
        whenToUse: ['Palindromes and validation', 'Filtering characters', 'String manipulation'],
        problems: [],
        pythonExamples: [
          {
            code: `# Character checks (return True/False)
"a".islower()   # True
"A".isupper()   # True
"5".isdigit()   # True
"a".isalnum()   # True (letter or digit)
" ".isspace()   # True`,
            explanation: 'Useful for palindromes, validation, and filtering characters in strings.',
          },
          {
            code: `# Case conversion
"HELLO".lower()   # "hello"
"hello".upper()   # "HELLO"

# Split and join
"a b c".split()       # ["a", "b", "c"]
"a,b,c".split(",")    # ["a", "b", "c"]
"-".join(["1", "2"])  # "1-2"

# Trimming
"  hello  ".strip()   # "hello"`,
            explanation: 'split() without argument splits on whitespace. join() connects list elements with separator.',
          },
        ],
      },
      {
        slug: 'dictionaries',
        title: 'Dictionary Operations',
        description: 'Hash maps for key-value storage with O(1) average lookup.',
        whenToUse: ['Frequency counting', 'O(1) lookups', 'Storing key-value pairs'],
        problems: [],
        pythonExamples: [
          {
            code: `d = {"name": "Alice", "age": 25}

# Safe access with .get()
d.get("name")        # "Alice"
d.get("job")         # None (no KeyError)
d.get("job", "N/A")  # "N/A" (custom default)

# Counting pattern
count = {}
for char in "leetcode":
    count[char] = count.get(char, 0) + 1
# {'l': 1, 'e': 3, 't': 1, 'c': 1, 'o': 1, 'd': 1}`,
            explanation: '.get(key, default) avoids KeyError for missing keys. Essential for frequency counting.',
          },
          {
            code: `# Comparing dictionaries
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
d1 == d2  # True (same keys & values, order ignored)`,
            explanation: 'Dict comparison checks all keys and values match. Order doesn\'t matter.',
          },
        ],
      },
      {
        slug: 'collections-counter',
        title: 'Collections (Counter)',
        description: 'Counter from collections module for automatic frequency counting.',
        whenToUse: ['Anagram detection', 'Element frequency', 'Quick counting'],
        problems: [],
        pythonExamples: [
          {
            code: `from collections import Counter

Counter("leetcode")
# Counter({'e': 3, 'l': 1, 't': 1, 'c': 1, 'o': 1, 'd': 1})

count = Counter("aab")
count["a"]    # 2
count["z"]    # 0 (no KeyError!)`,
            explanation: 'Counter replaces manual counting loops. Missing keys return 0 instead of KeyError.',
          },
          {
            code: `# Anagram check with Counter
from collections import Counter

def isAnagram(s: str, t: str) -> bool:
    return Counter(s) == Counter(t)`,
            explanation: 'Counter comparison is valid for anagram detection. Some interviewers may ask for manual implementation.',
          },
        ],
      },
    ],
  },
  {
    slug: 'arrays-hashing',
    title: 'Arrays & Hashing',
    description: 'Foundation of data manipulation using arrays and hash-based structures for O(1) lookups.',
    position: { x: 320, y: 130 },
    dependencies: ['general-concept'],
    subConcepts: [
      {
        slug: 'frequency-counting',
        title: 'Frequency Counting',
        description: 'Count occurrences of elements using hash maps. Essential for problems involving duplicates, anagrams, and element matching.',
        whenToUse: [
          'Need to count how many times each element appears',
          'Checking for duplicates or finding unique elements',
          'Comparing two collections for same element counts',
        ],
        problems: [
          {
            title: 'Contains Duplicate',
            difficulty: 'Easy',
            explanation: 'Given an array, return true if any value appears at least twice. Use a hash set to track seen elements - if we encounter one already in the set, we found a duplicate.',
            examples: [
              {
                input: 'nums = [1, 2, 3, 1]',
                output: 'true',
                explanation: 'The element 1 appears at index 0 and index 3, so there is a duplicate.',
              },
              {
                input: 'nums = [1, 2, 3, 4]',
                output: 'false',
                explanation: 'All elements are distinct, no duplicates found.',
              },
            ],
            codeLines: [
              { code: 'def containsDuplicate(nums):', explanation: 'Define function that takes a list of numbers' },
              { code: '    seen = set()', explanation: 'Create an empty set to track numbers we\'ve seen' },
              { code: '    for num in nums:', explanation: 'Iterate through each number in the array' },
              { code: '        if num in seen:', explanation: 'Check if this number was already seen (O(1) lookup)' },
              { code: '            return True', explanation: 'Found a duplicate! Return True immediately' },
              { code: '        seen.add(num)', explanation: 'Haven\'t seen this number before, add it to the set' },
              { code: '    return False', explanation: 'Checked all numbers, no duplicates found' },
            ],
            recognitionCues: [
              '"appears at least twice"',
              '"any duplicate"',
              '"distinct elements"',
            ],
            corePattern: 'Add each element to a set. Before adding, check if it already exists. Set lookup is O(1).',
            mentalChecklist: [
              'Do I need to track what I\'ve seen before? → Use a set or map',
              'Am I looking for duplicates? → Set membership check',
              'Do I need counts? → Use dict/Counter instead of set',
            ],
          },
          {
            title: 'Valid Anagram',
            difficulty: 'Easy',
            explanation: 'Given two strings, determine if t is an anagram of s. Count character frequencies in both strings and compare. If counts match, they\'re anagrams.',
            examples: [
              {
                input: 's = "anagram", t = "nagaram"',
                output: 'true',
                explanation: 'Both strings have: a=3, n=1, g=1, r=1, m=1. Same character counts.',
              },
              {
                input: 's = "rat", t = "car"',
                output: 'false',
                explanation: '"rat" has t=1 but "car" has c=1. Different characters.',
              },
            ],
            codeLines: [
              { code: 'def isAnagram(s, t):', explanation: 'Define function that takes two strings' },
              { code: '    if len(s) != len(t):', explanation: 'Quick check: anagrams must have same length' },
              { code: '        return False', explanation: 'Different lengths = cannot be anagrams' },
              { code: '    count = {}', explanation: 'Create a dictionary to count characters' },
              { code: '    for c in s:', explanation: 'Count each character in the first string' },
              { code: '        count[c] = count.get(c, 0) + 1', explanation: 'Increment count (default 0 if not seen)' },
              { code: '    for c in t:', explanation: 'Now subtract counts using the second string' },
              { code: '        count[c] = count.get(c, 0) - 1', explanation: 'Decrement count for each char in t' },
              { code: '        if count[c] < 0:', explanation: 'If count goes negative, t has extra of this char' },
              { code: '            return False', explanation: 'Not an anagram - t has char that s doesn\'t' },
              { code: '    return True', explanation: 'All counts balanced out to zero - valid anagram!' },
            ],
            recognitionCues: [
              '"anagram"',
              '"same characters"',
              '"rearrangement"',
            ],
            corePattern: 'Build frequency map for both inputs. Compare maps for equality. Counter(s) == Counter(t).',
            mentalChecklist: [
              'Are we comparing character/element counts? → Frequency map',
              'Order doesn\'t matter, only contents? → Hash-based comparison',
              'Can I use Counter for quick implementation?',
            ],
          },
        ],
      },
      {
        slug: 'hash-map-lookup',
        title: 'Hash Map for O(1) Lookup',
        description: 'Use hash maps to achieve constant-time lookups, turning O(n²) brute force into O(n) solutions.',
        whenToUse: [
          'Need to find a complement or pair that satisfies a condition',
          'Looking up previously seen values',
          'Trading space for time to avoid nested loops',
        ],
        problems: [
          {
            title: 'Two Sum',
            difficulty: 'Easy',
            explanation: 'Find indices of two numbers that add to target. For each number, calculate what complement we need (target - num). Store seen numbers with their indices. O(n) instead of O(n²).',
            examples: [
              {
                input: 'nums = [2, 7, 11, 15], target = 9',
                output: '[0, 1]',
                explanation: 'nums[0] + nums[1] = 2 + 7 = 9. Return indices [0, 1].',
              },
              {
                input: 'nums = [3, 2, 4], target = 6',
                output: '[1, 2]',
                explanation: 'nums[1] + nums[2] = 2 + 4 = 6. Return indices [1, 2].',
              },
            ],
            codeLines: [
              { code: 'def twoSum(nums, target):', explanation: 'Define function with array and target sum' },
              { code: '    seen = {}', explanation: 'Dictionary to map value → index' },
              { code: '    for i, num in enumerate(nums):', explanation: 'Loop with both index and value' },
              { code: '        complement = target - num', explanation: 'Calculate what number we need to find' },
              { code: '        if complement in seen:', explanation: 'Check if complement was seen before' },
              { code: '            return [seen[complement], i]', explanation: 'Found it! Return both indices' },
              { code: '        seen[num] = i', explanation: 'Store current number with its index' },
              { code: '    return []', explanation: 'No solution found (problem guarantees one exists)' },
            ],
            recognitionCues: [
              '"two numbers that add up to"',
              '"find pair with sum"',
              '"indices of"',
            ],
            corePattern: 'For each element, check if complement exists in map. If not, store current element. complement = target - current.',
            mentalChecklist: [
              'Am I looking for a pair that satisfies some condition? → Think complement',
              'Can I precompute what I need to find? → Store in hash map',
              'Do I need indices or values? → Map values to indices',
            ],
          },
          {
            title: 'Group Anagrams',
            difficulty: 'Medium',
            explanation: 'Group strings that are anagrams. Use sorted string as key (all anagrams sort to same string). Map sorted form to list of original strings.',
            examples: [
              {
                input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]',
                output: '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]',
                explanation: '"eat", "tea", "ate" all sort to "aet". "tan", "nat" sort to "ant". "bat" sorts to "abt".',
              },
              {
                input: 'strs = [""]',
                output: '[[""]]',
                explanation: 'Single empty string forms its own group.',
              },
            ],
            codeLines: [
              { code: 'from collections import defaultdict', explanation: 'Import defaultdict for cleaner grouping' },
              { code: 'def groupAnagrams(strs):', explanation: 'Define function that takes list of strings' },
              { code: '    groups = defaultdict(list)', explanation: 'Dict where missing keys auto-create empty lists' },
              { code: '    for s in strs:', explanation: 'Process each string' },
              { code: '        key = tuple(sorted(s))', explanation: 'Sort chars to get canonical form (anagrams → same key)' },
              { code: '        groups[key].append(s)', explanation: 'Add original string to its anagram group' },
              { code: '    return list(groups.values())', explanation: 'Return all groups as a list of lists' },
            ],
            recognitionCues: [
              '"group together"',
              '"anagrams"',
              '"categorize strings"',
            ],
            corePattern: 'Create canonical form (sorted or char count tuple) as key. Group items by their canonical key.',
            mentalChecklist: [
              'Grouping items by some equivalence? → Find canonical representation',
              'What makes items "the same"? → That becomes the key',
              'Use defaultdict(list) to collect groups',
            ],
          },
        ],
      },
      {
        slug: 'prefix-operations',
        title: 'Prefix Sum & Product',
        description: 'Precompute cumulative values to answer range queries in O(1) after O(n) preprocessing.',
        whenToUse: [
          'Multiple queries about ranges or subarrays',
          'Need sum/product of elements between indices',
          'Building results that exclude current element',
        ],
        problems: [
          {
            title: 'Product of Array Except Self',
            difficulty: 'Medium',
            explanation: 'For each index, return product of all elements except itself. Compute prefix products (left to right) and suffix products (right to left). Result[i] = prefix[i-1] * suffix[i+1].',
            examples: [
              {
                input: 'nums = [1, 2, 3, 4]',
                output: '[24, 12, 8, 6]',
                explanation: 'output[0]=2*3*4=24, output[1]=1*3*4=12, output[2]=1*2*4=8, output[3]=1*2*3=6',
              },
              {
                input: 'nums = [-1, 1, 0, -3, 3]',
                output: '[0, 0, 9, 0, 0]',
                explanation: 'Any product including 0 is 0. Only output[2] excludes the 0.',
              },
            ],
            codeLines: [
              { code: 'def productExceptSelf(nums):', explanation: 'Define function that takes array of numbers' },
              { code: '    n = len(nums)', explanation: 'Store length for convenience' },
              { code: '    result = [1] * n', explanation: 'Initialize result array with 1s' },
              { code: '    prefix = 1', explanation: 'Running product from the left' },
              { code: '    for i in range(n):', explanation: 'First pass: left to right' },
              { code: '        result[i] = prefix', explanation: 'Store product of all elements to the left' },
              { code: '        prefix *= nums[i]', explanation: 'Include current element for next iteration' },
              { code: '    suffix = 1', explanation: 'Running product from the right' },
              { code: '    for i in range(n - 1, -1, -1):', explanation: 'Second pass: right to left' },
              { code: '        result[i] *= suffix', explanation: 'Multiply by product of all elements to the right' },
              { code: '        suffix *= nums[i]', explanation: 'Include current element for next iteration' },
              { code: '    return result', explanation: 'Each position now has product of all OTHER elements' },
            ],
            recognitionCues: [
              '"except self"',
              '"all other elements"',
              '"without using division"',
            ],
            corePattern: 'Build prefix array from left, suffix from right. Combine to exclude current index.',
            mentalChecklist: [
              'Need result that combines "before" and "after" current? → Prefix + Suffix',
              'Can I precompute cumulative values? → Build prefix array first',
              'Range query multiple times? → Prefix sum preprocessing',
            ],
          },
          {
            title: 'Subarray Sum Equals K',
            difficulty: 'Medium',
            explanation: 'Count subarrays with sum equal to k. Track prefix sums and their frequencies. If current_prefix - k exists in map, we found valid subarrays.',
            examples: [
              {
                input: 'nums = [1, 1, 1], k = 2',
                output: '2',
                explanation: 'Subarrays [1,1] at indices (0,1) and (1,2) both sum to 2.',
              },
              {
                input: 'nums = [1, 2, 3], k = 3',
                output: '2',
                explanation: 'Subarray [1,2] sums to 3, and single element [3] also equals 3.',
              },
            ],
            codeLines: [
              { code: 'def subarraySum(nums, k):', explanation: 'Define function with array and target sum k' },
              { code: '    count = 0', explanation: 'Counter for valid subarrays' },
              { code: '    prefix_sum = 0', explanation: 'Running sum from index 0' },
              { code: '    seen = {0: 1}', explanation: 'Map prefix_sum → frequency. 0:1 handles subarrays starting at index 0' },
              { code: '    for num in nums:', explanation: 'Process each number' },
              { code: '        prefix_sum += num', explanation: 'Update running sum' },
              { code: '        if prefix_sum - k in seen:', explanation: 'If (prefix_sum - k) exists, subarray with sum k exists' },
              { code: '            count += seen[prefix_sum - k]', explanation: 'Add number of ways to form sum k ending here' },
              { code: '        seen[prefix_sum] = seen.get(prefix_sum, 0) + 1', explanation: 'Record this prefix sum' },
              { code: '    return count', explanation: 'Return total count of valid subarrays' },
            ],
            recognitionCues: [
              '"subarray sum equals"',
              '"count subarrays"',
              '"contiguous elements"',
            ],
            corePattern: 'prefix_sum[j] - prefix_sum[i] = sum(i+1 to j). Store prefix sum frequencies. Check if (current - k) was seen.',
            mentalChecklist: [
              'Subarray sum problem? → Think prefix sums',
              'Looking for specific sum? → Store prefix sums in map',
              'current_sum - target in map means valid subarray exists',
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'two-pointers',
    title: 'Two Pointers',
    description: 'Use two indices to traverse data in a coordinated way, achieving O(n) solutions instead of nested loops.',
    position: { x: 220, y: 260 },
    dependencies: ['arrays-hashing'],
    subConcepts: [
      {
        slug: 'opposite-ends',
        title: 'Opposite Ends (Converging)',
        description: 'Start pointers at both ends of sorted/structured data and move inward based on comparisons.',
        whenToUse: [
          'Data is sorted or has symmetric structure',
          'Comparing elements from both ends',
          'Looking for pairs with specific sum in sorted array',
        ],
        problems: [
          {
            title: 'Valid Palindrome',
            difficulty: 'Easy',
            explanation: 'Check if string is palindrome, ignoring non-alphanumeric. Use left and right pointers. Skip invalid chars, compare, move inward. If all pairs match, it\'s a palindrome.',
            examples: [
              {
                input: 's = "A man, a plan, a canal: Panama"',
                output: 'true',
                explanation: 'After removing non-alphanumeric: "amanaplanacanalpanama" reads same forwards and backwards.',
              },
              {
                input: 's = "race a car"',
                output: 'false',
                explanation: 'After cleaning: "raceacar". At index 3 we have "e" but at index 4 we have "a" - mismatch!',
              },
            ],
            codeLines: [
              { code: 'def isPalindrome(s):', explanation: 'Define function that takes a string' },
              { code: '    l, r = 0, len(s) - 1', explanation: 'Initialize left pointer at start, right at end' },
              { code: '    while l < r:', explanation: 'Continue until pointers meet in middle' },
              { code: '        while l < r and not s[l].isalnum():', explanation: 'Skip non-alphanumeric from left' },
              { code: '            l += 1', explanation: 'Move left pointer right' },
              { code: '        while l < r and not s[r].isalnum():', explanation: 'Skip non-alphanumeric from right' },
              { code: '            r -= 1', explanation: 'Move right pointer left' },
              { code: '        if s[l].lower() != s[r].lower():', explanation: 'Compare characters (case-insensitive)' },
              { code: '            return False', explanation: 'Mismatch found - not a palindrome' },
              { code: '        l, r = l + 1, r - 1', explanation: 'Move both pointers inward' },
              { code: '    return True', explanation: 'All pairs matched - it\'s a palindrome!' },
            ],
            recognitionCues: [
              '"palindrome"',
              '"reads same forward and backward"',
              '"ignore non-alphanumeric"',
            ],
            corePattern: 'l=0, r=n-1. While l<r: skip invalid, compare s[l] vs s[r], move both inward.',
            mentalChecklist: [
              'Symmetric comparison (first vs last)? → Converging pointers',
              'Why l < r not l <= r? → Stop before overlap, avoid double-processing center',
              'What to do when chars don\'t match? → Return False immediately',
            ],
          },
          {
            title: 'Two Sum II (Sorted Array)',
            difficulty: 'Medium',
            explanation: 'Find two numbers in sorted array that add to target. Use opposite pointers. Sum too small? Move left up. Sum too big? Move right down. O(n) since pointers only move inward.',
            examples: [
              {
                input: 'numbers = [2, 7, 11, 15], target = 9',
                output: '[1, 2]',
                explanation: 'numbers[0] + numbers[1] = 2 + 7 = 9. Return 1-indexed positions [1, 2].',
              },
              {
                input: 'numbers = [2, 3, 4], target = 6',
                output: '[1, 3]',
                explanation: 'numbers[0] + numbers[2] = 2 + 4 = 6. Return [1, 3].',
              },
            ],
            codeLines: [
              { code: 'def twoSum(numbers, target):', explanation: 'Define function with sorted array and target' },
              { code: '    l, r = 0, len(numbers) - 1', explanation: 'Left at start, right at end' },
              { code: '    while l < r:', explanation: 'Continue until pointers meet' },
              { code: '        curr_sum = numbers[l] + numbers[r]', explanation: 'Calculate sum of current pair' },
              { code: '        if curr_sum == target:', explanation: 'Found the target sum!' },
              { code: '            return [l + 1, r + 1]', explanation: 'Return 1-indexed positions' },
              { code: '        elif curr_sum < target:', explanation: 'Sum too small - need larger numbers' },
              { code: '            l += 1', explanation: 'Move left pointer right (larger value)' },
              { code: '        else:', explanation: 'Sum too big - need smaller numbers' },
              { code: '            r -= 1', explanation: 'Move right pointer left (smaller value)' },
              { code: '    return []', explanation: 'No solution (problem guarantees one exists)' },
            ],
            recognitionCues: [
              '"sorted array"',
              '"two numbers add up to"',
              '"pair with sum"',
            ],
            corePattern: 'l=0, r=n-1. If sum < target: l++. If sum > target: r--. Sorted property gives directional control.',
            mentalChecklist: [
              'Array is sorted + looking for pair? → Opposite-end pointers',
              'How does sorted help? → Gives monotonic control over sum',
              'Which pointer to move? → Based on whether sum is too small or too big',
            ],
          },
        ],
      },
      {
        slug: 'read-write-pointers',
        title: 'Read/Write Pointers',
        description: 'One pointer reads input, another writes valid output. For in-place filtering and compaction.',
        whenToUse: [
          'Remove elements in-place without extra space',
          'Compact or filter array in-place',
          'Move certain elements to one end',
        ],
        problems: [
          {
            title: 'Remove Element',
            difficulty: 'Easy',
            explanation: 'Remove all occurrences of val in-place, return new length. Write pointer marks next valid position. Read pointer scans everything. Copy non-val elements to write position.',
            examples: [
              {
                input: 'nums = [3, 2, 2, 3], val = 3',
                output: '2, nums = [2, 2, _, _]',
                explanation: 'Remove all 3s. Result has 2 elements. First 2 positions contain [2, 2].',
              },
              {
                input: 'nums = [0, 1, 2, 2, 3, 0, 4, 2], val = 2',
                output: '5, nums = [0, 1, 3, 0, 4, _, _, _]',
                explanation: 'Remove all 2s. Result has 5 elements.',
              },
            ],
            codeLines: [
              { code: 'def removeElement(nums, val):', explanation: 'Define function with array and value to remove' },
              { code: '    write = 0', explanation: 'Write pointer - where to place next valid element' },
              { code: '    for read in range(len(nums)):', explanation: 'Read pointer scans every element' },
              { code: '        if nums[read] != val:', explanation: 'Current element should be kept' },
              { code: '            nums[write] = nums[read]', explanation: 'Copy to write position' },
              { code: '            write += 1', explanation: 'Move write pointer forward' },
              { code: '    return write', explanation: 'Write pointer IS the new length' },
            ],
            recognitionCues: [
              '"remove in-place"',
              '"modify array"',
              '"return new length"',
            ],
            corePattern: 'write=0. For read in range(n): if nums[read] != val: nums[write] = nums[read]; write++. Return write.',
            mentalChecklist: [
              'In-place modification with filtering? → Read/write pointers',
              'What gets written? → Elements that pass the filter',
              'Return value is usually write pointer (new length)',
            ],
          },
          {
            title: 'Remove Duplicates from Sorted Array',
            difficulty: 'Easy',
            explanation: 'Remove duplicates in-place from sorted array. Write pointer tracks unique elements. Since sorted, duplicates are adjacent - only write when current differs from previous.',
            examples: [
              {
                input: 'nums = [1, 1, 2]',
                output: '2, nums = [1, 2, _]',
                explanation: 'Two unique elements. Array becomes [1, 2].',
              },
              {
                input: 'nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]',
                output: '5, nums = [0, 1, 2, 3, 4, _, _, _, _, _]',
                explanation: 'Five unique elements: 0, 1, 2, 3, 4.',
              },
            ],
            codeLines: [
              { code: 'def removeDuplicates(nums):', explanation: 'Define function with sorted array' },
              { code: '    if not nums:', explanation: 'Handle empty array edge case' },
              { code: '        return 0', explanation: 'No elements means length 0' },
              { code: '    write = 1', explanation: 'Start at 1 - first element is always unique' },
              { code: '    for read in range(1, len(nums)):', explanation: 'Scan from second element' },
              { code: '        if nums[read] != nums[read - 1]:', explanation: 'Different from previous = new unique' },
              { code: '            nums[write] = nums[read]', explanation: 'Write the unique element' },
              { code: '            write += 1', explanation: 'Move write pointer' },
              { code: '    return write', explanation: 'Return count of unique elements' },
            ],
            recognitionCues: [
              '"remove duplicates"',
              '"sorted array"',
              '"in-place"',
            ],
            corePattern: 'write=1. For read from 1: if nums[read] != nums[read-1]: nums[write] = nums[read]; write++.',
            mentalChecklist: [
              'Sorted + remove duplicates? → Compare adjacent elements',
              'Start write at 1 (first element always unique)',
              'Compare with previous, not with write position',
            ],
          },
        ],
      },
      {
        slug: 'same-direction',
        title: 'Same Direction (Fast/Slow)',
        description: 'Two pointers moving in same direction at different speeds. Used for cycle detection, finding middle, and k-th from end.',
        whenToUse: [
          'Detecting cycles in sequences',
          'Finding the middle element',
          'Locating k-th element from end in single pass',
        ],
        problems: [
          {
            title: 'Linked List Cycle',
            difficulty: 'Easy',
            explanation: 'Detect if linked list has a cycle. Slow moves 1 step, fast moves 2 steps. If cycle exists, fast will eventually catch slow. If fast reaches null, no cycle.',
            examples: [
              {
                input: 'head = [3, 2, 0, -4], pos = 1 (tail connects to node 1)',
                output: 'true',
                explanation: 'There is a cycle: -4 points back to node with value 2.',
              },
              {
                input: 'head = [1, 2], pos = -1 (no cycle)',
                output: 'false',
                explanation: 'The tail points to null, no cycle exists.',
              },
            ],
            codeLines: [
              { code: 'def hasCycle(head):', explanation: 'Define function with head of linked list' },
              { code: '    slow = fast = head', explanation: 'Both pointers start at head' },
              { code: '    while fast and fast.next:', explanation: 'Continue while fast can move 2 steps' },
              { code: '        slow = slow.next', explanation: 'Slow moves 1 step' },
              { code: '        fast = fast.next.next', explanation: 'Fast moves 2 steps' },
              { code: '        if slow == fast:', explanation: 'Pointers met - cycle detected!' },
              { code: '            return True', explanation: 'Return True for cycle' },
              { code: '    return False', explanation: 'Fast reached end - no cycle' },
            ],
            recognitionCues: [
              '"detect cycle"',
              '"circular"',
              '"linked list loop"',
            ],
            corePattern: 'slow=fast=head. While fast and fast.next: slow=slow.next, fast=fast.next.next. If slow==fast: cycle.',
            mentalChecklist: [
              'Cycle detection? → Floyd\'s fast/slow pointers',
              'Why different speeds work? → Fast gains 1 node per iteration, must catch slow if cycle',
              'Check fast AND fast.next before moving fast',
            ],
          },
          {
            title: 'Middle of Linked List',
            difficulty: 'Easy',
            explanation: 'Find middle node. When fast reaches end, slow is at middle. Fast moves 2x speed, so when fast finishes, slow is halfway.',
            examples: [
              {
                input: 'head = [1, 2, 3, 4, 5]',
                output: 'Node with value 3',
                explanation: 'List has 5 nodes. Middle is the 3rd node (value 3).',
              },
              {
                input: 'head = [1, 2, 3, 4, 5, 6]',
                output: 'Node with value 4',
                explanation: 'Even length list - return second middle node (value 4).',
              },
            ],
            codeLines: [
              { code: 'def middleNode(head):', explanation: 'Define function with head of linked list' },
              { code: '    slow = fast = head', explanation: 'Both pointers start at head' },
              { code: '    while fast and fast.next:', explanation: 'Continue while fast can move 2 steps' },
              { code: '        slow = slow.next', explanation: 'Slow moves 1 step' },
              { code: '        fast = fast.next.next', explanation: 'Fast moves 2 steps' },
              { code: '    return slow', explanation: 'When fast reaches end, slow is at middle' },
            ],
            recognitionCues: [
              '"middle element"',
              '"halfway point"',
              '"split in half"',
            ],
            corePattern: 'slow=fast=head. While fast and fast.next: slow=slow.next, fast=fast.next.next. Return slow.',
            mentalChecklist: [
              'Find middle without knowing length? → Fast/slow pointers',
              'Fast at 2x speed means slow at 1/2 position when fast ends',
              'Same pattern as cycle detection, different purpose',
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'sliding-window',
    title: 'Sliding Window',
    description: 'Maintain a window over contiguous elements, expanding and shrinking to find optimal subarrays/substrings.',
    position: { x: 380, y: 390 },
    dependencies: ['two-pointers'],
    subConcepts: [
      {
        slug: 'fixed-window',
        title: 'Fixed Size Window',
        description: 'Window of constant size k slides across the array. Add new element, remove old element.',
        whenToUse: [
          'Find max/min/average of every k consecutive elements',
          'Window size is given as parameter',
          'Process all windows of same size',
        ],
        problems: [
          {
            title: 'Maximum Average Subarray I',
            difficulty: 'Easy',
            explanation: 'Find contiguous subarray of length k with maximum average. Compute first window sum, then slide: add right element, remove left element. Track max sum seen.',
            examples: [
              {
                input: 'nums = [1, 12, -5, -6, 50, 3], k = 4',
                output: '12.75',
                explanation: 'Max average is (12 + -5 + -6 + 50) / 4 = 51 / 4 = 12.75',
              },
              {
                input: 'nums = [5], k = 1',
                output: '5.0',
                explanation: 'Only one element, so average is 5.0',
              },
            ],
            codeLines: [
              { code: 'def findMaxAverage(nums, k):', explanation: 'Define function with array and window size k' },
              { code: '    window_sum = sum(nums[:k])', explanation: 'Calculate sum of first k elements' },
              { code: '    max_sum = window_sum', explanation: 'Initialize max with first window sum' },
              { code: '    for i in range(k, len(nums)):', explanation: 'Slide window from position k onwards' },
              { code: '        window_sum += nums[i] - nums[i - k]', explanation: 'Add new element, remove old element' },
              { code: '        max_sum = max(max_sum, window_sum)', explanation: 'Update max if current window is better' },
              { code: '    return max_sum / k', explanation: 'Return average (max_sum divided by k)' },
            ],
            recognitionCues: [
              '"subarray of length k"',
              '"maximum average"',
              '"consecutive elements"',
            ],
            corePattern: 'sum = sum(first k). For i from k to n: sum += nums[i] - nums[i-k]. Track max.',
            mentalChecklist: [
              'Fixed size window over array? → Sliding window',
              'Compute first window fully, then slide incrementally',
              'Add one element, remove one element each step',
            ],
          },
          {
            title: 'Contains Duplicate II',
            difficulty: 'Easy',
            explanation: 'Check if there are two equal elements at most k indices apart. Maintain a window of size k using a set. If element already in set, found duplicate within range.',
            examples: [
              {
                input: 'nums = [1, 2, 3, 1], k = 3',
                output: 'true',
                explanation: 'nums[0] = nums[3] = 1, and |0 - 3| = 3 <= k.',
              },
              {
                input: 'nums = [1, 2, 3, 1, 2, 3], k = 2',
                output: 'false',
                explanation: 'No duplicates within distance 2.',
              },
            ],
            codeLines: [
              { code: 'def containsNearbyDuplicate(nums, k):', explanation: 'Define function with array and max distance k' },
              { code: '    window = set()', explanation: 'Set to track elements in current window' },
              { code: '    for i, num in enumerate(nums):', explanation: 'Iterate with index' },
              { code: '        if num in window:', explanation: 'Duplicate found within window!' },
              { code: '            return True', explanation: 'Return True immediately' },
              { code: '        window.add(num)', explanation: 'Add current element to window' },
              { code: '        if len(window) > k:', explanation: 'Window exceeds size k' },
              { code: '            window.remove(nums[i - k])', explanation: 'Remove oldest element from window' },
              { code: '    return False', explanation: 'No duplicates found within distance k' },
            ],
            recognitionCues: [
              '"within k positions"',
              '"at most k apart"',
              '"indices difference"',
            ],
            corePattern: 'Set of last k elements. For each element: if in set return True; add to set; if set size > k remove oldest.',
            mentalChecklist: [
              'Constraint on index distance? → Window of that size',
              'Use set for O(1) duplicate check within window',
              'Remove element that falls out of window',
            ],
          },
        ],
      },
      {
        slug: 'variable-window',
        title: 'Variable Size Window',
        description: 'Window expands with right pointer, shrinks with left pointer based on condition. Find longest/shortest valid window.',
        whenToUse: [
          'Find longest/shortest subarray satisfying condition',
          'Condition involves sum, distinct count, or character frequency',
          'Need to optimize window size',
        ],
        problems: [
          {
            title: 'Longest Substring Without Repeating Characters',
            difficulty: 'Medium',
            explanation: 'Find length of longest substring without duplicate characters. Expand right to add chars. When duplicate found, shrink left until valid. Track max length.',
            examples: [
              {
                input: 's = "abcabcbb"',
                output: '3',
                explanation: 'Longest substring is "abc" with length 3.',
              },
              {
                input: 's = "bbbbb"',
                output: '1',
                explanation: 'Longest substring is "b" with length 1.',
              },
            ],
            codeLines: [
              { code: 'def lengthOfLongestSubstring(s):', explanation: 'Define function with input string' },
              { code: '    char_set = set()', explanation: 'Set to track characters in current window' },
              { code: '    left = 0', explanation: 'Left pointer of window' },
              { code: '    max_len = 0', explanation: 'Track maximum length seen' },
              { code: '    for right in range(len(s)):', explanation: 'Right pointer expands window' },
              { code: '        while s[right] in char_set:', explanation: 'Duplicate found - shrink window' },
              { code: '            char_set.remove(s[left])', explanation: 'Remove leftmost character' },
              { code: '            left += 1', explanation: 'Move left pointer right' },
              { code: '        char_set.add(s[right])', explanation: 'Add new character to window' },
              { code: '        max_len = max(max_len, right - left + 1)', explanation: 'Update max length' },
              { code: '    return max_len', explanation: 'Return longest substring length' },
            ],
            recognitionCues: [
              '"longest substring"',
              '"without repeating"',
              '"no duplicates"',
            ],
            corePattern: 'Set for window chars. Expand right, add char. While duplicate: remove s[left], shrink. Update max length.',
            mentalChecklist: [
              'Longest valid substring? → Variable sliding window',
              'What makes window invalid? → Duplicate character',
              'Shrink until valid, then expand again',
            ],
          },
          {
            title: 'Minimum Size Subarray Sum',
            difficulty: 'Medium',
            explanation: 'Find shortest subarray with sum >= target. Expand to increase sum. When sum >= target, record length and shrink to find smaller valid window.',
            examples: [
              {
                input: 'target = 7, nums = [2, 3, 1, 2, 4, 3]',
                output: '2',
                explanation: 'Subarray [4, 3] has sum 7 and length 2 (minimum).',
              },
              {
                input: 'target = 11, nums = [1, 1, 1, 1, 1, 1, 1, 1]',
                output: '0',
                explanation: 'No subarray sums to 11 or more.',
              },
            ],
            codeLines: [
              { code: 'def minSubArrayLen(target, nums):', explanation: 'Define function with target and array' },
              { code: '    left = 0', explanation: 'Left pointer of window' },
              { code: '    curr_sum = 0', explanation: 'Current window sum' },
              { code: '    min_len = float("inf")', explanation: 'Initialize to infinity (looking for minimum)' },
              { code: '    for right in range(len(nums)):', explanation: 'Right pointer expands window' },
              { code: '        curr_sum += nums[right]', explanation: 'Add new element to sum' },
              { code: '        while curr_sum >= target:', explanation: 'Window is valid - try to shrink' },
              { code: '            min_len = min(min_len, right - left + 1)', explanation: 'Update minimum length' },
              { code: '            curr_sum -= nums[left]', explanation: 'Remove left element from sum' },
              { code: '            left += 1', explanation: 'Shrink window from left' },
              { code: '    return 0 if min_len == float("inf") else min_len', explanation: 'Return 0 if no valid subarray found' },
            ],
            recognitionCues: [
              '"minimum length subarray"',
              '"sum at least"',
              '"shortest"',
            ],
            corePattern: 'Expand right to grow sum. While sum >= target: update min length, shrink left.',
            mentalChecklist: [
              'Shortest valid window? → Shrink while valid, record length each time',
              'Contrast with longest: shrink while invalid vs shrink while valid',
              'Initialize min to infinity, check if ever updated',
            ],
          },
        ],
      },
      {
        slug: 'window-with-map',
        title: 'Window with Frequency Map',
        description: 'Track character/element frequencies within the window. Compare with target frequency for matching conditions.',
        whenToUse: [
          'Find permutation or anagram in string',
          'Window needs specific character composition',
          'Match window content against target pattern',
        ],
        problems: [
          {
            title: 'Permutation in String',
            difficulty: 'Medium',
            explanation: 'Check if s2 contains a permutation of s1. Sliding window of size len(s1). Track char frequencies. If window freq matches s1 freq, permutation found.',
            examples: [
              {
                input: 's1 = "ab", s2 = "eidbaooo"',
                output: 'true',
                explanation: 's2 contains "ba" which is a permutation of "ab".',
              },
              {
                input: 's1 = "ab", s2 = "eidboaoo"',
                output: 'false',
                explanation: 'No permutation of "ab" exists in s2.',
              },
            ],
            codeLines: [
              { code: 'from collections import Counter', explanation: 'Import Counter for frequency counting' },
              { code: 'def checkInclusion(s1, s2):', explanation: 'Define function with pattern s1 and text s2' },
              { code: '    if len(s1) > len(s2):', explanation: 'Pattern longer than text - impossible' },
              { code: '        return False', explanation: 'Return False early' },
              { code: '    s1_count = Counter(s1)', explanation: 'Count character frequencies in pattern' },
              { code: '    window = Counter(s2[:len(s1)])', explanation: 'Initialize window with first len(s1) chars' },
              { code: '    if window == s1_count:', explanation: 'Check if first window matches' },
              { code: '        return True', explanation: 'Found permutation!' },
              { code: '    for i in range(len(s1), len(s2)):', explanation: 'Slide window through rest of s2' },
              { code: '        window[s2[i]] += 1', explanation: 'Add new character to window' },
              { code: '        window[s2[i - len(s1)]] -= 1', explanation: 'Decrement count of char leaving window' },
              { code: '        if window[s2[i - len(s1)]] == 0:', explanation: 'Clean up zero counts' },
              { code: '            del window[s2[i - len(s1)]]', explanation: 'Remove key to match Counter equality' },
              { code: '        if window == s1_count:', explanation: 'Check if current window matches' },
              { code: '            return True', explanation: 'Found permutation!' },
              { code: '    return False', explanation: 'No permutation found' },
            ],
            recognitionCues: [
              '"permutation"',
              '"contains anagram"',
              '"rearrangement exists in"',
            ],
            corePattern: 'Build target freq map. Slide window of target size. Compare window freq with target freq.',
            mentalChecklist: [
              'Permutation/anagram in larger string? → Fixed window + freq map',
              'Window size = pattern length',
              'Match = both freq maps are equal',
            ],
          },
          {
            title: 'Minimum Window Substring',
            difficulty: 'Hard',
            explanation: 'Find smallest window in s containing all chars of t. Expand until all chars covered. Shrink to minimize while still valid. Track minimum window.',
            examples: [
              {
                input: 's = "ADOBECODEBANC", t = "ABC"',
                output: '"BANC"',
                explanation: 'Minimum window containing A, B, and C is "BANC" (length 4).',
              },
              {
                input: 's = "a", t = "aa"',
                output: '""',
                explanation: 'Need 2 "a"s but s only has 1. Return empty string.',
              },
            ],
            codeLines: [
              { code: 'from collections import Counter', explanation: 'Import Counter for frequency counting' },
              { code: 'def minWindow(s, t):', explanation: 'Define function with text s and pattern t' },
              { code: '    if not t or not s:', explanation: 'Handle empty inputs' },
              { code: '        return ""', explanation: 'Return empty string' },
              { code: '    need = Counter(t)', explanation: 'Characters we need and their counts' },
              { code: '    have = {}', explanation: 'Characters we have in current window' },
              { code: '    required = len(need)', explanation: 'Number of unique chars to satisfy' },
              { code: '    formed = 0', explanation: 'Count of chars with required frequency' },
              { code: '    left = 0', explanation: 'Left pointer' },
              { code: '    result = (float("inf"), 0, 0)', explanation: 'Track (length, left, right) of best window' },
              { code: '    for right in range(len(s)):', explanation: 'Expand window' },
              { code: '        c = s[right]', explanation: 'Current character' },
              { code: '        have[c] = have.get(c, 0) + 1', explanation: 'Add to window count' },
              { code: '        if c in need and have[c] == need[c]:', explanation: 'This char is now satisfied' },
              { code: '            formed += 1', explanation: 'Increment satisfied count' },
              { code: '        while formed == required:', explanation: 'Window is valid - try to shrink' },
              { code: '            if right - left + 1 < result[0]:', explanation: 'Found smaller valid window' },
              { code: '                result = (right - left + 1, left, right)', explanation: 'Update result' },
              { code: '            have[s[left]] -= 1', explanation: 'Remove left char from count' },
              { code: '            if s[left] in need and have[s[left]] < need[s[left]]:', explanation: 'Char no longer satisfied' },
              { code: '                formed -= 1', explanation: 'Decrement satisfied count' },
              { code: '            left += 1', explanation: 'Shrink window' },
              { code: '    return "" if result[0] == float("inf") else s[result[1]:result[2]+1]', explanation: 'Return result substring' },
            ],
            recognitionCues: [
              '"minimum window"',
              '"contains all characters"',
              '"smallest substring"',
            ],
            corePattern: 'Track how many unique chars are "satisfied" (count >= required). Expand to satisfy, shrink to minimize.',
            mentalChecklist: [
              'Contains all required chars? → Track satisfied count',
              'Expand until fully satisfied, then shrink',
              'Update answer while shrinking (looking for minimum)',
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'stack',
    title: 'Stack',
    description: 'LIFO structure for tracking state, matching pairs, and monotonic sequences.',
    position: { x: 420, y: 260 },
    dependencies: ['arrays-hashing'],
    subConcepts: [],
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    description: 'Divide and conquer on sorted/monotonic data for O(log n) search.',
    position: { x: 150, y: 390 },
    dependencies: ['two-pointers'],
    subConcepts: [],
  },
  {
    slug: 'linked-list',
    title: 'Linked List',
    description: 'Sequential data structure with O(1) insertion/deletion at known positions.',
    position: { x: 720, y: 390 },
    dependencies: ['two-pointers'],
    subConcepts: [],
  },
  {
    slug: 'trees',
    title: 'Trees',
    description: 'Hierarchical structures with recursive traversal patterns.',
    position: { x: 400, y: 520 },
    dependencies: ['binary-search', 'sliding-window', 'linked-list'],
    subConcepts: [],
  },
  {
    slug: 'tries',
    title: 'Tries',
    description: 'Prefix trees for efficient string operations and autocomplete.',
    position: { x: 150, y: 650 },
    dependencies: ['trees'],
    subConcepts: [],
  },
  {
    slug: 'backtracking',
    title: 'Backtracking',
    description: 'Explore all possibilities by making choices and undoing them.',
    position: { x: 550, y: 650 },
    dependencies: ['trees'],
    subConcepts: [],
  },
  {
    slug: 'heap',
    title: 'Heap / Priority Queue',
    description: 'Efficiently access min/max element with O(log n) insertions.',
    position: { x: 150, y: 780 },
    dependencies: ['tries'],
    subConcepts: [],
  },
  {
    slug: 'graphs',
    title: 'Graphs',
    description: 'Nodes and edges representing relationships. BFS, DFS, and connectivity.',
    position: { x: 450, y: 780 },
    dependencies: ['backtracking'],
    subConcepts: [],
  },
  {
    slug: 'dp-1d',
    title: '1-D DP',
    description: 'Dynamic programming with single dimension state.',
    position: { x: 700, y: 780 },
    dependencies: ['backtracking'],
    subConcepts: [],
  },
  {
    slug: 'intervals',
    title: 'Intervals',
    description: 'Problems involving overlapping ranges and scheduling.',
    position: { x: 50, y: 910 },
    dependencies: ['heap'],
    subConcepts: [],
  },
  {
    slug: 'greedy',
    title: 'Greedy',
    description: 'Make locally optimal choices for global optimum.',
    position: { x: 200, y: 910 },
    dependencies: ['heap'],
    subConcepts: [],
  },
  {
    slug: 'advanced-graphs',
    title: 'Advanced Graphs',
    description: 'Dijkstra, topological sort, union-find, and MST.',
    position: { x: 350, y: 910 },
    dependencies: ['graphs'],
    subConcepts: [],
  },
  {
    slug: 'dp-2d',
    title: '2-D DP',
    description: 'Dynamic programming with two-dimensional state.',
    position: { x: 550, y: 910 },
    dependencies: ['graphs', 'dp-1d'],
    subConcepts: [],
  },
  {
    slug: 'bit-manipulation',
    title: 'Bit Manipulation',
    description: 'Operations at the bit level for optimization and tricks.',
    position: { x: 750, y: 910 },
    dependencies: ['dp-1d'],
    subConcepts: [],
  },
  {
    slug: 'math-geometry',
    title: 'Math & Geometry',
    description: 'Mathematical patterns and geometric algorithms.',
    position: { x: 550, y: 1040 },
    dependencies: ['dp-2d'],
    subConcepts: [],
  },
];

export function getModuleBySlug(slug: string): ModuleContent | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getSubConceptBySlug(
  moduleSlug: string,
  subConceptSlug: string
): SubConceptContent | undefined {
  const module = getModuleBySlug(moduleSlug);
  return module?.subConcepts.find((sc) => sc.slug === subConceptSlug);
}

export function getAllModuleSlugs(): string[] {
  return MODULES.map((m) => m.slug);
}

export function getModuleSubConceptSlugs(moduleSlug: string): string[] {
  const module = getModuleBySlug(moduleSlug);
  return module?.subConcepts.map((sc) => sc.slug) || [];
}
