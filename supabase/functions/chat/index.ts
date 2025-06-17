
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  widgetId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, widgetId }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, widgetId });

    // Forward to your n8n webhook
    const webhookResponse = await fetch('https://services.talkigen.com/webhook/2f8bbc2f-e9d7-4c60-b789-2e3196af6f23', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        widgetId,
        timestamp: new Date().toISOString()
      })
    });

    if (!webhookResponse.ok) {
      throw new Error('Webhook request failed');
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook response:', webhookData);
    
    // Extract response from webhook data (adjust based on your n8n response format)
    let botResponse = 'Sorry, I encountered an error. Please try again.';
    
    if (Array.isArray(webhookData) && webhookData.length > 0 && webhookData[0].output) {
      botResponse = webhookData[0].output;
    } else if (webhookData && webhookData.output) {
      botResponse = webhookData.output;
    } else if (webhookData && webhookData.response) {
      botResponse = webhookData.response;
    }

    return new Response(JSON.stringify({ 
      response: botResponse,
      widgetId 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      response: 'Sorry, I\'m having trouble connecting. Please try again later.',
      error: error.message 
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
