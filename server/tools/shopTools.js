const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { Pinecone } = require('@pinecone-database/pinecone');
const { generateEmbedding } = require('../services/aiService');
const { getDB } = require('../config/db');

/* =====================================================
   ORDER STATUS TOOL
===================================================== */

async function checkOrderStatusFunction({ orderId }) {
    try {
        const db = getDB();

        const order = await db.collection('orders').findOne({
            orderId
        });

        if (!order) {
            return `No order found with id ${orderId}`;
        }

        const itemList = order.items
            .map(item => `${item.quantity} x ${item.name}`)
            .join(', ');

        return `Order ${order.orderId} contains: ${itemList}. Current status: ${order.status}`;
    } catch (err) {
        return `Could not look up order ${orderId}: ${err.message}`;
    }
}

const checkOrderStatusTool = tool(checkOrderStatusFunction, {
    name: 'check_order_status',
    description:
        'Look up the status of a customer order by its order id. Use this when the customer asks where their order is.',
    schema: z.object({
        orderId: z
            .string()
            .describe('The order id to look up, for example ORD-1001.')
    })
});

/* =====================================================
   PINECONE SETUP
===================================================== */

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const index = pinecone.index(process.env.PINECONE_INDEX);

/* =====================================================
   PRODUCT SEARCH TOOL
===================================================== */

async function searchProductsFunction({ query }) {
    try {
        const vector = await generateEmbedding(query);

        const response = await index.query({
            vector,
            topK: 3,
            includeMetadata: true
        });

        const matches = response.matches || [];

        if (matches.length === 0) {
            return 'No products found matching that description.';
        }

        const results = matches
            .map((match, i) => {
                const meta = match.metadata || {};

                return `${i + 1}. ${meta.name || 'Unknown Product'} - ₹${meta.price || 'N/A'}`;
            })
            .join('\n');

        return `Here are the closest matching products:\n${results}`;
    } catch (err) {
        return `Product search failed: ${err.message}`;
    }
}

const searchProductsTool = tool(searchProductsFunction, {
    name: 'search_products',
    description:
        'Search the ShopMate product catalog using a natural language description. Use this when the customer asks whether a product is available or wants product recommendations.',
    schema: z.object({
        query: z
            .string()
            .describe(
                'A natural language description of what the customer is looking for, for example "wireless headphones" or "running shoes".'
            )
    })
});

/* =====================================================
   REFUND POLICY TOOL
===================================================== */

async function getRefundPolicyFunction({ question }) {
    try {
        const vector = await generateEmbedding(question);

        const response = await index.query({
            vector,
            topK: 2,
            includeMetadata: true,
            filter: {
                type: 'policy'
            }
        });

        const matches = response.matches || [];

        if (matches.length === 0) {
            return 'No relevant policy information found for that question.';
        }

        const policyText = matches
            .map(match => match.metadata?.text || '')
            .join('\n');

        return `Relevant policy information:\n\n${policyText}`;
    } catch (err) {
        return `Could not retrieve policy: ${err.message}`;
    }
}

const getRefundPolicyTool = tool(getRefundPolicyFunction, {
    name: 'get_refund_policy',
    description:
        'Retrieve the relevant section of the ShopMate refund and returns policy. Use this when the customer asks about returns, refunds, exchanges, or damaged items.',
    schema: z.object({
        question: z
            .string()
            .describe(
                'The customer question about refunds or returns, for example "Can I return a damaged item?" or "How many days do I have to return?"'
            )
    })
});

/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    checkOrderStatusTool,
    searchProductsTool,
    getRefundPolicyTool
};