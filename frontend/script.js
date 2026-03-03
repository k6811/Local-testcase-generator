/* === BLAST Testcase Generator – Phase 4 Script === */
(function () {
    const BACKEND_URL = "http://localhost:8000/api/generate_testcases";

    // DOM refs
    const messagesArea = document.getElementById('messages-area');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingStatus = document.getElementById('typing-status');
    const charCount = document.getElementById('char-count');
    const clearBtn = document.getElementById('clear-btn');
    const welcomeCard = document.getElementById('welcome-card');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    let messageCount = 0;
    let toastTimer = null;

    // ── Auto-resize textarea ──────────────────────────────
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';

        const len = userInput.value.length;
        charCount.textContent = `${len} / 4000`;
        sendBtn.disabled = len === 0;
    });

    // ── Enter key to send (Shift+Enter = newline) ─────────
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // ── Quick prompt buttons ──────────────────────────────
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            userInput.value = btn.dataset.prompt;
            userInput.dispatchEvent(new Event('input'));
            userInput.focus();
        });
    });

    // ── Clear chat ────────────────────────────────────────
    clearBtn.addEventListener('click', () => {
        const msgs = messagesArea.querySelectorAll('.msg-row');
        msgs.forEach(m => m.remove());
        if (!welcomeCard) {
            const wc = createWelcomeCard();
            messagesArea.prepend(wc);
        } else {
            welcomeCard.style.display = 'block';
        }
        messageCount = 0;
    });

    // ── Main send function ────────────────────────────────
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Hide welcome card on first message
        if (welcomeCard) welcomeCard.style.display = 'none';

        // Add user message
        appendMessage('user', text);
        userInput.value = '';
        userInput.style.height = 'auto';
        charCount.textContent = '0 / 4000';
        sendBtn.disabled = true;

        // Show typing indicator
        typingStatus.classList.remove('hidden');
        scrollToBottom();

        try {
            const res = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: text })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Server error ${res.status}`);
            }

            const data = await res.json();
            appendMessage('ai', data.test_cases);

        } catch (err) {
            appendError(err.message);
        } finally {
            typingStatus.classList.add('hidden');
            sendBtn.disabled = false;
            userInput.focus();
            scrollToBottom();
        }
    }

    // ── Append a chat message ─────────────────────────────
    function appendMessage(sender, content) {
        messageCount++;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const row = document.createElement('div');
        row.className = `msg-row ${sender}`;

        const isAI = sender === 'ai';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = `avatar ${isAI ? 'ai-avatar' : 'user-avatar'}`;
        avatar.textContent = isAI ? '⚡' : '👤';

        // Content wrapper
        const msgContent = document.createElement('div');
        msgContent.className = 'msg-content';

        // Meta
        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        meta.innerHTML = `<span class="msg-sender">${isAI ? 'System Pilot' : 'You'}</span><span>${now}</span>`;

        // Bubble
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${isAI ? 'ai' : 'user-msg'}`;

        if (isAI) {
            bubble.innerHTML = marked.parse(content);
        } else {
            bubble.textContent = content;
        }

        msgContent.appendChild(meta);
        msgContent.appendChild(bubble);

        // Action bar (AI messages only)
        if (isAI) {
            const actions = document.createElement('div');
            actions.className = 'msg-actions';

            const copyBtn = makeActionBtn('📋 Copy markdown', () => {
                navigator.clipboard.writeText(content).then(() => showToast('✅ Copied to clipboard!'));
            });

            actions.appendChild(copyBtn);
            msgContent.appendChild(actions);
        }

        row.appendChild(avatar);
        row.appendChild(msgContent);
        messagesArea.appendChild(row);
        scrollToBottom();
    }

    // ── Error bubble ──────────────────────────────────────
    function appendError(message) {
        const row = document.createElement('div');
        row.className = 'msg-row ai';

        const avatar = document.createElement('div');
        avatar.className = 'avatar ai-avatar';
        avatar.textContent = '⚡';

        const msgContent = document.createElement('div');
        msgContent.className = 'msg-content';

        const errDiv = document.createElement('div');
        errDiv.className = 'error-bubble';
        errDiv.innerHTML = `<span>⚠️</span><span><strong>Connection Error:</strong> ${escapeHtml(message)}<br><small>Make sure Ollama is running and the backend is live on port 8000.</small></span>`;

        msgContent.appendChild(errDiv);
        row.appendChild(avatar);
        row.appendChild(msgContent);
        messagesArea.appendChild(row);
    }

    // ── Action button factory ─────────────────────────────
    function makeActionBtn(label, onClick) {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ── Toast notification ────────────────────────────────
    function showToast(msg) {
        toastMsg.textContent = msg.replace(/^✅\s?/, '');
        toast.querySelector('.toast-icon').textContent = '✅';
        toast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
    }

    // ── Helpers ───────────────────────────────────────────
    function scrollToBottom() {
        requestAnimationFrame(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
    }

    function escapeHtml(text) {
        const el = document.createElement('div');
        el.appendChild(document.createTextNode(text));
        return el.innerHTML;
    }
})();
