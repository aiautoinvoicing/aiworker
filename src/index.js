import OpenAI from "openai";
import { prompts } from "./prompts.js";

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (request.method === "GET") {
            return new Response("Worker is running!", { status: 200 });
        }

        if (request.method === "POST") {
            const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

            let body;
            try {
                body = await request.json(); // ✅ only once
            } catch {
                return new Response(
                    JSON.stringify({ error: "Invalid JSON in request body" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            if (url.pathname === "/") {
                return await handleRoot(body, openai);
            } else if (url.pathname === "/be") {
                return await handleBE(body, openai);
            } else if (url.pathname === "/client") {
                return await handleClient(body, openai);
            } else {
                return new Response("Not found", { status: 404 });
            }
        }

        return new Response("Method not allowed", { status: 405 });
    },
};

async function handleRoot(body, openai) {
    try {
        const { question } = body; // ✅ no second request.json()
        if (!question) return badRequest("Missing question");

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: question }],
        });

        const answer = completion.choices?.[0]?.message?.content ?? "No answer";
        return jsonResponse({ answer });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

function badRequest(msg) {
    return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
    });
}

function jsonResponse(obj) {
    return new Response(JSON.stringify(obj), {
        headers: { "Content-Type": "application/json" },
    });
}




async function handleBE(body, openai) {
    const { base64_image } = body;
    if (!base64_image) return badRequest("Missing base64_image");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: prompts.be },
            {
                role: "user",
                content: [
                    { type: "text", text: "extract the data in this Name Card and output into JSON" },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${base64_image}`, detail: "high" } },
                ],
            },
        ],
    });

    const data = completion.choices[0]?.message?.content ?? "{}";
    return jsonResponse({ data });
}



async function handleClient(body, openai) {
    const { base64_image } = body;
    if (!base64_image) return badRequest("Missing base64_image");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: prompts.client },
            {
                role: "user",
                content: [
                    { type: "text", text: "extract the data in this Name Card and output into JSON" },
                    { type: "image_url", image_url: { url: `data:image/png;base64,${base64_image}`, detail: "high" } },
                ],
            },
        ],
    });

    const data = completion.choices[0]?.message?.content ?? "{}";
    return jsonResponse({ data });
}