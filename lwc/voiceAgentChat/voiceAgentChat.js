// voiceAgentChat.js
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import sendSynchronousMessageFormat from '@salesforce/apex/ServiceAgentHTTPCallout.sendSynchronousMessageFormat';
import saveConversation from '@salesforce/apex/ChatConversationManager.saveConversation';
import loadConversation from '@salesforce/apex/ChatConversationManager.loadConversation';
import clearConversation from '@salesforce/apex/ChatConversationManager.clearConversation';
import BLUE_NEST_LOGO from '@salesforce/resourceUrl/BlueNestLogo';

export default class VoiceAgentChat extends LightningElement {
    @api recordId;
    @api selectedAgent;
    @api selectedAgentId;
    @api selectedAgentName;
    @api objectApiName;
    blueNestLogo = BLUE_NEST_LOGO;
    
    @track messages = [];
    @track inputMessage = '';
    @track isListening = false;
    @track isSpeaking = false;
    @track isProcessing = false;
    @track isSoundEnabled = true;
    @track interimTranscript = '';
    @track isHighContrast = false;
    @track showEmojiPicker = false;
    @track uploadedFiles = [];
    @track conversationId = null;
    @track isLoading = false;
    @track emojiCategories = [
        {
            name: 'Smileys & Emotion',
            emojis: [
                { code: 'smile', symbol: '😊' },
                { code: 'laugh', symbol: '😂' },
                { code: 'heart', symbol: '❤️' },
                { code: 'thumbsup', symbol: '👍' }
            ]
        },
        {
            name: 'People & Body',
            emojis: [
                { code: 'wave', symbol: '👋' },
                { code: 'clap', symbol: '👏' },
                { code: 'muscle', symbol: '💪' },
                { code: 'pray', symbol: '🙏' }
            ]
        },
        {
            name: 'Animals & Nature',
            emojis: [
                { code: 'dog', symbol: '🐶' },
                { code: 'cat', symbol: '🐱' },
                { code: 'unicorn', symbol: '🦄' },
                { code: 'sunflower', symbol: '🌻' }
            ]
        }
    ];
    
    messageIdCounter = 0;
    recognition = null;
    speechSynthesis = null;
    voices = [];
    selectedVoice = null;
    utterance = null;
    isInitialized = false;
    @track responseText = '';
    @track sequenceId = 0;
    @track showCapabilities = false;
    @track selectedFeedbackOption = null;
    @track lastFeedbackMessageId = null;
    
    // Computed properties for UI
    get isSendDisabled() {
        return !this.inputMessage.trim() || this.isProcessing;
    }
    
    get microphoneIcon() {
        return this.isListening ? 'utility:down' : 'utility:unmuted';
    }
    
    get microphoneLabel() {
        return this.isListening ? 'Stop Listening' : 'Start Listening';
    }
    
    get soundIcon() {
        return this.isSoundEnabled ? 'utility:volume_high' : 'utility:volume_off';
    }
    
    get soundLabel() {
        return this.isSoundEnabled ? 'Mute Sound' : 'Enable Sound';
    }
    
    get microphoneVariant() {
        return this.isListening ? 'brand' : 'border-filled';
    }
    
    get agentName() {
        return this.selectedAgent ? this.selectedAgent.label : 'AI Assistant';
    }
    
    get agentIcon() {
        return this.selectedAgent ? this.selectedAgent.icon : 'standard:bot';
    }
    
    connectedCallback() {
        this.initializeVoiceFeatures();
        this.loadExistingConversation();
    }
    
    disconnectedCallback() {
        this.cleanupVoiceFeatures();
    }
    
    initializeVoiceFeatures() {
        if (this.isInitialized) return;
        
        try {
            this.initSpeechRecognition();
            this.initSpeechSynthesis();
            this.isInitialized = true;
            
            // Add welcome message with the selected agent's name
            this.addAgentMessage(`Hello! I'm your ${this.agentName}. You can speak to me or type your questions.`);
            
           
        } catch (error) {
            console.error('Failed to initialize voice features:', error);
            this.showToast('Initialization Error', 'Failed to initialize voice features. Some functionality may be limited.', 'warning');
        }
    }
    
    cleanupVoiceFeatures() {
        this.stopSpeechRecognition();
        this.stopSpeech();
        this.isInitialized = false;
    }
    
    // Speech Recognition Methods
    initSpeechRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.interimTranscript = '';
            this.dispatchEvent(new CustomEvent('listeningstart'));
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }
            
            // Always update the input field with the latest transcript
            if (interim) {
                this.inputMessage = interim;
            } else if (finalTranscript) {
                this.inputMessage = finalTranscript;
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.interimTranscript = '';
            
            let errorMessage = 'Speech recognition error';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected';
                    break;
                case 'aborted':
                    errorMessage = 'Speech recognition aborted';
                    break;
                case 'audio-capture':
                    errorMessage = 'Audio capture failed';
                    break;
                case 'network':
                    errorMessage = 'Network error occurred';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Speech recognition service not allowed';
                    break;
            }
            
            this.showToast('Recognition Error', errorMessage, 'error');
            this.dispatchEvent(new CustomEvent('listeningerror', { detail: { error: event.error } }));
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.dispatchEvent(new CustomEvent('listeningend'));
            
            // Only send the message if we have a final transcript
            if (this.inputMessage.trim()) {
                this.sendMessage();
            }
        };
    }
    
    startVoiceInput() {
        if (!this.recognition) {
            this.showToast('Unsupported Feature', 'Speech recognition is not supported in this browser.', 'warning');
            return;
        }
        
        try {
            if (this.isListening) {
                this.stopSpeechRecognition();
            } else {
                this.recognition.start();
            }
        } catch (error) {
            console.error('Failed to start voice input:', error);
            this.showToast('Error', 'Failed to start voice input. Please try again.', 'error');
        }
    }
    
    stopSpeechRecognition() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Failed to stop speech recognition:', error);
            }
        }
    }
    
    // Speech Synthesis Methods
    initSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            this.isSoundEnabled = false;
            return;
        }
        
        this.speechSynthesis = window.speechSynthesis;
        
        // Get available voices
        const loadVoices = () => {
            try {
                this.voices = this.speechSynthesis.getVoices();
                if (this.voices.length > 0) {
                    // Try to find a female English voice
                    this.selectedVoice = this.voices.find(voice => 
                        voice.name.toLowerCase().includes('female') && 
                        voice.lang.startsWith('en')
                    );
                    
                    // Fallback to any English voice
                    if (!this.selectedVoice) {
                        this.selectedVoice = this.voices.find(voice => 
                            voice.lang.startsWith('en')
                        );
                    }
                    
                    // Final fallback to any available voice
                    if (!this.selectedVoice && this.voices.length > 0) {
                        this.selectedVoice = this.voices[0];
                    }
                }
            } catch (error) {
                console.error('Error loading voices:', error);
                this.showToast('Voice Error', 'Failed to load speech voices', 'warning');
            }
        };

        // Load voices immediately and also listen for the voiceschanged event
        loadVoices();
        this.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    speakText(text) {
        if (!this.speechSynthesis || !this.isSoundEnabled) return;
        
        try {
            // Cancel any ongoing speech
            this.stopSpeech();
            
            // Ensure we have a valid text to speak
            if (!text || typeof text !== 'string') {
                console.warn('Invalid text provided for speech');
                return;
            }

            // Create new utterance with error handling
            this.utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice if available
            if (this.selectedVoice) {
                this.utterance.voice = this.selectedVoice;
            }
            
            // Configure speech parameters
            this.utterance.rate = 1.0;
            this.utterance.pitch = 1.0;
            this.utterance.volume = 1.0;
            
            // Event handlers with error handling
            this.utterance.onstart = () => {
                this.isSpeaking = true;
                this.dispatchEvent(new CustomEvent('speakingstart'));
            };
            
            this.utterance.onend = () => {
                this.isSpeaking = false;
                this.dispatchEvent(new CustomEvent('speakingend'));
            };
            
            this.utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                
                // Provide more specific error messages
                let errorMessage = 'Failed to speak the message';
                if (event.error === 'not-allowed') {
                    errorMessage = 'Speech synthesis permission denied';
                } else if (event.error === 'network') {
                    errorMessage = 'Network error occurred while speaking';
                }
                
                this.showToast('Speech Error', errorMessage, 'error');
                this.dispatchEvent(new CustomEvent('speakingerror', { 
                    detail: { error: event.error }
                }));
            };

            // Attempt to speak with retry logic
            const speak = () => {
                try {
                    this.speechSynthesis.speak(this.utterance);
                } catch (error) {
                    console.error('Speech synthesis speak error:', error);
                    // If speech fails, try to reinitialize synthesis
                    setTimeout(() => {
                        this.initSpeechSynthesis();
                        this.showToast('Speech Error', 'Retrying speech synthesis...', 'info');
                        this.speechSynthesis.speak(this.utterance);
                    }, 100);
                }
            };

            speak();
            
        } catch (error) {
            console.error('Failed to initialize speech:', error);
            this.showToast('Speech Error', 'Failed to initialize speech synthesis', 'error');
            this.isSpeaking = false;
        }
    }
    
    stopSpeech() {
        if (this.speechSynthesis) {
            try {
                this.speechSynthesis.cancel();
                this.isSpeaking = false;
                this.dispatchEvent(new CustomEvent('speakingend'));
            } catch (error) {
                console.error('Failed to stop speech:', error);
            }
        }
    }
    
    // UI Event Handlers
    handleInputChange(event) {
        this.inputMessage = event.target.value;
    }
    
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    async sendMessage(overrideText, isRegeneration) {
        const userMessage = overrideText || this.inputMessage.trim();
        
        if (!userMessage || this.isProcessing) return;
        
        this.isProcessing = true;
        
        // Clear input immediately to prevent duplicate sends
        if (!overrideText) {
            this.inputMessage = '';
            this.interimTranscript = '';
            
            // Add user message to chat
            this.addUserMessage(userMessage);
        }
        
        try {
            const response = await sendSynchronousMessageFormat({
                agentId: this.selectedAgentId,
                sequenceId: ++this.sequenceId,
                messageText: userMessage,
                isRegeneration: isRegeneration || false
            });

            if (response) {
                // Add the response to chat
                this.addAgentMessage(response);
                
                // Speak the response if sound is enabled
                if (this.isSoundEnabled) {
                    this.speakText(response);
                }

                // Save the conversation after each message exchange
                await this.saveCurrentConversation();
            }
        } catch (error) {
            console.error('Error processing request:', error);
            
            // Handle specific error cases
            if (error.message && error.message.includes('busy')) {
                this.addAgentMessage('Server busy: please try again later.');
                this.showToast('Service Busy', 'The service is too busy. Please try again later.', 'warning');
            } else {
                this.addAgentMessage('I apologize, but I encountered an error processing your request. Please try again.');
            }
        } finally {
            this.isProcessing = false;
            this.scrollToBottom();
        }
    }
    
    handleCopy(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id == messageId);
        
        if (message) {
            // Copy text to clipboard
            navigator.clipboard.writeText(message.text)
                .then(() => {
                    this.showToast('Success', 'Message copied to clipboard', 'success');
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                    this.showToast('Error', 'Failed to copy to clipboard', 'error');
                });
        }
    }
    
    playMessage(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
            this.speakText(message.text);
        }
    }
    
    handleLike(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
            // Send feedback that the message was helpful
            console.log('Message marked as helpful:', message.text);
            this.showToast('Feedback Recorded', 'Message marked as helpful', 'success');
        }
    }
    
    handleDislike(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id === messageId);
        
        if (message) {
            // Toggle feedback form
            const updatedMessages = this.messages.map(msg => {
                if (msg.id === messageId) {
                    return {...msg, showFeedbackForm: !msg.showFeedbackForm};
                } else {
                    return {...msg, showFeedbackForm: false};
                }
            });
            
            this.messages = updatedMessages;
            this.lastFeedbackMessageId = messageId;
            this.selectedFeedbackOption = null;
            
            // Log basic feedback
            console.log('Message marked as not helpful:', message.text);
        }
    }
    
    toggleMicrophone() {
        if (this.isListening) {
            this.stopSpeechRecognition();
        } else {
            this.startVoiceInput();
        }
    }
    
    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        if (!this.isSoundEnabled) {
            this.stopSpeech();
        } else {
            // Try to reinitialize speech synthesis when sound is enabled
            this.initSpeechSynthesis();
        }
    }
    
    toggleHighContrast() {
        this.isHighContrast = !this.isHighContrast;
        const container = this.template.querySelector('.voice-chat-container');
        if (container) {
            if (this.isHighContrast) {
                container.classList.add('high-contrast');
            } else {
                container.classList.remove('high-contrast');
            }
        }
    }
    
    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }
    
    handleEmojiSelect(event) {
        const emoji = event.currentTarget.dataset.emoji;
        this.inputMessage += emoji;
        this.showEmojiPicker = false;
    }
    
    handleClearChatClick() {
        this.clearChatConversation();
    }
    
    handleFileButtonClick() {
        const fileInput = this.template.querySelector('.file-input');
        if (fileInput) {
            fileInput.click();
        }
    }
    
    handleFileUpload(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                this.uploadedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type
                });
            });
            this.showToast('Success', 'Files uploaded successfully', 'success');
        }
    }
    
    handleRemoveFile(event) {
        const fileName = event.currentTarget.dataset.fileName;
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
    }
    
    handleClearTextClick() {
        this.clearTextInput();
    }
    
    handleSpeakResponseClick() {
        if (this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage.isAgent) {
                this.speakText(lastMessage.text);
            }
        }
    }
    
    handleVoiceInputClick() {
        this.startVoiceInput();
    }
    
    handleSendClick() {
        this.sendMessage();
    }
    
    addUserMessage(text) {
        const message = {
            id: this.messageIdCounter++,
            text: text,
            author: 'You',
            isAgent: false,
            containerClass: 'message-container user',
            contentClass: 'message-content user'
        };
        this.messages = [...this.messages, message];
        this.scrollToBottom();
    }
    
    addAgentMessage(text) {
        const message = {
            id: this.messageIdCounter++,
            text: text,
            author: 'Assistant',
            isAgent: true,
            containerClass: 'message-container agent',
            contentClass: 'message-content agent'
        };
        this.messages = [...this.messages, message];
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const messagesContainer = this.template.querySelector('.messages-container');
        if (messagesContainer) {
            // Use requestAnimationFrame to ensure DOM updates are complete
            requestAnimationFrame(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
        }
    }
    
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
    async loadExistingConversation() {
        try {
            this.isLoading = true;
            // Generate a unique conversation ID if none exists
            if (!this.conversationId) {
                this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Load existing messages
            const savedMessages = await loadConversation({ conversationId: this.conversationId });
            if (savedMessages && savedMessages.length > 0) {
                this.messages = savedMessages.map(msg => ({
                    id: this.messageIdCounter++,
                    text: msg.text,
                    author: msg.isAgent ? 'Assistant' : 'You',
                    isAgent: msg.isAgent,
                    containerClass: msg.isAgent ? 'message-container agent' : 'message-container user',
                    contentClass: msg.isAgent ? 'message-content agent' : 'message-content user'
                }));
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.showToast('Error', 'Failed to load conversation history', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    async saveCurrentConversation() {
        try {
            const messagesToSave = this.messages.map(msg => ({
                text: msg.text,
                isAgent: msg.isAgent,
                sequenceId: msg.id
            }));

            await saveConversation({
                agentId: this.selectedAgentId,
                conversationId: this.conversationId,
                messages: messagesToSave
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
            this.showToast('Error', 'Failed to save conversation', 'error');
        }
    }
    
    async clearChatConversation() {
        try {
            if (this.conversationId) {
                await clearConversation({ conversationId: this.conversationId });
            }
            this.messages = [];
            this.messageIdCounter = 0;
            this.showToast('Success', 'Chat history cleared', 'success');
        } catch (error) {
            console.error('Error clearing conversation:', error);
            this.showToast('Error', 'Failed to clear conversation', 'error');
        }
    }
    
    clearTextInput() {
        this.inputMessage = '';
        this.interimTranscript = '';
    }
    
    showAICapabilities() {
        this.showCapabilities = true;
    }
    
    hideAICapabilities() {
        this.showCapabilities = false;
    }
    
    handleRegenerate(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id === messageId);
        
        if (message) {
            // Clone the last user message to regenerate a response
            const lastUserMessage = this.messages.filter(msg => !msg.isAgent).pop();
            
            if (lastUserMessage) {
                this.isTyping = true;
                
                // Show regeneration feedback to user
                this.addAgentMessage("I'll try to provide a better response...");
                
                // Clear the typing indicator after a short delay and send the actual request
                setTimeout(() => {
                    this.sendMessage(lastUserMessage.text, true);
                }, 1000);
            }
        }
    }
    
    handleFeedbackOption(event) {
        const option = event.currentTarget.dataset.option;
        const messageId = event.currentTarget.dataset.id;
        
        // Update selected option visual state
        this.selectedFeedbackOption = option;
        
        // Add selected class to the clicked option
        const allOptions = this.template.querySelectorAll('.feedback-option');
        allOptions.forEach(el => {
            el.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }
    
    submitFeedback(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id === messageId);
        
        if (message && this.selectedFeedbackOption) {
            // Prepare feedback data that would be sent to the server
            const feedbackData = {
                messageId: messageId,
                messageText: message.text,
                feedbackType: this.selectedFeedbackOption,
                timestamp: new Date().toISOString()
            };
            
            // Log the feedback data (in a real app, this would be sent to the server)
            console.log('Detailed feedback submitted:', feedbackData);
            
            // Hide the feedback form
            const updatedMessages = this.messages.map(msg => {
                return {...msg, showFeedbackForm: false};
            });
            
            this.messages = updatedMessages;
            
            // Show confirmation toast
            this.showToast('Feedback Submitted', 'Thank you for helping us improve', 'success');
        }
    }
    
    hideFeedbackForm(event) {
        const messageId = event.currentTarget.dataset.id;
        
        // Hide the feedback form for all messages
        const updatedMessages = this.messages.map(msg => {
            return {...msg, showFeedbackForm: false};
        });
        
        this.messages = updatedMessages;
    }
    
    showPrivacyDetails() {
        // This could open a modal or navigate to a privacy policy page
        this.showToast(
            'AI Privacy Information', 
            'Your conversations are used to train and improve our AI. Messages are stored securely, and you can request deletion at any time.', 
            'info'
        );
    }
}