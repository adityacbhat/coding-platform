import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const concepts = [
  {
    slug: 'two-pointers',
    title: 'Two Pointers',
    description: 'A technique used for searching pairs in a sorted array or processing two ends of a collection.',
    rationale: 'Use this when dealing with sorted arrays where you need to find a pair of elements that satisfy a condition, or when reversing an array/string in-place.',
    subConcepts: [
      {
        title: 'Opposite Ends',
        description: 'One pointer starts at the beginning, the other at the end. Move towards each other based on conditions.',
        example: 'Two Sum II - Input Array Is Sorted (LC 167)',
      },
      {
        title: 'Same Direction',
        description: 'Both pointers start at the beginning. One moves faster or only under certain conditions.',
        example: 'Remove Duplicates from Sorted Array (LC 26)',
      },
    ],
  },
  {
    slug: 'sliding-window',
    title: 'Sliding Window',
    description: 'A technique for finding subarrays or substrings that satisfy a condition.',
    rationale: 'Use when asked to find the longest/shortest subarray/substring with a specific property (e.g., sum, unique characters).',
    subConcepts: [
      {
        title: 'Fixed Size Window',
        description: 'Window size is constant. Slide one element at a time.',
        example: 'Find All Anagrams in a String (LC 438)',
      },
      {
        title: 'Variable Size Window',
        description: 'Window expands until condition is met, then shrinks from the left to optimize.',
        example: 'Longest Substring Without Repeating Characters (LC 3)',
      },
    ],
  },
  {
    slug: 'greedy',
    title: 'Greedy',
    description: 'Making the locally optimal choice at each step to arrive at the globally optimal solution.',
    rationale: 'Use when a locally optimal choice at each step leads to a globally optimal solution — common in interval scheduling, jump games, and activity selection.',
    subConcepts: [
      {
        title: 'Forward Greedy',
        description: 'Iterate forward, maintaining a running "best reachable" value that grows as you process each element.',
        example: 'Jump Game (LC 55)',
      },
      {
        title: 'Interval Greedy',
        description: 'Sort intervals by end time and greedily pick the earliest-ending non-overlapping interval.',
        example: 'Non-overlapping Intervals (LC 435)',
      },
    ],
  },
  {
    slug: 'dynamic-programming',
    title: 'Dynamic Programming',
    description: 'A method for solving complex problems by breaking them down into simpler subproblems.',
    rationale: 'Use when the problem has optimal substructure and overlapping subproblems.',
    subConcepts: [
      {
        title: 'Top-Down (Memoization)',
        description: 'Recursive approach with caching results.',
        example: 'Climbing Stairs (LC 70)',
      },
      {
        title: 'Bottom-Up (Tabulation)',
        description: 'Iterative approach building up from base cases.',
        example: 'Coin Change (LC 322)',
      },
    ],
  },
  {
    slug: 'hashing',
    title: 'Hashing',
    description: 'Using hash tables/dictionaries for O(1) lookups to solve problems efficiently.',
    rationale: 'Use when you need fast lookups, counting frequencies, or finding duplicates.',
    subConcepts: [
      {
        title: 'Hash Map for Lookup',
        description: 'Store values in a hash map for constant-time retrieval.',
        example: 'Two Sum (LC 1)',
      },
      {
        title: 'Frequency Counter',
        description: 'Count occurrences of elements using a hash map.',
        example: 'Valid Anagram (LC 242)',
      },
    ],
  },
  {
    slug: 'linked-list',
    title: 'Linked List',
    description: 'Problems involving singly or doubly linked list manipulation.',
    rationale: 'Use for problems requiring node manipulation, traversal, or cycle detection.',
    subConcepts: [
      {
        title: 'Two Pointers (Fast/Slow)',
        description: 'Use fast and slow pointers for cycle detection or finding middle.',
        example: 'Linked List Cycle (LC 141)',
      },
      {
        title: 'Reversal',
        description: 'Reversing all or part of a linked list.',
        example: 'Reverse Linked List (LC 206)',
      },
    ],
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    description: 'Efficiently finding elements in sorted arrays by repeatedly dividing search space in half.',
    rationale: 'Use when searching in sorted data or when you need O(log n) complexity.',
    subConcepts: [
      {
        title: 'Classic Binary Search',
        description: 'Find exact target in sorted array.',
        example: 'Binary Search (LC 704)',
      },
      {
        title: 'Search Space Reduction',
        description: 'Use binary search on answer space, not just arrays.',
        example: 'Koko Eating Bananas (LC 875)',
      },
    ],
  },
];

const companies = [
  { name: 'Google', slug: 'google' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'Meta', slug: 'meta' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Netflix', slug: 'netflix' },
  { name: 'Uber', slug: 'uber' },
  { name: 'LinkedIn', slug: 'linkedin' },
  { name: 'Twitter', slug: 'twitter' },
  { name: 'Adobe', slug: 'adobe' },
];

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    starterCodePython: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
};`,
    conceptSlugs: ['hashing'],
    companySlugs: ['google', 'amazon', 'meta', 'microsoft', 'apple'],
    testCases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1], isHidden: false },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2], isHidden: false },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1], isHidden: false },
      { input: { nums: [1, 5, 8, 3, 9], target: 12 }, expectedOutput: [3, 4], isHidden: true },
    ],
  },
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    difficulty: 'Medium',
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    starterCodePython: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
var addTwoNumbers = function(l1, l2) {
    // Your code here
};`,
    conceptSlugs: ['linked-list'],
    companySlugs: ['amazon', 'meta', 'microsoft'],
    testCases: [
      { input: { l1: [2, 4, 3], l2: [5, 6, 4] }, expectedOutput: [7, 0, 8], isHidden: false },
      { input: { l1: [0], l2: [0] }, expectedOutput: [0], isHidden: false },
      { input: { l1: [9, 9, 9], l2: [1] }, expectedOutput: [0, 0, 0, 1], isHidden: true },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    starterCodePython: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    // Your code here
};`,
    conceptSlugs: ['sliding-window', 'hashing'],
    companySlugs: ['amazon', 'meta', 'google', 'microsoft'],
    testCases: [
      { input: { s: 'abcabcbb' }, expectedOutput: 3, isHidden: false },
      { input: { s: 'bbbbb' }, expectedOutput: 1, isHidden: false },
      { input: { s: 'pwwkew' }, expectedOutput: 3, isHidden: false },
      { input: { s: '' }, expectedOutput: 0, isHidden: true },
    ],
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    starterCodePython: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {
    // Your code here
};`,
    conceptSlugs: ['binary-search'],
    companySlugs: ['google', 'amazon', 'apple'],
    testCases: [
      { input: { nums1: [1, 3], nums2: [2] }, expectedOutput: 2.0, isHidden: false },
      { input: { nums1: [1, 2], nums2: [3, 4] }, expectedOutput: 2.5, isHidden: false },
      { input: { nums1: [], nums2: [1] }, expectedOutput: 1.0, isHidden: true },
    ],
  },
  {
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    difficulty: 'Medium',
    description: 'Given a string s, return the longest palindromic substring in s.',
    starterCodePython: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    // Your code here
};`,
    conceptSlugs: ['dynamic-programming', 'two-pointers'],
    companySlugs: ['amazon', 'microsoft'],
    testCases: [
      { input: { s: 'babad' }, expectedOutput: 'bab', isHidden: false },
      { input: { s: 'cbbd' }, expectedOutput: 'bb', isHidden: false },
      { input: { s: 'a' }, expectedOutput: 'a', isHidden: true },
    ],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.',
    starterCodePython: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    // Your code here
};`,
    conceptSlugs: ['hashing'],
    companySlugs: ['amazon', 'meta', 'google'],
    testCases: [
      { input: { s: '()' }, expectedOutput: true, isHidden: false },
      { input: { s: '()[]{}' }, expectedOutput: true, isHidden: false },
      { input: { s: '(]' }, expectedOutput: false, isHidden: false },
      { input: { s: '([)]' }, expectedOutput: false, isHidden: true },
    ],
  },
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.',
    starterCodePython: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    // Your code here
};`,
    conceptSlugs: ['linked-list', 'two-pointers'],
    companySlugs: ['amazon', 'meta', 'microsoft', 'apple'],
    testCases: [
      { input: { list1: [1, 2, 4], list2: [1, 3, 4] }, expectedOutput: [1, 1, 2, 3, 4, 4], isHidden: false },
      { input: { list1: [], list2: [] }, expectedOutput: [], isHidden: false },
      { input: { list1: [], list2: [0] }, expectedOutput: [0], isHidden: true },
    ],
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
    starterCodePython: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    // Your code here
};`,
    conceptSlugs: ['two-pointers'],
    companySlugs: ['amazon', 'meta', 'google', 'microsoft'],
    testCases: [
      { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expectedOutput: 49, isHidden: false },
      { input: { height: [1, 1] }, expectedOutput: 1, isHidden: false },
      { input: { height: [4, 3, 2, 1, 4] }, expectedOutput: 16, isHidden: true },
    ],
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    starterCodePython: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    // Your code here
};`,
    conceptSlugs: ['dynamic-programming'],
    companySlugs: ['amazon', 'google', 'apple'],
    testCases: [
      { input: { n: 2 }, expectedOutput: 2, isHidden: false },
      { input: { n: 3 }, expectedOutput: 3, isHidden: false },
      { input: { n: 5 }, expectedOutput: 8, isHidden: true },
    ],
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1. You must write an algorithm with O(log n) runtime complexity.',
    starterCodePython: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    // Your code here
};`,
    conceptSlugs: ['binary-search'],
    companySlugs: ['google', 'amazon', 'meta'],
    testCases: [
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expectedOutput: 4, isHidden: false },
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expectedOutput: -1, isHidden: false },
      { input: { nums: [5], target: 5 }, expectedOutput: 0, isHidden: true },
    ],
  },
  {
    title: 'Jump Game',
    slug: 'jump-game',
    difficulty: 'Medium',
    description: `You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Return true if you can reach the last index, or false otherwise.`,
    starterCodePython: `class Solution:
    def canJump(self, nums: List[int]) -> bool:
        # Your code here
        pass`,
    starterCodeJs: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var canJump = function(nums) {
    // Your code here
};`,
    conceptSlugs: ['greedy', 'dynamic-programming'],
    companySlugs: ['amazon', 'microsoft', 'google'],
    testCases: [
      // Visible examples from the problem
      { input: { nums: [2, 3, 1, 1, 4] }, expectedOutput: true,  isHidden: false },
      { input: { nums: [3, 2, 1, 0, 4] }, expectedOutput: false, isHidden: false },
      // Extra visible test cases
      { input: { nums: [1, 0] },           expectedOutput: true,  isHidden: false },
      { input: { nums: [0] },              expectedOutput: true,  isHidden: false },
      // Hidden edge / stress cases
      { input: { nums: [0, 1] },           expectedOutput: false, isHidden: true },
      { input: { nums: [1, 1, 0, 1] },     expectedOutput: false, isHidden: true },
      { input: { nums: [2, 0, 0] },        expectedOutput: true,  isHidden: true },
      { input: { nums: [1, 2, 3, 0, 0] },  expectedOutput: true,  isHidden: true },
      { input: { nums: [5, 0, 0, 0, 0] },  expectedOutput: true,  isHidden: true },
      { input: { nums: [1, 0, 0, 0] },     expectedOutput: false, isHidden: true },
    ],
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.submission.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.problemCompany.deleteMany();
  await prisma.problemConcept.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.company.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.user.deleteMany();

  // Seed concepts
  console.log('Seeding concepts...');
  for (const concept of concepts) {
    await prisma.concept.create({
      data: {
        slug: concept.slug,
        title: concept.title,
        description: concept.description,
        rationale: concept.rationale,
        subConcepts: concept.subConcepts,
      },
    });
  }

  // Seed companies
  console.log('Seeding companies...');
  for (const company of companies) {
    await prisma.company.create({
      data: {
        name: company.name,
        slug: company.slug,
      },
    });
  }

  // Seed problems with test cases and relations
  console.log('Seeding problems...');
  for (const problem of problems) {
    const createdProblem = await prisma.problem.create({
      data: {
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        description: problem.description,
        starterCodePython: problem.starterCodePython,
        starterCodeJs: problem.starterCodeJs,
      },
    });

    // Add test cases
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      await prisma.testCase.create({
        data: {
          problemId: createdProblem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          orderIndex: i,
        },
      });
    }

    // Link concepts
    for (const conceptSlug of problem.conceptSlugs) {
      const concept = await prisma.concept.findUnique({ where: { slug: conceptSlug } });
      if (concept) {
        await prisma.problemConcept.create({
          data: {
            problemId: createdProblem.id,
            conceptId: concept.id,
          },
        });
      }
    }

    // Link companies
    for (const companySlug of problem.companySlugs) {
      const company = await prisma.company.findUnique({ where: { slug: companySlug } });
      if (company) {
        await prisma.problemCompany.create({
          data: {
            problemId: createdProblem.id,
            companyId: company.id,
          },
        });
      }
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
