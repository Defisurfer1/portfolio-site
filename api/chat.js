/**
 * Чат-бот Никифор — API для Vercel (MiniMax).
 * Переменная окружения: MINIMAX_API_KEY
 */

const KNOWLEDGE = `
Владелец сайта: Max Pain.
Креативный профессионал, базируется в Нью-Йорке, родился в 1972.
Контакты для связи: email max.pain@example.com; соцсети: GitHub, LinkedIn, Telegram (ссылки на сайте в блоке Контакты).
Чат-бота зовут Никифор. Он помогает посетителям узнать о владельце, обсудить вопросы и подсказывает, как связаться (email или соцсети).
`;

const SYSTEM_PROMPT = `Ты Никифор — дружелюбный чат-бот на сайте-визитке. Ты помогаешь посетителям:
1. Узнать о владельце сайта (Max Pain, креативный профессионал, Нью-Йорк).
2. Обсудить любые вопросы в рамках вежливого диалога.
3. Подсказать, как связаться: email max.pain@example.com, соцсети (GitHub, LinkedIn, Telegram) — ссылки внизу страницы.
ПРАВИЛА: отвечай кратко и по делу; не выдумывай факты; если спрашивают не по теме — вежливо направь к контактам или общим темам.`;

async function callMiniMax(apiKey, systemPrompt, userMessage) {
  const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'M2-her',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_completion_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (data?.base_resp?.status_code !== 0 && data?.base_resp?.status_code !== undefined) {
    throw new Error(data?.base_resp?.status_msg || 'MiniMax API error');
  }
  const text = data?.choices?.[0]?.message?.content ?? '';
  return text || 'Не удалось получить ответ. Попробуйте ещё раз.';
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'MINIMAX_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const { message } = await request.json();
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Нет сообщения' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const systemWithData = SYSTEM_PROMPT + '\n\nДанные о сайте:\n' + KNOWLEDGE;
      const response = await callMiniMax(apiKey, systemWithData, message);
      return new Response(JSON.stringify({ response }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || 'Ошибка сервера' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
