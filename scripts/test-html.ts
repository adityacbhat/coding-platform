const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      content
    }
  }
`;

async function main() {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      operationName: 'questionData',
      variables: { titleSlug: 'two-sum' },
      query: QUESTION_QUERY,
    }),
  });

  const data = await response.json();
  console.log('=== RAW HTML ===');
  console.log(data.data.question.content);
}

main();
