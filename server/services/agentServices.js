require('dotenv').config();

const envApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (envApiKey) {
    process.env.GOOGLE_API_KEY = envApiKey;
} else {
    console.error('CRITICAL ERROR: GOOGLE_API_KEY or GEMINI_API_KEY is not defined in environment variables.');
}

const { createAgent } = require('langchain');

const {
    checkOrderStatusTool,
    searchProductsTool,
    getRefundPolicyTool
} = require('../tools/shopTools');

const agent = createAgent({
    model: 'google-genai:gemini-2.5-flash',

    tools: [
        checkOrderStatusTool,
        searchProductsTool,
        getRefundPolicyTool
    ],

    systemPrompt: `
You are ShopMate's AI customer support assistant.

When a customer says "hi", "hello", or "hey",
greet them and explain how you can help.

Example response:
"Hello! 👋 Welcome to ShopMate.
I can help with:
• Order Tracking
• Product Search
• Returns & Refunds

If you'd like to track an order,
please provide your order number."

Use:
- checkOrderStatusTool for order tracking
- searchProductsTool for product recommendations
- getRefundPolicyTool for refunds and return policies

Be friendly, concise, and professional.
`
});

async function runShopAgent(userMessage) {
    const result = await agent.invoke({
        messages: [
            {
                role: 'user',
                content: userMessage
            }
        ]
    });

    return String(result.messages.at(-1).content);
}

module.exports = {
    runShopAgent
};