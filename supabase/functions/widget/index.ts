
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
};

const widgetScript = `
(function() {
  window.TalkigenWidget = {
    init: function(config) {
      const { widgetId, botName, welcomeMessage, primaryColor } = config;
      
      // Create widget container
      const container = document.createElement('div');
      container.id = 'talkigen-widget-' + widgetId;
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;font-family:sans-serif;';
      
      // Create chat button
      const button = document.createElement('button');
      button.style.cssText = \`width:60px;height:60px;border-radius:50%;border:none;background:\${primaryColor};color:white;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:24px;\`;
      button.innerHTML = '💬';
      
      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.style.cssText = 'display:none;width:350px;height:450px;background:white;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);margin-bottom:10px;flex-direction:column;';
      
      // Chat header
      const header = document.createElement('div');
      header.style.cssText = \`background:\${primaryColor};color:white;padding:16px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center;\`;
      header.innerHTML = \`<span>\${botName}</span><button onclick="this.closest('[id^=talkigen-widget]').querySelector('[data-chat-window]').style.display='none'" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;">×</button>\`;
      
      // Messages area
      const messages = document.createElement('div');
      messages.style.cssText = 'flex:1;padding:16px;overflow-y:auto;background:#f9f9f9;';
      messages.innerHTML = \`<div style="background:white;padding:12px;border-radius:8px;margin-bottom:8px;">\${welcomeMessage}</div>\`;
      
      // Input area
      const inputArea = document.createElement('div');
      inputArea.style.cssText = 'padding:16px;border-top:1px solid #eee;background:white;border-radius:0 0 12px 12px;display:flex;gap:8px;';
      
      const input = document.createElement('input');
      input.style.cssText = 'flex:1;padding:12px;border:1px solid #ddd;border-radius:6px;outline:none;';
      input.placeholder = 'Type your message...';
      
      const sendBtn = document.createElement('button');
      sendBtn.style.cssText = \`padding:12px 16px;background:\${primaryColor};color:white;border:none;border-radius:6px;cursor:pointer;\`;
      sendBtn.innerHTML = 'Send';
      
      // Assemble chat window
      chatWindow.setAttribute('data-chat-window', '');
      chatWindow.appendChild(header);
      chatWindow.appendChild(messages);
      inputArea.appendChild(input);
      inputArea.appendChild(sendBtn);
      chatWindow.appendChild(inputArea);
      
      // Assemble container
      container.appendChild(chatWindow);
      container.appendChild(button);
      document.body.appendChild(container);
      
      // Event handlers
      button.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
      };
      
      const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.style.cssText = \`background:\${primaryColor};color:white;padding:12px;border-radius:8px;margin-bottom:8px;margin-left:auto;max-width:80%;\`;
        userMsg.textContent = message;
        messages.appendChild(userMsg);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        try {
          const response = await fetch('https://rjvpzflhgwduveemjibw.supabase.co/functions/v1/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, widgetId })
          });
          
          const data = await response.json();
          
          // Add bot response
          const botMsg = document.createElement('div');
          botMsg.style.cssText = 'background:white;padding:12px;border-radius:8px;margin-bottom:8px;max-width:80%;';
          botMsg.textContent = data.response || 'Sorry, I encountered an error.';
          messages.appendChild(botMsg);
          messages.scrollTop = messages.scrollHeight;
        } catch (error) {
          console.error('Chat error:', error);
        }
      };
      
      sendBtn.onclick = sendMessage;
      input.onkeypress = (e) => e.key === 'Enter' && sendMessage();
    }
  };
})();
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(widgetScript, {
      headers: corsHeaders,
    });
  }

  return new Response('Method not allowed', { status: 405 });
});
