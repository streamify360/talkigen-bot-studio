
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600',
};

const widgetScript = `
(function() {
  // Prevent multiple widget instances
  if (window.TalkigenWidgetLoaded) return;
  window.TalkigenWidgetLoaded = true;

  console.log('Talkigen Widget: Initializing...');

  window.TalkigenWidget = {
    init: function(config) {
      console.log('Talkigen Widget: Config received:', config);
      
      const { 
        widgetId, 
        botName = 'Chat Assistant', 
        welcomeMessage = 'Hi! How can I help you today?', 
        primaryColor = '#3B82F6',
        knowledgeBaseId = '',
        systemMessage = 'You are a helpful assistant.'
      } = config;
      
      if (!widgetId) {
        console.error('Talkigen Widget: widgetId is required');
        return;
      }
      
      // Create widget container with unique ID
      const containerId = 'talkigen-widget-' + widgetId;
      if (document.getElementById(containerId)) {
        console.log('Talkigen Widget: Already exists, skipping');
        return;
      }
      
      const container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;font-family:system-ui,-apple-system,sans-serif!important;pointer-events:auto!important;';
      
      // Create chat button
      const button = document.createElement('button');
      button.style.cssText = \`width:60px!important;height:60px!important;border-radius:50%!important;border:none!important;background:\${primaryColor}!important;color:white!important;cursor:pointer!important;box-shadow:0 4px 12px rgba(0,0,0,0.15)!important;font-size:24px!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:all 0.3s ease!important;pointer-events:auto!important;\`;
      button.innerHTML = '💬';
      button.setAttribute('aria-label', 'Open chat widget');
      button.setAttribute('type', 'button');
      
      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.style.cssText = 'display:none!important;width:350px!important;height:450px!important;background:white!important;border-radius:12px!important;box-shadow:0 8px 24px rgba(0,0,0,0.15)!important;margin-bottom:10px!important;flex-direction:column!important;overflow:hidden!important;pointer-events:auto!important;';
      
      // Chat header
      const header = document.createElement('div');
      header.style.cssText = \`background:\${primaryColor}!important;color:white!important;padding:16px!important;border-radius:12px 12px 0 0!important;display:flex!important;justify-content:space-between!important;align-items:center!important;pointer-events:auto!important;\`;
      
      const headerTitle = document.createElement('span');
      headerTitle.style.cssText = 'font-weight:600!important;';
      headerTitle.textContent = botName;
      
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'background:none!important;border:none!important;color:white!important;cursor:pointer!important;font-size:18px!important;padding:4px!important;border-radius:4px!important;pointer-events:auto!important;';
      closeBtn.innerHTML = '×';
      closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
      closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
      closeBtn.onclick = () => chatWindow.style.display = 'none';
      
      header.appendChild(headerTitle);
      header.appendChild(closeBtn);
      
      // Messages area
      const messages = document.createElement('div');
      messages.style.cssText = 'flex:1!important;padding:16px!important;overflow-y:auto!important;background:#f9f9f9!important;pointer-events:auto!important;max-height:300px!important;';
      
      // Add welcome message
      const welcomeMsg = document.createElement('div');
      welcomeMsg.style.cssText = 'background:white!important;padding:12px!important;border-radius:8px!important;margin-bottom:8px!important;box-shadow:0 1px 2px rgba(0,0,0,0.1)!important;word-wrap:break-word!important;color:#333333!important;';
      welcomeMsg.textContent = welcomeMessage;
      messages.appendChild(welcomeMsg);
      
      // Input area
      const inputArea = document.createElement('div');
      inputArea.style.cssText = 'padding:16px!important;border-top:1px solid #eee!important;background:white!important;border-radius:0 0 12px 12px!important;display:flex!important;gap:8px!important;pointer-events:auto!important;';
      
      const input = document.createElement('input');
      input.style.cssText = 'flex:1!important;padding:12px!important;border:1px solid #ddd!important;border-radius:6px!important;outline:none!important;font-size:14px!important;font-family:system-ui,-apple-system,sans-serif!important;pointer-events:auto!important;background:white!important;color:#333!important;box-sizing:border-box!important;';
      input.placeholder = 'Type your message...';
      input.setAttribute('type', 'text');
      
      const sendBtn = document.createElement('button');
      sendBtn.style.cssText = \`padding:12px 16px!important;background:\${primaryColor}!important;color:white!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:14px!important;transition:opacity 0.2s!important;pointer-events:auto!important;font-family:system-ui,-apple-system,sans-serif!important;\`;
      sendBtn.innerHTML = 'Send';
      sendBtn.setAttribute('type', 'button');
      
      // Add hover effects
      sendBtn.onmouseover = () => sendBtn.style.opacity = '0.9';
      sendBtn.onmouseout = () => sendBtn.style.opacity = '1';
      button.onmouseover = () => button.style.transform = 'scale(1.05)';
      button.onmouseout = () => button.style.transform = 'scale(1)';
      
      // Assemble chat window
      chatWindow.appendChild(header);
      chatWindow.appendChild(messages);
      inputArea.appendChild(input);
      inputArea.appendChild(sendBtn);
      chatWindow.appendChild(inputArea);
      
      // Assemble container
      container.appendChild(chatWindow);
      container.appendChild(button);
      
      // Append to body
      try {
        document.body.appendChild(container);
        console.log('Talkigen Widget: Successfully added to DOM');
      } catch (e) {
        console.error('Talkigen Widget: Error appending to body:', e);
        return;
      }
      
      // Event handlers
      button.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = chatWindow.style.display === 'flex';
        chatWindow.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
          setTimeout(() => input.focus(), 100);
        }
      };
      
      input.onfocus = function() {
        this.style.borderColor = primaryColor + '!important';
      };
      
      input.onblur = function() {
        this.style.borderColor = '#ddd!important';
      };
      
      const sendMessage = async function() {
        const message = input.value.trim();
        if (!message) return;
        
        console.log('Talkigen Widget: Sending message:', message);
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.style.cssText = \`background:\${primaryColor}!important;color:white!important;padding:12px!important;border-radius:8px!important;margin-bottom:8px!important;margin-left:auto!important;max-width:80%!important;word-wrap:break-word!important;\`;
        userMsg.textContent = message;
        messages.appendChild(userMsg);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.style.cssText = 'background:white!important;padding:12px!important;border-radius:8px!important;margin-bottom:8px!important;max-width:80%!important;box-shadow:0 1px 2px rgba(0,0,0,0.1)!important;color:#333333!important;';
        typingIndicator.innerHTML = '<div style="display:flex!important;gap:4px!important;"><div style="width:8px!important;height:8px!important;background:#ccc!important;border-radius:50%!important;animation:bounce 1.4s infinite both!important;"></div><div style="width:8px!important;height:8px!important;background:#ccc!important;border-radius:50%!important;animation:bounce 1.4s infinite both 0.2s!important;"></div><div style="width:8px!important;height:8px!important;background:#ccc!important;border-radius:50%!important;animation:bounce 1.4s infinite both 0.4s!important;"></div></div>';
        messages.appendChild(typingIndicator);
        messages.scrollTop = messages.scrollHeight;
        
        try {
          const webhookUrl = 'https://services.talkigen.com/webhook/2f8bbc2f-e9d7-4c60-b789-2e3196af6f23';
          console.log('Talkigen Widget: Calling webhook:', webhookUrl);
          
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              message: message,
              widgetId: widgetId,
              knowledgebase_id: knowledgeBaseId || widgetId.replace('widget_', ''),
              system_message: systemMessage
            })
          });
          
          console.log('Talkigen Widget: Response status:', response.status);
          
          // Remove typing indicator
          if (messages.contains(typingIndicator)) {
            messages.removeChild(typingIndicator);
          }
          
          if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
          }
          
          const data = await response.json();
          console.log('Talkigen Widget: Response data:', data);
          
          // Handle the response format
          let botResponseText = 'Sorry, I encountered an error. Please try again.';
          if (Array.isArray(data) && data.length > 0 && data[0] && data[0].output) {
            botResponseText = data[0].output;
          } else if (data && data.output) {
            botResponseText = data.output;
          } else if (data && data.response) {
            botResponseText = data.response;
          } else if (typeof data === 'string') {
            botResponseText = data;
          }
          
          console.log('Talkigen Widget: Bot response:', botResponseText);
          
          // Add bot response with proper text color
          const botMsg = document.createElement('div');
          botMsg.style.cssText = 'background:white!important;padding:12px!important;border-radius:8px!important;margin-bottom:8px!important;max-width:80%!important;word-wrap:break-word!important;box-shadow:0 1px 2px rgba(0,0,0,0.1)!important;color:#333333!important;';
          botMsg.textContent = botResponseText;
          messages.appendChild(botMsg);
          messages.scrollTop = messages.scrollHeight;
          
        } catch (error) {
          console.error('Talkigen Widget: Error:', error);
          
          // Remove typing indicator
          if (messages.contains(typingIndicator)) {
            messages.removeChild(typingIndicator);
          }
          
          const errorMessage = document.createElement('div');
          errorMessage.style.cssText = 'background:white!important;padding:12px!important;border-radius:8px!important;margin-bottom:8px!important;max-width:80%!important;box-shadow:0 1px 2px rgba(0,0,0,0.1)!important;color:#ef4444!important;';
          errorMessage.textContent = 'Sorry, I\\'m having trouble connecting. Please try again later.';
          messages.appendChild(errorMessage);
          messages.scrollTop = messages.scrollHeight;
        }
      };
      
      sendBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        sendMessage();
      };
      
      input.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          sendMessage();
        }
      };
      
      // Prevent event bubbling for the entire widget
      container.onclick = function(e) {
        e.stopPropagation();
      };
      
      // Add CSS animations
      if (!document.getElementById('talkigen-widget-styles')) {
        const style = document.createElement('style');
        style.id = 'talkigen-widget-styles';
        style.textContent = \`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        \`;
        document.head.appendChild(style);
      }
      
      console.log('Talkigen Widget: Initialization complete');
    }
  };
  
  console.log('Talkigen Widget: Script loaded successfully');
})();
`;

serve(async (req) => {
  console.log('Widget function called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    console.log('Serving widget script');
    return new Response(widgetScript, {
      headers: corsHeaders,
    });
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
});
