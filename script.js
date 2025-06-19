const GEMINI_API_KEY = "ENTER_YOUR_GEMINI_API_KEY_HERE";

const chatHistoryElement = document.getElementById("chat-history");
const chatForm = document.getElementById("chat-form");
const userInputElement = document.getElementById("user-input");
const historyList = document.getElementById("history-list");
const newChatBtn = document.getElementById("new-chat-btn");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const chatInfo = document.getElementById("chat-info");
const sidebarLogo = document.getElementById("sidebar-logo");
const playgroundBtn = document.getElementById("playground-btn");
const playgroundContainer = document.getElementById("playground-container");
const chatContainer = document.getElementById("chat-container");
const playgroundQuestionList = document.getElementById("playground-question-list");
const playgroundDetails = document.getElementById("playground-details");
const playgroundQuestionTitle = document.getElementById("playground-question-title");
const playgroundQuestionDesc = document.getElementById("playground-question-desc");
const playgroundCodeInput = document.getElementById("playground-code-input");
const revealSolutionBtn = document.getElementById("reveal-solution-btn");
const runCodeBtn = document.getElementById("run-code-btn");
const playgroundSolution = document.getElementById("playground-solution");
const playgroundCodeOutput = document.getElementById("playground-code-output");

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const systemInstruction = {
    role: "model",
    parts: [{
        text: `You are a Data Structures and Algorithms chatbot called DSA-Bot.
        If a user asks a question or provides code related to DSA (Data Structures, Algorithms, coding problems, etc.), give a helpful, clear, and concise answer.
        If the question is not related to DSA, politely remind the user to ask only DSA-related questions.
        If the user provides code, analyze it and give feedback, suggestions, or explanations as appropriate.`
    }]
};

let conversations = JSON.parse(localStorage.getItem('dsaChatConversations')) || [];
let currentConversationId = null;

function createNewConversation() {
    const current = getCurrentConversation();
    if (current && current.messages.length === 1 && current.messages[0].role === 'model') {
        return;
    }
    const newConversation = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [systemInstruction],
        timestamp: new Date().toISOString()
    };
    conversations.unshift(newConversation);
    currentConversationId = newConversation.id;
    saveConversations();
    renderHistoryList();
    renderCurrentConversation();
}

function getCurrentConversation() {
    return conversations.find(conv => conv.id === currentConversationId) || null;
}

function updateConversationTitle(firstMessage) {
    const conversation = getCurrentConversation();
    if (conversation && conversation.title === "New Chat") {
        conversation.title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? "..." : "");
        saveConversations();
        renderHistoryList();
    }
}

function renderHistoryList() {
    historyList.innerHTML = '';
    conversations.forEach((conv, idx) => {
        const historyItem = document.createElement("div");
        historyItem.classList.add("history-item");
        if (conv.id === currentConversationId) {
            historyItem.classList.add("active");
        }

        historyItem.innerHTML = `
            <span class="material-icons">chat</span>
            <span class="history-title">${conv.title}</span>
            <button class="delete-chat" title="Delete chat" tabindex="-1">
                <span class="material-icons">delete</span>
            </button>
        `;

        historyItem.addEventListener("click", (e) => {
            if (e.target.closest('.delete-chat')) return;
            currentConversationId = conv.id;
            renderCurrentConversation();
            renderHistoryList();
        });

        const deleteBtn = historyItem.querySelector('.delete-chat');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (conversations.length === 1) {
                alert('At least one chat must remain.');
                return;
            }
            const wasActive = conv.id === currentConversationId;
            conversations.splice(idx, 1);
            if (wasActive) {
                currentConversationId = conversations[0].id;
                renderCurrentConversation();
            }
            saveConversations();
            renderHistoryList();
        });

        historyList.appendChild(historyItem);
    });
}

function renderCurrentConversation() {
    const conversation = getCurrentConversation();
    if (!conversation) return;
    
    chatHistoryElement.innerHTML = '';
    conversation.messages.forEach((message, idx) => {
        if (idx === 0 && message.role === 'model') return;
        if (message.role === 'user') {
            addMessageToDOM(message.parts[0].text, 'user');
        } else if (message.role === 'model') {
            addMessageToDOM(message.parts[0].text, 'bot');
        }
    });
}

function addMessageToDOM(text, sender, type = '') {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    if (type) {
        messageElement.classList.add(type);
    }
    if (sender === 'bot') {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>'); 
        html = html.replace(/(<br>|<p>)?\s*\* (.*?)(?=<br>|<p>|$)/g, '<ul><li>$2</li></ul>');
        html = html.replace(/<\/ul><ul>/g, '');
        messageElement.innerHTML = `<p>${html}</p>`;
    } else {
        messageElement.textContent = text;
    }
    chatHistoryElement.appendChild(messageElement);
    chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
}

function saveConversations() {
    localStorage.setItem('dsaChatConversations', JSON.stringify(conversations));
}

newChatBtn.addEventListener("click", createNewConversation);
if (sidebarLogo) {
    sidebarLogo.addEventListener("click", createNewConversation);
}

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

if (conversations.length === 0) {
    createNewConversation();
} else {
    currentConversationId = conversations[0].id;
    renderHistoryList();
    renderCurrentConversation();
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userQuery = userInputElement.value.trim();
    if (!userQuery) return;

    const conversation = getCurrentConversation();
    if (!conversation) return;

    addMessageToDOM(userQuery, 'user');
    conversation.messages.push({ role: "user", parts: [{ text: userQuery }] });
    userInputElement.value = "";

    if (conversation.messages.length === 2) {
        updateConversationTitle(userQuery);
    }

    const loadingElement = document.createElement("div");
    loadingElement.classList.add("message", "bot-message", "loading");
    loadingElement.textContent = "DSA-Bot is thinking...";
    chatHistoryElement.appendChild(loadingElement);
    chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents: conversation.messages })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || "An unknown API error occurred.");
        }

        const data = await response.json();
        const botResponse = data.candidates[0].content.parts[0].text;
        
        conversation.messages.push({ role: "model", parts: [{ text: botResponse }] });
        
        loadingElement.remove();
        addMessageToDOM(botResponse, 'bot');

    } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        loadingElement.remove();
        addMessageToDOM(`Error: ${error.message}`, 'bot', 'error');
    } finally {
        saveConversations();
    }
});

function setTheme(mode) {
    if (mode === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = 'light_mode';
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.textContent = 'dark_mode';
    }
    localStorage.setItem('dsaTheme', mode);
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    setTheme(isDark ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('dsaTheme') || 'light';
setTheme(savedTheme);

userInputElement.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            return;
        } else {
            event.preventDefault();
            chatForm.requestSubmit();
        }
    }
});

userInputElement.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});