
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

  // Chat persistence functions
  const STORAGE_KEY_PREFIX = 'talkigen_chat_';
  const STORAGE_EXPIRY_HOURS = 24;

  function saveChatMessages(widgetId, messages) {
    try {
      const data = {
        messages: messages,
        timestamp: Date.now(),
        expiry: Date.now() + (STORAGE_EXPIRY_HOURS * 60 * 60 * 1000)
      };
      localStorage.setItem(STORAGE_KEY_PREFIX + widgetId, JSON.stringify(data));
    } catch (e) {
      console.warn('Talkigen Widget: Could not save chat messages', e);
    }
  }

  function loadChatMessages(widgetId) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + widgetId);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      
      // Check if data has expired
      if (Date.now() > data.expiry) {
        localStorage.removeItem(STORAGE_KEY_PREFIX + widgetId);
        return [];
      }
      
      return data.messages || [];
    } catch (e) {
      console.warn('Talkigen Widget: Could not load chat messages', e);
      return [];
    }
  }

  function addMessageToStorage(widgetId, message) {
    const messages = loadChatMessages(widgetId);
    messages.push(message);
    saveChatMessages(widgetId, messages);
  }

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
      
      if (!knowledgeBaseId) {
        console.error('Talkigen Widget: knowledgeBaseId is required');
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
      container.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;pointer-events:auto!important;';
      
      // Create chat button
      const button = document.createElement('button');
      button.style.cssText = \`width:56px!important;height:56px!important;border-radius:50%!important;border:none!important;background:\${primaryColor}!important;color:white!important;cursor:pointer!important;box-shadow:0 8px 24px rgba(0,0,0,0.15)!important;font-size:24px!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:all 0.3s ease!important;pointer-events:auto!important;\`;
      button.innerHTML = '💬';
      button.setAttribute('aria-label', 'Open chat widget');
      button.setAttribute('type', 'button');
      
      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.style.cssText = 'display:none!important;width:320px!important;height:384px!important;background:white!important;border-radius:12px!important;box-shadow:0 8px 24px rgba(0,0,0,0.15)!important;border:1px solid #e5e7eb!important;margin-bottom:16px!important;flex-direction:column!important;overflow:hidden!important;pointer-events:auto!important;';
      
      // Chat header
      const header = document.createElement('div');
      header.style.cssText = \`background:\${primaryColor}!important;color:white!important;padding:16px!important;display:flex!important;justify-content:space-between!important;align-items:center!important;pointer-events:auto!important;\`;
      
      const headerLeft = document.createElement('div');
      headerLeft.style.cssText = 'display:flex!important;align-items:center!important;gap:8px!important;';
      
      const statusDot = document.createElement('div');
      statusDot.style.cssText = 'width:8px!important;height:8px!important;background:#10b981!important;border-radius:50%!important;';
      
      const headerTitle = document.createElement('span');
      headerTitle.style.cssText = 'font-weight:500!important;color:white!important;font-size:14px!important;';
      headerTitle.textContent = botName;
      
      headerLeft.appendChild(statusDot);
      headerLeft.appendChild(headerTitle);
      
      const headerRight = document.createElement('div');
      headerRight.style.cssText = 'display:flex!important;align-items:center!important;gap:8px!important;';
      
      const minimizeBtn = document.createElement('button');
      minimizeBtn.style.cssText = 'background:none!important;border:none!important;color:white!important;cursor:pointer!important;padding:4px!important;border-radius:4px!important;pointer-events:auto!important;opacity:0.8!important;';
      minimizeBtn.innerHTML = '−';
      minimizeBtn.onclick = () => chatWindow.style.display = 'none';
      
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'background:none!important;border:none!important;color:white!important;cursor:pointer!important;padding:4px!important;border-radius:4px!important;pointer-events:auto!important;opacity:0.8!important;';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => chatWindow.style.display = 'none';
      
      headerRight.appendChild(minimizeBtn);
      headerRight.appendChild(closeBtn);
      
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      
      // Messages area
      const messages = document.createElement('div');
      messages.style.cssText = 'flex:1!important;padding:16px!important;overflow-y:auto!important;background:#f9fafb!important;pointer-events:auto!important;max-height:280px!important;';
      
      // Load existing messages from storage
      const storedMessages = loadChatMessages(widgetId);
      
      // Function to render a message
      function renderMessage(messageData) {
        const msgContainer = document.createElement('div');
        msgContainer.style.cssText = \`display:flex!important;justify-content:\${messageData.isUser ? 'flex-end' : 'flex-start'}!important;margin-bottom:12px!important;\`;
        
        const msgContent = document.createElement('div');
        if (messageData.isUser) {
          msgContent.style.cssText = \`max-width:240px!important;padding:12px!important;border-radius:8px!important;background:\${primaryColor}!important;color:white!important;font-size:14px!important;line-height:1.4!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;word-wrap:break-word!important;\`;
        } else {
          msgContent.style.cssText = 'max-width:240px!important;padding:12px!important;border-radius:8px!important;background:white!important;border:1px solid #e5e7eb!important;color:#374151!important;font-size:14px!important;line-height:1.4!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;word-wrap:break-word!important;';
        }
        msgContent.textContent = messageData.text;
        
        msgContainer.appendChild(msgContent);
        messages.appendChild(msgContainer);
      }
      
      // Render stored messages or welcome message
      if (storedMessages.length > 0) {
        storedMessages.forEach(renderMessage);
      } else {
        // Add welcome message and save it
        const welcomeMsg = { text: welcomeMessage, isUser: false, timestamp: Date.now() };
        renderMessage(welcomeMsg);
        addMessageToStorage(widgetId, welcomeMsg);
      }
      
      // Input area
      const inputArea = document.createElement('div');
      inputArea.style.cssText = 'padding:16px!important;border-top:1px solid #e5e7eb!important;background:white!important;display:flex!important;gap:8px!important;pointer-events:auto!important;';
      
      const input = document.createElement('input');
      input.style.cssText = 'flex:1!important;padding:12px!important;border:1px solid #d1d5db!important;border-radius:6px!important;outline:none!important;font-size:14px!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;pointer-events:auto!important;background:white!important;color:#374151!important;box-sizing:border-box!important;';
      input.placeholder = 'Type your message...';
      input.setAttribute('type', 'text');
      
      const sendBtn = document.createElement('button');
      sendBtn.style.cssText = \`padding:12px 16px!important;background:\${primaryColor}!important;color:white!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:14px!important;transition:opacity 0.2s!important;pointer-events:auto!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;\`;
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
      
      // Scroll to bottom of messages
      messages.scrollTop = messages.scrollHeight;
      
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
        this.style.borderColor = '#d1d5db!important';
      };
      
      const sendMessage = async function() {
        const message = input.value.trim();
        if (!message) return;
        
        console.log('Talkigen Widget: Sending message:', message);
        
        // Create and save user message
        const userMessage = { text: message, isUser: true, timestamp: Date.now() };
        renderMessage(userMessage);
        addMessageToStorage(widgetId, userMessage);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Add typing indicator
        const typingContainer = document.createElement('div');
        typingContainer.style.cssText = 'display:flex!important;justify-content:flex-start!important;margin-bottom:12px!important;';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.style.cssText = 'max-width:240px!important;padding:12px!important;border-radius:8px!important;background:white!important;border:1px solid #e5e7eb!important;color:#374151!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important;';
        typingIndicator.innerHTML = '<div style="display:flex!important;gap:4px!important;"><div style="width:8px!important;height:8px!important;background:#9ca3af!important;border-radius:50%!important;animation:bounce 1.4s infinite both!important;"></div><div style="width:8px!important;height:8px!important;background:#9ca3af!important;border-radius:50%!important;animation:bounce 1.4s infinite both 0.2s!important;"></div><div style="width:8px!important;height:8px!important;background:#9ca3af!important;border-radius:50%!important;animation:bounce 1.4s infinite both 0.4s!important;"></div></div>';
        
        typingContainer.appendChild(typingIndicator);
        messages.appendChild(typingContainer);
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
              knowledgebase_id: knowledgeBaseId,
              system_message: systemMessage
            })
          });
          
          console.log('Talkigen Widget: Response status:', response.status);
          
          // Remove typing indicator
          if (messages.contains(typingContainer)) {
            messages.removeChild(typingContainer);
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
          
          // Create and save bot message
          const botMessage = { text: botResponseText, isUser: false, timestamp: Date.now() };
          renderMessage(botMessage);
          addMessageToStorage(widgetId, botMessage);
          
          messages.scrollTop = messages.scrollHeight;
          
        } catch (error) {
          console.error('Talkigen Widget: Error:', error);
          
          // Remove typing indicator
          if (messages.contains(typingContainer)) {
            messages.removeChild(typingContainer);
          }
          
          const errorMessage = { text: 'Sorry, I\\'m having trouble connecting. Please try again later.', isUser: false, timestamp: Date.now() };
          renderMessage(errorMessage);
          addMessageToStorage(widgetId, errorMessage);
          
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
