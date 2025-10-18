document.addEventListener('DOMContentLoaded', () => {
    // --- 0. API Configuration ---
    // !!! IMPORTANT: Change this to your server's IP address and port !!!
    // If you are testing on your local machine, 'http://127.0.0.1:8000' is correct.
    // If you deployed to your server, it will be 'http://35.185.249.253' (or whatever your IP is)
    // If your Uvicorn is on a different port, change :8000
    const API_URL = 'http://34.83.212.69'; // <-- NEW IP

    // --- Get DOM Elements ---
    const menuToggle = document.getElementById('menuToggle');
    const sideNav = document.getElementById('sideNav');
    const appContainer = document.getElementById('appContainer');
    const inputBar = document.getElementById('inputBar');
    const promptInput = document.getElementById('promptInput');
    const sendButton = document.getElementById('sendButton');
    const chatThread = document.getElementById('chatThread');
    const welcomeScreen = document.getElementById('welcomeScreen');

    // --- 1. Mobile Side-Nav Toggle ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            appContainer.classList.toggle('side-nav-open');
        });
    }

    // --- 2. Chat Send Functionality (MODIFIED FOR API) ---
    if (inputBar) {
        // Make the submit handler asynchronous
        inputBar.addEventListener('submit', async (event) => {
            event.preventDefault(); // Stop form from reloading page
            
            const promptText = promptInput.value.trim();
            if (promptText === "") return; // Don't send empty messages

            // Hide welcome screen on first message
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }

            // 2a. Add User's message to chat thread
            addMessageToChat(promptText, 'user');

            // 2b. Clear input field and disable send button
            promptInput.value = '';
            promptInput.style.height = 'auto'; // Reset height
            sendButton.disabled = true;

            // --- 2c. INTEGRATION: Call FastAPI Backend ---
            
            // Create an empty bot message element to stream into
            const botMessageElement = document.createElement('div');
            botMessageElement.classList.add('chat-message', 'bot-message');
            chatThread.appendChild(botMessageElement);
            autoScroll();

            try {
                // Make the POST request to your API
                const response = await fetch(`${API_URL}/api/v1/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptText })
                });

                if (!response.ok) {
                    throw new Error(`API error! Status: ${response.status}`);
                }

                // Get the readable stream from the response body
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                // Read chunks from the stream
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break; // Stream finished
                    
                    // Decode the chunk (which is a Uint8Array) into text
                    const chunkText = decoder.decode(value);
                    
                    // Append the new text to the bot message
                    botMessageElement.textContent += chunkText;
                    
                    // Keep scrolling to the bottom
                    autoScroll();
                }

            } catch (error) {
                console.error("Error fetching stream:", error);
                botMessageElement.textContent = `Error: Could not connect to Rae. ${error.message}`;
                // You could add special error styling here
            } finally {
                // Re-enable the send button once the stream is done or fails
                sendButton.disabled = false;
            }
            // --- End of API Integration ---
        });
    }
    
    // --- 3. Auto-expanding Textarea ---
    if (promptInput) {
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = (promptInput.scrollHeight) + 'px';
            sendButton.disabled = promptInput.value.trim() === "";
        });
    }

    // --- Helper Function to Add Static Messages (like the user's) ---
    function addMessageToChat(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        messageElement.textContent = text;
        chatThread.appendChild(messageElement);
        autoScroll();
    }

    // --- Helper Function to Auto-Scroll ---
    function autoScroll() {
        chatThread.scrollTop = chatThread.scrollHeight;
    }
});
