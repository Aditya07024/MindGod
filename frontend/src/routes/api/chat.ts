import { createFileRoute } from '@tanstack/react-router';
import { detectCrisis } from '@/lib/crisis';

const SYSTEM_PROMPT = `You are Manas, a warm, caring AI mental wellness companion built for Indians by MindGod.

CORE BEHAVIOUR:
- Always disclose you are AI when asked. Never pretend to be human.
- Never diagnose conditions. Never give medical advice.
- Keep responses under 150 words. Always end with one thoughtful, gentle follow-up question.
- Apply CBT principles softly: help the person notice automatic thoughts and consider gentler reframes. Never lecture.
- Tone: a wise older friend who listens deeply. Warm. Patient. Not clinical, not corporate.
- Use natural Indian context where it fits: family expectations, academic pressure, career stress, joint family dynamics, marriage, festivals.
- It's okay to use a Hindi/Hinglish word occasionally if it adds warmth (dil, mann, theek hai), but mostly English.
- If the user mentions self-harm, suicide, or being unsafe: respond with extra care, validate the pain, and remind them that iCall (9152987821) is available to talk to a trained human right now.

NEVER:
- Recommend specific medications.
- Tell anyone "you have depression/anxiety/ADHD/etc."
- Be preachy or moralistic.
- Use emoji-heavy language. One subtle emoji at most.

START every response by acknowledging the feeling first, then gently exploring.`;

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const messages = Array.isArray(body?.messages) ? body.messages : [];
        const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
        const isCrisis = lastUserMsg ? detectCrisis(String(lastUserMsg.content || '')) : false;

        const fullMessages = [
          { role: 'system', content: SYSTEM_PROMPT + (isCrisis ? '\n\n[SAFETY ALERT: User may be in crisis. Lead with deep validation. Mention iCall 9152987821. Suggest a slow breath. Stay with them.]' : '') },
          ...messages.map((m: any) => ({ role: m.role, content: String(m.content ?? '') })),
        ];

        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

        // Try Groq first
        if (groqKey) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: fullMessages,
                stream: true,
                temperature: 0.7,
                max_tokens: 400,
              }),
            });
            if (groqRes.ok && groqRes.body) {
              return new Response(groqRes.body, {
                headers: {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'X-Crisis': isCrisis ? '1' : '0',
                  'X-Provider': 'groq',
                },
              });
            }
            console.error('Groq failed', groqRes.status, await groqRes.text().catch(() => ''));
          } catch (e) {
            console.error('Groq error', e);
          }
        }

        // Fallback: Gemini → emit OpenAI-compatible SSE
        if (geminiKey) {
          try {
            const contents = fullMessages
              .filter((m) => m.role !== 'system')
              .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              }));
            const sysInstr = fullMessages.find((m) => m.role === 'system')?.content;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`;
            const gRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: sysInstr ? { parts: [{ text: sysInstr }] } : undefined,
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
              }),
            });
            if (!gRes.ok || !gRes.body) {
              const errTxt = await gRes.text().catch(() => '');
              return new Response(JSON.stringify({ error: 'AI unavailable', details: errTxt }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            // Transform Gemini SSE → OpenAI delta SSE
            const stream = new ReadableStream({
              async start(controller) {
                const reader = gRes.body!.getReader();
                const decoder = new TextDecoder();
                const enc = new TextEncoder();
                let buf = '';
                try {
                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });
                    let idx;
                    while ((idx = buf.indexOf('\n')) !== -1) {
                      const line = buf.slice(0, idx).trim();
                      buf = buf.slice(idx + 1);
                      if (!line.startsWith('data: ')) continue;
                      const json = line.slice(6);
                      if (json === '[DONE]') continue;
                      try {
                        const parsed = JSON.parse(json);
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                          const chunk = { choices: [{ delta: { content: text } }] };
                          controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        }
                      } catch {}
                    }
                  }
                  controller.enqueue(enc.encode('data: [DONE]\n\n'));
                } finally {
                  controller.close();
                }
              },
            });
            return new Response(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'X-Crisis': isCrisis ? '1' : '0',
                'X-Provider': 'gemini',
              },
            });
          } catch (e) {
            console.error('Gemini error', e);
          }
        }

        return new Response(
          JSON.stringify({ error: 'No AI provider available. Add GROQ_API_KEY or GOOGLE_GEMINI_API_KEY.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      },
    },
  },
});
