/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import OpenAI from "openai";

export default {
	async fetch(request, env, ctx) {
		if (request.method === "GET") {
			return new Response("Worker is running!", { status: 200 });
		}

		if (request.method === "POST") {
			try {
				const { question } = await request.json();

				const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

				const completion = await openai.chat.completions.create({
					model: "gpt-4o-mini",
					messages: [{ role: "user", content: question }],
				});

				const answer = completion.choices?.[0]?.message?.content ?? "No answer";

				return new Response(JSON.stringify({ answer }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (err) {
				return new Response(JSON.stringify({ error: err.message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		return new Response("Method not allowed", { status: 405 });
	},
};