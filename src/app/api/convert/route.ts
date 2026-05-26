import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const DEFAULT_PROMPTS = {
  daily: 'brief, 2-3 sentences, what I did yesterday, what I\'m doing today, any blockers',
  star: 'Situation, Task, Action, Result format, show your impact and skills',
  email: 'professional, appropriate for workplace communication',
  jira: 'technical, reference IDs, action-oriented, typically 1-2 sentences',
};

export async function POST(request: Request) {
  try {
    const { chineseText, prompts } = await request.json();

    if (!chineseText?.trim()) {
      return Response.json({ error: '请输入中文描述' }, { status: 400 });
    }

    const mergedPrompts = {
      daily: prompts?.daily || DEFAULT_PROMPTS.daily,
      star: prompts?.star || DEFAULT_PROMPTS.star,
      email: prompts?.email || DEFAULT_PROMPTS.email,
      jira: prompts?.jira || DEFAULT_PROMPTS.jira,
    };

    const prompt = `You are a professional English writing assistant for software engineers. Convert the following Chinese technical work description into 4 different English versions tailored to these specific styles:

1. Daily Standup: ${mergedPrompts.daily}
2. Interview STAR: ${mergedPrompts.star}
3. Email/Slack: ${mergedPrompts.email}
4. Jira Comment: ${mergedPrompts.jira}

Chinese input: ${chineseText}

Format your response EXACTLY like this (each section on its own lines):

**Daily Standup:**
[content here]

**Interview STAR:**
[content here]

**Email/Slack:**
[content here]

**Jira Comment:**
[content here]

Do NOT include any --- separators or extra formatting. Just the headers and content.`;

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    return Response.json({ result: responseText });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: '处理失败，请检查 API 配置或重试' },
      { status: 500 }
    );
  }
}