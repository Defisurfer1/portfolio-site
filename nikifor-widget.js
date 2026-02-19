/**
 * Чат-бот Никифор — виджет для сайта-визитки.
 * Основа: https://github.com/evgyur/cursor-ai-chatbot
 */
(function() {
  var config = {
    consultantName: 'Никифор',
    welcomeMessage: 'Привет! Я Никифор. Могу рассказать о владельце сайта, ответить на вопросы и подсказать, как с ним связаться. О чём спросите?',
    apiUrl: '/api/chat',
    primaryColor: '#0d9488',
    chatTitle: 'Никифор'
  };

  var style = document.createElement('style');
  style.textContent = [
    '#ai-chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: system-ui, sans-serif; }',
    '#ai-chat-toggle { width: 56px; height: 56px; border-radius: 50%; background: ' + config.primaryColor + '; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }',
    '#ai-chat-toggle:hover { transform: scale(1.08); }',
    '#ai-chat-toggle svg { width: 26px; height: 26px; fill: white; }',
    '#ai-chat-window { position: absolute; bottom: 70px; right: 0; width: 360px; max-width: calc(100vw - 40px); height: 480px; background: #0f172a; border: 1px solid rgba(13, 148, 136, 0.3); border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.4); display: none; flex-direction: column; overflow: hidden; }',
    '#ai-chat-window.open { display: flex; }',
    '.ai-chat-header { background: ' + config.primaryColor + '; color: white; padding: 14px 16px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }',
    '.ai-chat-close { background: none; border: none; color: white; cursor: pointer; font-size: 22px; line-height: 1; padding: 0 4px; }',
    '.ai-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }',
    '.ai-message { max-width: 88%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }',
    '.ai-message.user { background: ' + config.primaryColor + '; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }',
    '.ai-message.assistant { background: rgba(30, 41, 59, 0.9); color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid rgba(148, 163, 184, 0.2); }',
    '.ai-message.error { background: rgba(220, 38, 38, 0.2); color: #fca5a5; font-size: 13px; }',
    '.ai-chat-input { padding: 12px; border-top: 1px solid rgba(148, 163, 184, 0.2); display: flex; gap: 8px; }',
    '.ai-chat-input input { flex: 1; padding: 10px 14px; border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 22px; outline: none; font-size: 14px; background: rgba(15, 23, 42, 0.8); color: #f1f5f9; }',
    '.ai-chat-input input:focus { border-color: ' + config.primaryColor + '; }',
    '.ai-chat-input button { width: 42px; height: 42px; border-radius: 50%; background: ' + config.primaryColor + '; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }',
    '.ai-chat-input button:disabled { opacity: 0.6; cursor: not-allowed; }',
    '.ai-chat-input button svg { width: 18px; height: 18px; fill: white; }',
    '.ai-typing { display: flex; gap: 4px; padding: 10px 14px; background: rgba(30, 41, 59, 0.9); border-radius: 14px; border-bottom-left-radius: 4px; width: fit-content; }',
    '.ai-typing span { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: nikifor-typing 1.2s infinite; }',
    '.ai-typing span:nth-child(2) { animation-delay: 0.15s; }',
    '.ai-typing span:nth-child(3) { animation-delay: 0.3s; }',
    '@keyframes nikifor-typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }'
  ].join('\n');
  document.head.appendChild(style);

  var widget = document.createElement('div');
  widget.id = 'ai-chat-widget';
  widget.innerHTML = [
    '<button type="button" id="ai-chat-toggle" aria-label="Открыть чат с Никифором">',
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    '</button>',
    '<div id="ai-chat-window">',
    '  <div class="ai-chat-header"><span id="chat-title">' + config.chatTitle + '</span><button type="button" class="ai-chat-close" aria-label="Закрыть">×</button></div>',
    '  <div class="ai-chat-messages" id="chat-messages"></div>',
    '  <div class="ai-chat-input">',
    '    <input type="text" id="user-message" placeholder="Напишите сообщение..." autocomplete="off">',
    '    <button type="button" id="send-btn" aria-label="Отправить"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
    '  </div>',
    '</div>'
  ].join('');
  document.body.appendChild(widget);

  var win = document.getElementById('ai-chat-window');
  var messagesEl = document.getElementById('chat-messages');
  var inputEl = document.getElementById('user-message');
  var sendBtn = document.getElementById('send-btn');

  function addMessage(text, role) {
    var div = document.createElement('div');
    div.className = 'ai-message ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'ai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    div.id = 'typing-' + Date.now();
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div.id;
  }

  function removeTyping(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  document.getElementById('ai-chat-toggle').onclick = function() {
    win.classList.toggle('open');
    if (win.classList.contains('open') && messagesEl.children.length === 0) {
      addMessage(config.welcomeMessage, 'assistant');
    }
  };

  document.querySelector('.ai-chat-close').onclick = function() { win.classList.remove('open'); };

  function sendMessage() {
    var message = inputEl.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    inputEl.value = '';
    sendBtn.disabled = true;
    var typingId = addTyping();
    fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    })
    .then(function(r) { return r.json().then(function(data) { return { ok: r.ok, data: data }; }); })
    .then(function(o) {
      removeTyping(typingId);
      if (o.ok) addMessage(o.data.response || 'Нет ответа', 'assistant');
      else addMessage(o.data.error || 'Ошибка запроса', 'error');
    })
    .catch(function(err) {
      removeTyping(typingId);
      addMessage('Ошибка: ' + (err.message || 'не удалось отправить'), 'error');
    })
    .then(function() { sendBtn.disabled = false; });
  }

  sendBtn.onclick = sendMessage;
  inputEl.onkeydown = function(e) { if (e.key === 'Enter') sendMessage(); };
})();
