
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

interface ChatRequest {
  message: string;
  widgetId: string;
  knowledgebase_id?: string;
  system_message?: string;
}

serve(async (req) => {
  console.log('Chat function called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const { message, widgetId, knowledgebase_id, system_message }: ChatRequest = await req.json();
    
    console.log('Chat request received:', { 
      message: message?.substring(0, 100) + '...', 
      widgetId, 
      knowledgebase_id,
      system_message: system_message?.substring(0, 50) + '...'
    });

    if (!message || !widgetId) {
      return new Response(JSON.stringify({ 
        error: 'Message and widgetId are required' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Forward to the n8n webhook
    const webhookUrl = 'https://services.talkigen.com/webhook/2f8bbc2f-e9d7-4c60-b789-2e3196af6f23';
    console.log('Forwarding to webhook:', webhookUrl);
    
    const webhookPayload = {
      message,
      widgetId,
      knowledgebase_id: knowledgebase_id || widgetId.replace('widget_', ''),
      system_message: system_message || 'You are a helpful assistant.',
      timestamp: new Date().toISOString()
    };
    
    console.log('Webhook payload:', webhookPayload);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      throw new Error(\`Webhook request failed with status: \${webhookResponse.status}\`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook response data:', webhookData);
    
    // Extract response from webhook data
    let botResponse = 'Sorry, I encountered an error. Please try again.';
    
    if (Array.isArray(webhookData) && webhookData.length > 0 && webhookData[0]?.output) {
      botResponse = webhookData[0].output;
    } else if (webhookData?.output) {
      botResponse = webhookData.output;
    } else if (webhookData?.response) {
      botResponse = webhookData.response;
    } else if (typeof webhookData === 'string') {
      botResponse = webhookData;
    }

    console.log('Final bot response:', botResponse.substring(0, 100) + '...');

    return new Response(JSON.stringify({ 
      response: botResponse,
      widgetId,
      success: true
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    
    return new Response(JSON.stringify({ 
      response: 'Sorry, I\\'m having trouble connecting. Please try again later.',
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
