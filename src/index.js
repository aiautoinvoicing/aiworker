import OpenAI from "openai";

export default {
    async fetch(request, env, ctx) {
        if (request.method === "GET") {
            return new Response("Worker is running!", { status: 200 });
        }

        if (request.method === "POST") {
            const body = await request.json();
            const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

            if (url.pathname === "/") {
                return await handleOttawa(body, openai);
            } else if (url.pathname === "/be") {
                return await handleBE(body, openai);
            } else if (url.pathname === "/invoice") {
                return await handleInvoice(body, openai);
            } else if (url.pathname === "/item") {
                return await handleItem(body, openai);
            } else {
                return new Response("Not found", { status: 404 });
            }
        }
        return new Response("Method not allowed", { status: 405 });
    },
};

async function handleOttawa(body, openai) {
    try {
        const { question } = body;
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


async function handleBE(body, openai) {
    const { base64_image } = body;
    if (!base64_image) return badRequest("Missing base64_image");

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "Extract business details from image and return JSON..." },
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


