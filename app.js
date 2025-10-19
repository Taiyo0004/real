document.addEventListener('DOMContentLoaded', () => {
    // --- 0. API Configuration ---
    const API_URL = 'https://raeai.xyz'; // Your production URL

    // --- 1. Chat History Storage ---
    // This array will hold the conversation, formatted for the Gemini API
    let chatHistory = [];

    // --- Get DOM Elements ---
    const menuToggle = document.getElementById('menuToggle');
    const sideNav = document.getElementById('sideNav');
    const appContainer = document.getElementById('appContainer');
    const inputBar = document.getElementById('inputBar');
    const promptInput = document.getElementById('promptInput');
    const sendButton = document.getElementById('sendButton');
    const chatThread = document.getElementById('chatThread');
    const welcomeScreen = document.getElementById('welcomeScreen');

    // --- 2. Mobile Side-Nav Toggle ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            appContainer.classList.toggle('side-nav-open');
        });
    }

    // --- 3. Chat Send Functionality (MODIFIED FOR MEMORY) ---
    if (inputBar) {
        inputBar.addEventListener('submit', async (event) => {
            event.preventDefault();
            const promptText = promptInput.value.trim();
            if (promptText === "") return;

            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }

            // 3a. Add User's message to chat thread UI
            addMessageToChat(promptText, 'user');
            
            // 3b. Add User's message to history array
            const userPrompt = {
                role: 'user',
                parts: [{ text: promptText }]
            };
            chatHistory.push(userPrompt);

            // 3c. Clear input and disable button
            promptInput.value = '';
            promptInput.style.height = 'auto';
            sendButton.disabled = true;

            // 3d. Create bot message element and variable to hold full response
            const botMessageElement = createMessageElement('bot');
            chatThread.appendChild(botMessageElement);
            autoScroll();
            let fullBotResponse = ""; // To store the complete response for history

            try {
                // 3e. Call API with the *entire* history
                const response = await fetch(`${API_URL}/api/v1/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: chatHistory }) // Send the whole history
                });

                if (!response.ok) {
                    throw new Error(`API error! Status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunkText = decoder.decode(value);
                    fullBotResponse += chunkText; // Append chunk to full response
                    botMessageElement.textContent = fullBotResponse; // Update UI
                    autoScroll();
                }

            } catch (error) {
                console.error("Error fetching stream:", error);
                botMessageElement.textContent = `Error: Could not connect to Rae. ${error.message}`;
            } finally {
                // 3f. Add the *complete* bot response to history
                if (fullBotResponse.trim() !== "") {
                    chatHistory.push({
                        role: 'model',
                        parts: [{ text: fullBotResponse }]
                    });
                }
                // 3g. Re-enable the send button
                sendButton.disabled = false;
                promptInput.focus(); // Focus back on the input
            }
        });
    }
    
    // --- 4. Auto-expanding Textarea ---
    if (promptInput) {
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = (promptInput.scrollHeight) + 'px';
            sendButton.disabled = promptInput.value.trim() === "";
        });
    }

    // --- 5. Helper Functions ---
    function createMessageElement(sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        return messageElement;
    }

    function addMessageToChat(text, sender) {
        const messageElement = createMessageElement(sender);
        messageElement.textContent = text;
        chatThread.appendChild(messageElement);
        autoScroll();
    }

    function autoScroll() {
        chatThread.scrollTop = chatThread.scrollHeight;
    }
});
