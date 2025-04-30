// chatInterface.js
import { LightningElement, track, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveAudioFile from '@salesforce/apex/AgentAssistantController.saveAudioFile';
import sendSynchronousMessageFormat from '@salesforce/apex/ServiceAgentHTTPCallout.sendSynchronousMessageFormat';
import getAIResponse from '@salesforce/apex/VoiceAgentController.getAIResponse';
import getAgentResponseWithContext from '@salesforce/apex/VoiceAgentController.getAgentResponseWithContext';
import { CurrentPageReference } from 'lightning/navigation';

export default class VoiceAgent extends LightningElement {
    @api recordId;
    @track selectedAgent = null;
    @track selectedAgentId = null;
    @track selectedAgentName = null;
    @track isDarkMode = false;
    @track agents = [
        {
            id: 'bluenest',
            label: 'BlueNest Agent',
            value: 'blueNestAgent',
            agentId: '0XxKj000000aP0wKAE',
            icon: 'standard:bot',
            description: 'Your primary AI assistant for real estate insights. Specializes in property matching, market analysis, and lead management.',
            isNew: false,
            isPopular: true,
            isAIPowered: false,
            capabilities: [
                'Property matching based on preferences and market trends',
                'Market trend analysis and neighborhood insights',
                'Price estimation and valuation assistance',
                'Lead qualification and scoring',
                'Automated follow-up scheduling',
                'Property comparison analytics',
                'Virtual tour coordination',
                'Document preparation and tracking',
                'Can collaborate with other agents for complex tasks',
                'Multi-language support for international clients'
            ],
            limitations: [
                'Cannot conduct actual property transactions',
                'Does not have access to all listing databases',
                'May not have the latest pricing information',
                'Cannot provide legal or financial advice',
                'Requires human verification for final decisions',
                'Limited to available data in the system',
                'Cannot make binding agreements or commitments',
                'Cannot access confidential client financial information',
                'Cannot override system security protocols',
                'Cannot modify core business rules',
                'Limited to predefined interaction patterns',
                'Cannot process payments or handle financial transactions',
                'Cannot bypass privacy and data protection regulations',
                'Cannot make subjective judgments about property conditions',
                'Cannot override human agent decisions'
            ],
            canInteractWith: ['property', 'engagement', 'transaction', 'finance']
        },
        {
            id: 'engagement',
            label: 'Engagement Agent',
            value: 'engagementAgent',
            agentId: '0XxKj000000aP5GKAU',
            icon: 'standard:people',
            description: 'Focuses on lead engagement and customer relationships. Manages follow-ups and communication with clients.',
            isNew: false,
            isPopular: false,
            isAIPowered: false,
            capabilities: [
                'Initiates personalized conversations with potential clients',
                'Qualifies leads based on preferences, budget, and timeline',
                'Schedules appointments with human agents when appropriate',
                'Maintains ongoing communication to nurture prospects',
                'Seamlessly transfers qualified leads to the Property Agent',
                'Appointment scheduling and reminders',
                'Can collaborate with Property Agent for viewings',
                'Can work with Finance Agent for affordability checks'
            ],
            limitations: [
                'Cannot replace human relationship building',
                'May miss nuanced communication cues',
                'Limited emotional intelligence',
                'Cannot make final qualification decisions',
                'Requires human approval for sensitive communications',
                'Cannot access personal contact information without consent',
                'Cannot modify customer preferences without authorization',
                'Limited to approved communication channels'               
            ],
            canInteractWith: ['bluenest', 'property', 'finance']
        },
        {
            id: 'property',
            label: 'Property Agent',
            value: 'propertyAgent',
            agentId: '0XxKj000000aP5LKAU',
            icon: 'standard:home',
            description: 'Specialized in property listings and market analysis. Provides detailed property information and coordinates virtual tours.',
            isNew: false,
            isPopular: false,
            isAIPowered: false,
            capabilities: [
                'Analyzes client preferences to recommend optimal properties',
                'Conducts virtual property tours with interactive features',
                'Provides comprehensive property information and market analysis',
                'Answers detailed questions about neighborhoods and amenities',
                'Assists with scheduling in-person viewings',
                'Can collaborate with BlueNest for lead qualification',
                'Can work with Transaction Agent for documentation'
            ],
            limitations: [
                'Cannot physically inspect properties',
                'Limited to information in the system',
                'Cannot negotiate on behalf of clients',
                'No subjective quality assessments',
                'Requires human verification for property conditions',
                'Cannot modify property listings without authorization',
                'Cannot access restricted property information',
                'Cannot override property viewing schedules',                
            ],
            canInteractWith: ['bluenest', 'transaction', 'engagement']
        },
        {
            id: 'transaction',
            label: 'Transaction Agent',
            value: 'transactionAgent',
            agentId: '0XxKj000000aP5QKAU',
            icon: 'standard:contract',
            description: 'Handles real estate transactions and documentation. Manages the entire transaction process and ensures compliance.',
            isNew: true,
            isPopular: false,
            isAIPowered: false,
            capabilities: [
                'Document preparation and tracking',
                'Timeline management and reminders',
                'Coordination between transaction parties',
                'Status updates and milestone tracking',
                'Document history and versioning',
                'Compliance checking and validation',
                'Can collaborate with Property Agent for documentation',
                'Can work with Finance Agent for payment processing'
            ],
            limitations: [
                'Not authorized to sign or execute agreements',
                'Cannot provide legal advice on contracts',
                'Limited intervention in disputes',
                'Cannot guarantee third-party actions',
                'Requires human verification for legal documents',
                'Cannot modify transaction terms without authorization',
                'Cannot access confidential transaction details',
                'Cannot override transaction security protocols',
                'Limited to approved document templates'
            ],
            canInteractWith: ['bluenest', 'property', 'finance']
        },
        {
            id: 'finance',
            label: 'Finance Agent',
            value: 'financeAgent',
            agentId: '0XxKj000000aP9xKAE',
            icon: 'standard:currency',
            description: 'Specializes in financial calculations and mortgages. Provides detailed financial analysis and payment schedules.',
            isNew: true,
            isPopular: false,
            isAIPowered: false,
            capabilities: [
                'Mortgage payment calculations',
                'Loan option comparisons',
                'Affordability analysis',
                'Payment schedule creation',
                'Financial document organization',
                'Investment return analysis',
                'Can collaborate with Transaction Agent for payments',
                'Can work with Property Agent for valuation'
            ],
            limitations: [
                'Not a licensed financial advisor',
                'Cannot access personal financial accounts',
                'No loan approval authority',
                'Cannot guarantee rate availability',
                'Requires human verification for financial advice',
                'Cannot process financial transactions',
                'Cannot access confidential financial data',
                'Cannot override financial security protocols',
                'Limited to approved calculation methods',
                'Cannot modify financial records',
                'Cannot bypass financial regulations',
                'Cannot override payment schedules',
                'Cannot access restricted financial information',
                'Cannot make binding financial commitments',
                'Cannot provide investment recommendations without approval'
            ],
            canInteractWith: ['bluenest', 'transaction', 'engagement']
        },
        {
            id: 'service',
            label: 'Service Agent',
            value: 'serviceAgent',
            agentId: '0XxKj000000aJw1KAE',
            icon: 'standard:service_crew_member',
            description: 'Manages ongoing client relationship after transaction including move-in support, maintenance requests, and renewal services.',
            isNew: false,
            isPopular: false,
            isAIPowered: false,
            capabilities: [
                'Maintenance request processing',
                'Coordinate move-in logistics and setup',
                'Process and track maintenance requests',
                'Handle tenant/owner communications',
                'Manage renewal and extension processes',
                'Service scheduling coordination',
                'Status tracking and updates',
                'Satisfaction survey management',
                'Service provider coordination'
            ],
            limitations: [
                'Cannot perform actual maintenance',
                'Limited emergency response capabilities',
                'Dependent on service provider availability',
                'Cannot assess work quality directly'
            ],
            canInteractWith: ['bluenest', 'transaction', 'engagement']
        }
    ];
    @track textInput = '';
    @track messages = [];
    @track isLoading = false;
    @track isHighContrast = false;
    @track showEmojiPicker = false;
    @track showFileUpload = false;
    @track currentUser = {
        name: 'Anand',
        avatar: 'A'
    };
    @track userMessage = '';
    @track isMenuOpen = false;
    @track voiceStatus = 'Click to start recording';
    @track isRecording = false;
    @track microphoneIcon = 'utility:microphone';
    @track sequenceId = 0;
    @track responseText = '';
    @track currentView = 'home';
    @track searchTerm = '';
    @track messageText = '';
    // Agentic design pattern properties
    @track showAIInfoModal = false;
    @track showAICapabilitiesModal = false;
    @track showAgentCapabilitiesModal = false;
    @track selectedAgentForCapabilities = null;
    @track filterAIAgentsOnly = false;
    @track aiTransparencyLevel = 'medium'; // can be 'low', 'medium', 'high'
    @track selectedAgentInfo = null;

    mediaRecorder;
    audioChunks = [];
    mediaStream = null;
    recognition = null;
    recordedText = '';
    isSpeaking = false;
    currentUtterance;

  /*  @track connectedApps = [
        {
            id: 'gcal',
            name: 'Google Calendar',
            icon: '/resource/appIcons/gcal',
            description: 'See your schedule, respond to invites, and get event updates.'
        },
        {
            id: 'zoom',
            name: 'Zoom',
            icon: '/resource/appIcons/zoom',
            description: 'Easily start a Zoom video meeting directly from Slack.'
        },
        {
            id: 'trello',
            name: 'Trello',
            icon: '/resource/appIcons/trello',
            description: 'Collaborate on Trello projects without leaving Slack.'
        }
    ]; 

    @track recommendedApps = [
        {
            id: 'gcal',
            name: 'Google Calendar',
            icon: '/resource/appIcons/gcal',
            description: 'See your schedule, respond to invites, and get event updates.'
        },
        {
            id: 'zoom',
            name: 'Zoom',
            icon: '/resource/appIcons/zoom',
            description: 'Easily start a Zoom video meeting directly from Slack.'
        },
        {
            id: 'trello',
            name: 'Trello',
            icon: '/resource/appIcons/trello',
            description: 'Collaborate on Trello projects without leaving Slack.'
        },
        {
            id: 'simplepoll',
            name: 'Simple Poll',
            icon: '/resource/appIcons/simplepoll',
            description: 'Build a winning team culture with polls and surveys, all in Slack.'
        }
    ]; */

    @track inputMessage = '';
    @track isTyping = false;
    messageIdCounter = 0;

    // AI Capabilities data for displaying in the modal
    @track aiCapabilities = [
        {
            title: 'Natural Language Understanding',
            description: 'Understands and responds to human language in a conversational manner.'
        },
        {
            title: 'Real Estate Knowledge',
            description: 'Provides information about properties, market trends, and real estate processes.'
        },
        {
            title: 'Personalized Recommendations',
            description: 'Offers tailored suggestions based on your preferences and search history.'
        },
        {
            title: 'Document Generation',
            description: 'Creates formal documents based on your requirements and transaction details.'
        },
        {
            title: 'Multi-turn Conversations',
            description: 'Maintains context through multiple exchanges for coherent dialog.'
        }
    ];

    // AI Limitations data for displaying in the modal
    @track aiLimitations = [
        {
            title: 'No Real-time Market Data',
            description: 'Information may not reflect the very latest market changes or property availability.'
        },
        {
            title: 'Limited Personal Context',
            description: 'May not remember details from previous sessions unless explicitly referenced.'
        },
        {
            title: 'No Legal Advice',
            description: 'Cannot provide legal counsel - consult a qualified attorney for legal matters.'
        },
        {
            title: 'Accuracy Not Guaranteed',
            description: 'Always verify important information with official sources or human agents.'
        }
    ];

    // Agent-specific capabilities
    @track agentCapabilities = {
        'bluenest': {
            capabilities: [
                'Property matching based on preferences',
                'Market trend analysis and insights',
                'Neighborhood information and comparisons',
                'Price estimation and valuation assistance',
                'General real estate advice and terminology explanations'
            ],
            limitations: [
                'Cannot conduct actual property transactions',
                'Does not have access to all listing databases',
                'May not have the latest pricing information',
                'Cannot provide legal or financial advice'
            ]
        },
        'engagement': {
            capabilities: [
                'Lead qualification and scoring',
                'Automated follow-up scheduling',
                'Contact information management',
                'Engagement pattern analysis',
                'Communication templates and suggestions'
            ],
            limitations: [
                'Cannot replace human relationship building',
                'May miss nuanced communication cues',
                'Limited emotional intelligence',
                'Cannot make final qualification decisions'
            ]
        },
        'property': {
            capabilities: [
                'Detailed property information retrieval',
                'Virtual tour coordination',
                'Property comparison analytics',
                'Feature and amenity highlighting',
                'Similar property recommendations'
            ],
            limitations: [
                'Cannot physically inspect properties',
                'Limited to information in the system',
                'Cannot negotiate on behalf of clients',
                'No subjective quality assessments'
            ]
        },
        'transaction': {
            capabilities: [
                'Document preparation and tracking',
                'Timeline management and reminders',
                'Coordination between transaction parties',
                'Status updates and milestone tracking',
                'Document history and versioning'
            ],
            limitations: [
                'Not authorized to sign or execute agreements',
                'Cannot provide legal advice on contracts',
                'Limited intervention in disputes',
                'Cannot guarantee third-party actions'
            ]
        },
        'service': {
            capabilities: [
                'Maintenance request processing',
                'Service scheduling coordination',
                'Status tracking and updates',
                'Satisfaction survey management',
                'Service provider coordination'
            ],
            limitations: [
                'Cannot perform actual maintenance',
                'Limited emergency response capabilities',
                'Dependent on service provider availability',
                'Cannot assess work quality directly'
            ]
        },
        'finance': {
            capabilities: [
                'Mortgage payment calculations',
                'Loan option comparisons',
                'Affordability analysis',
                'Payment schedule creation',
                'Financial document organization'
            ],
            limitations: [
                'Not a licensed financial advisor',
                'Cannot access personal financial accounts',
                'No loan approval authority',
                'Cannot guarantee rate availability'
            ]
        }
    };

    // Agent-to-Agent Interaction Examples
    @track agentInteractions = [
        {
            scenario: 'Property Search and Qualification',
            description: 'BlueNest Agent collaborates with Property and Engagement Agents',
            steps: [
                'BlueNest receives initial property search request',
                'Engagement Agent qualifies the lead and gathers preferences',
                'Property Agent searches for matching properties',
                'BlueNest coordinates responses and provides recommendations'
            ]
        },
        {
            scenario: 'Transaction Processing',
            description: 'Transaction Agent coordinates with Finance and Property Agents',
            steps: [
                'Transaction Agent initiates document preparation',
                'Finance Agent calculates payment schedules',
                'Property Agent provides property details',
                'Transaction Agent tracks progress and updates all parties'
            ]
        },
        {
            scenario: 'Financial Analysis and Property Selection',
            description: 'Finance Agent works with Property and Engagement Agents',
            steps: [
                'Finance Agent performs affordability analysis',
                'Property Agent suggests properties within budget',
                'Engagement Agent schedules viewings',
                'BlueNest coordinates the entire process'
            ]
        }
    ];

    // Activity View Properties
    @track chatSummaryItems = [];
    @track actionItems = [];
    @track knowledgeArticles = [];
    @track recommendations = [];
    @track isLoadingSummary = false;
    @track isLoadingActionItems = false;
    @track isLoadingArticles = false;
    @track isLoadingRecommendations = false;
    @track activeTab = 'chat-summary';

    // Notification View Properties
    @track notifications = [];
    @track isLoadingNotifications = false;

    // Calendar View Properties
    @track selectedDate = new Date().toISOString();
    @track calendarEvents = [];
    @track calendarView = 'month';

    // Schedule View Properties
    @track schedules = [];
    @track isLoadingSchedule = false;

    @track currentView = 'home';
    @track isTourActive = false;
    @track currentTourStep = 0;
    @track showTour = false;
    @track showHelp = false;

    // Tour steps configuration
    tourSteps = [
        {
            id: 1,
            title: 'Welcome to VoiceAgent',
            content: 'This guided tour will help you get started with VoiceAgent. Let\'s explore the main features!',
            icon: 'utility:info'
        },
        {
            id: 2,
            title: 'Activity View',
            content: 'View your recent activities, including chat summaries, action items, and recommendations.',
            icon: 'utility:activity'
        },
        {
            id: 3,
            title: 'Notifications',
            content: 'Stay updated with real-time notifications about important events and updates.',
            icon: 'utility:notification'
        },
        {
            id: 4,
            title: 'Calendar',
            content: 'Manage your schedule and appointments with the integrated calendar.',
            icon: 'utility:calendar'
        },
        {
            id: 5,
            title: 'Schedule',
            content: 'Plan and organize your tasks with the scheduling feature.',
            icon: 'utility:schedule'
        }
    ];

    connectedCallback() {
        this.initializeSpeechRecognition();
        this.initializeMessages();
        this.template.addEventListener('keydown', this.handleKeyDown.bind(this));
        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem('voiceAgentDarkMode') === 'true';
        if (savedDarkMode) {
            this.isDarkMode = true;
            const root = this.template.querySelector('.app-container');
            if (root) {
                root.classList.add('dark-mode');
            }
        }
        this.loadAllData();
        this.showWelcomeToast();
    }

    disconnectedCallback() {
        this.template.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    // AI Transparency and Agentic Controls Methods
    showAIInfo() {
        this.showAIInfoModal = true;
    }

    hideAIInfo() {
        this.showAIInfoModal = false;
    }

    showAICapabilities() {
        this.showAICapabilitiesModal = true;
    }

    hideAICapabilities() {
        this.showAICapabilitiesModal = false;
    }

    showAgentCapabilities(event) {
        event.preventDefault();
        event.stopPropagation();
        const agentId = event.currentTarget.dataset.agentId;
        const agent = this.agents.find(a => a.id === agentId);
        if (agentId && this.agentCapabilities[agentId]) {
            this.selectedAgentForCapabilities = agentId;
            this.selectedAgentInfo = agent;
            this.showAgentCapabilitiesModal = true;
        }
    }

    hideAgentCapabilities() {
        this.showAgentCapabilitiesModal = false;
        this.selectedAgentForCapabilities = null;
        this.selectedAgentInfo = null;
    }

    toggleFilterAIAgents() {
        this.filterAIAgentsOnly = !this.filterAIAgentsOnly;
    }

    changeTransparencyLevel(event) {
        this.aiTransparencyLevel = event.target.value;
        this.showToast('Transparency Level Updated', `AI transparency level set to ${this.aiTransparencyLevel}`, 'success');
    }

    get selectedAgentCapabilities() {
        return this.selectedAgentForCapabilities ? this.selectedAgentForCapabilities.capabilities || [] : [];
    }

    get selectedAgentLimitations() {
        return this.selectedAgentForCapabilities ? this.selectedAgentForCapabilities.limitations || [] : [];
    }

    get selectedAgentInfo() {
        if (this.selectedAgentForCapabilities) {
            return this.agents.find(agent => agent.id === this.selectedAgentForCapabilities);
        }
        return null;
    }

    // Filter agents based on AI capability if filter is enabled
    get displayedAgents() {
        if (this.filterAIAgentsOnly) {
            return this.filteredAgents.filter(agent => agent.isAIPowered);
        }
        return this.filteredAgents;
    }

    // Used in conversation to indicate AI confidence levels based on transparency setting
    get confidenceIndicator() {
        return (message) => {
            if (!message.isAI || this.aiTransparencyLevel === 'low') {
                return '';
            }
            
            // This would typically come from the AI response metadata
            // Simulating here with random confidence levels
            const confidence = message.confidence || Math.random();
            
            if (this.aiTransparencyLevel === 'high') {
                return `<div class="confidence-indicator high-detail">
                    <div class="confidence-bar" style="width: ${confidence * 100}%"></div>
                    <span>${Math.round(confidence * 100)}% confidence</span>
                </div>`;
            } else {
                // Medium transparency level
                let indicator = '';
                if (confidence > 0.8) {
                    indicator = 'High confidence';
                } else if (confidence > 0.5) {
                    indicator = 'Medium confidence';
                } else {
                    indicator = 'Low confidence';
                }
                return `<div class="confidence-indicator">${indicator}</div>`;
            }
        };
    }

    initializeMessages() {
        this.addAIMessage('Hi! I\'m your AI assistant. How can I help you today?');
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.textInput = transcript;
                this.handleSubmit();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }
    }

    async handleVoiceInput() {
        if (!this.recognition) {
            this.voiceStatus = 'Speech recognition not supported';
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.stopRecording();
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaStream = stream;
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });                    
                    this.processAudioInput(audioBlob);
                };

                this.mediaRecorder.start();
                this.recognition.start();
                this.isRecording = true;
                this.voiceStatus = 'Recording...';
                this.microphoneIcon = 'utility:mic_off';
            } catch (error) {
                this.showToast('Error', 'Microphone access denied or not available', 'error');
                this.voiceStatus = 'Error: Microphone access denied';
                this.microphoneIcon = 'utility:microphone';
            }
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        this.voiceStatus = 'Click to start recording';
        this.microphoneIcon = 'utility:microphone';
    }

    async processAudioInput(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            
            const result = await saveAudioFile({
                recordId: this.recordId,
                audioBlob: audioBlob
            });
            
            this.handleSubmit();
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showToast('Error', 'Failed to process audio input', 'error');
        }
    }

    handleAgentChange(event) {
        this.selectedAgent = event.detail.value;
    }

    handlePromptChange(event) {
        this.textInput = event.detail.value;
    }

    async handleSubmit() {
        if (!this.textInput.trim()) return;

        this.isLoading = true;
        const userMessage = this.textInput.trim();
        
        // Add user message to chat
        this.messages.push({
            id: Date.now(),
            sender: this.currentUser.name,
            text: userMessage,
            timestamp: new Date().toISOString(),
            isUser: true
        });

        try {
            let response;
            if (this.recordId) {
                response = await getAgentResponseWithContext({
                    input: userMessage,
                    agentType: this.selectedAgent,
                    context: this.recordId
                });
            } else {
                response = await getAIResponse({
                    userMessage: userMessage,
                    recordId: this.recordId,
                    objectApiName: null
                });
            }

            // Add AI response to chat with confidence level
            // In a real implementation, the confidence would come from the AI service
            const confidence = Math.random(); // Simulating confidence level
            this.messages.push({
                id: Date.now() + 1,
                sender: this.selectedAgent,
                text: response,
                timestamp: new Date().toISOString(),
                isUser: false,
                isAI: true,
                confidence: confidence
            });

            // Clear input
            this.textInput = '';
            
            // Scroll to bottom
            this.scrollToBottom();
            
            // Speak the response if speech synthesis is available
            this.speakResponse(response);

        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    scrollToBottom() {
        const messagesContainer = this.template.querySelector('.messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    speakResponse(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }

    toggleHighContrast() {
        this.isHighContrast = !this.isHighContrast;
        const container = this.template.querySelector('.container');
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
        if (this.showEmojiPicker) {
            this.showFileUpload = false;
        }
    }

    toggleFileUpload() {
        this.showFileUpload = !this.showFileUpload;
        if (this.showFileUpload) {
            this.showEmojiPicker = false;
        }
    }

    handleEmojiSelect(event) {
        const emoji = event.detail;
        this.textInput += emoji;
        this.showEmojiPicker = false;
    }

    handleFileUpload(event) {
        const file = event.detail.files[0];
        if (file) {
            // Handle file upload
            this.showToast('Success', 'File uploaded successfully', 'success');
        }
        this.showFileUpload = false;
    }

    clearChat() {
        this.messages = [];
        this.showToast('Success', 'Chat history cleared', 'success');
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
    handleKeyPress(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.handleSubmit();
        }
    }
    
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            if (this.currentUtterance) {
                window.speechSynthesis.cancel();
            }
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance.onend = () => {
                this.isSpeaking = false;
            };
            this.isSpeaking = true;
            window.speechSynthesis.speak(this.currentUtterance);
        }
    }

    scrollToLatestMessage() {
        const messageContainer = this.template.querySelector('.message-container');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    }

    updatePromptOptionsForAgent(agentId) {
        let prompts = [];
        switch(agentId) {
            case 'bluenest': // BlueNest Agent
                prompts = [
                    'Residential Enquiry',
                    'Retail Enquiry',
                    'Commercial Enquiry',
                    'Property Search',
                    'Property Comparison'
                ];
                break;
            case 'engagement': // Engagement Agent
                prompts = [
                    'Capture Lead Info',
                    'Qualify Lead',
                    'Schedule FollowUp',
                    'Engagement Metrics'
                ];
                break;
            case 'property': // Property Agent
                prompts = [
                    'Search Properties',
                    'Generate Property Comparison',
                    'Initiate Virtual Tour',
                    'Book Property Visit'
                ];
                break;
            case 'transaction': // Transaction Agent
                prompts = [
                    'Generate Formal Offer',
                    'Create Milestone Schedule',
                    'Track Milestone Progress',
                    'Notify Stakeholders'
                ];
                break;
            case 'service': // Service Agent
                prompts = [
                    'Schedule MoveIn Logistics',
                    'Create Maintenance Ticket',
                    'Track Request Status',
                    'Initiate Renewal Process'
                ];
                break;
            case 'finance': // Finance Agent
                prompts = [
                    'Calculate Affordability',
                    'Compare Loan Options',
                    'Process Payment',
                    'Generate Financial Documents'
                ];
                break;
        }
        this.selectedPromptOptions = prompts;
    }
    
    get currentAgent() {
        return this.agents.find(agent => agent.id === this.selectedAgent);
    }
    
    get currentMessages() {
        const agent = this.agents.find(agent => agent.id === this.selectedAgent);
        return agent ? agent.messages : [];
    }

    get sidebarClass() {
        return this.isMenuOpen ? 'agent-sidebar show-menu' : 'agent-sidebar';
    }

    get agentClass() {
        return 'agent-item' + (this.selectedAgent === this.currentAgent?.id ? ' selected' : '');
    }

    get messageClass() {
        return 'message-bubble' + (this.currentMessages[this.currentMessages.length - 1]?.isSelf ? ' self' : ' other');
    }

    get agentItemClass() {
        return (agentId) => {
            return this.selectedAgent === agentId ? 'agent-item selected' : 'agent-item';
        };
    }

    get messageBubbleClass() {
        return (isSelf) => {
            return isSelf ? 'message-bubble self' : 'message-bubble other';
        };
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleAddApp(event) {
        const appId = event.currentTarget.dataset.appId;
        // Implement app installation logic here
    }

    handleAppSettings(event) {
        const appId = event.currentTarget.dataset.appId;
        // Implement settings dialog logic here
    }

    // Filter apps based on search term
    get filteredApps() {
        if (!this.searchTerm) {
            return this.recommendedApps;
        }
        
        const searchLower = this.searchTerm.toLowerCase();
        return this.recommendedApps.filter(app => 
            app.name.toLowerCase().includes(searchLower) ||
            app.description.toLowerCase().includes(searchLower)
        );
    }

    handleHomeClick() {
        this.currentView = 'home';
    }

    handleChatClick() {
        this.currentView = 'chat';
    }

    handleActivityClick() {
        this.currentView = 'activity';
        this.activeTab = 'chat-summary';
        this.loadTabData('chat-summary');
    }

    handleNotificationClick() {
        this.currentView = 'notification';
        this.loadNotifications();
    }

    handleCalendarClick() {
        this.currentView = 'calendar';
        this.calendarView = 'month';
        this.loadCalendarEvents();
    }

    handleScheduleClick() {
        this.currentView = 'schedule';
        this.loadSchedules();
    }

    handleSlackClick() {
        window.open('https://slack.com/intl/en-in/', '_blank', 'noopener,noreferrer');
    }

    handleTeamsClick() {
        window.open('https://teams.microsoft.com/', '_blank', 'noopener,noreferrer');
    }

    handleZoomClick() {
        window.open('https://www.zoom.us/', '_blank', 'noopener,noreferrer');
    }

    get isHomeView() {
        return this.currentView === 'home';
    }

    get isChatView() {
        return this.currentView === 'chat';
    }

    get isActivityView() {
        return this.currentView === 'activity';
    }

    get isNotificationView() {
        return this.currentView === 'notification';
    }

    get isCalendarView() {
        return this.currentView === 'calendar';
    }

    get isScheduleView() {
        return this.currentView === 'schedule';
    }

    get searchPlaceholder() {
        return this.currentView === 'home' ? 'Search for agents...' : 'Search in conversation...';
    }

    get filteredAgents() {
        if (!this.searchTerm) {
            return this.agents;
        }
        
        const searchLower = this.searchTerm.toLowerCase();
        return this.agents.filter(agent => 
            agent.label.toLowerCase().includes(searchLower) ||
            agent.description.toLowerCase().includes(searchLower)
        );
    }

    handleAgentSelect(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const agentId = event.currentTarget.dataset.agentId;
        const selectedAgent = this.agents.find(agent => agent.id === agentId);
        
        if (selectedAgent) {
            this.selectedAgentForCapabilities = selectedAgent;
            this.selectedAgentInfo = selectedAgent;
            this.showAgentCapabilitiesModal = true;
        }
    }

    selectCurrentAgent() {
        if (this.selectedAgentForCapabilities) {
            this.selectedAgent = this.selectedAgentForCapabilities;
            this.selectedAgentId = this.selectedAgentForCapabilities.agentId;
            this.selectedAgentName = this.selectedAgentForCapabilities.label;
            this.showAgentCapabilitiesModal = false;
            this.currentView = 'chat';
            
            // Show success message with the selected agent's name
            this.showToast(
                'Success',
                `You are now chatting with ${this.selectedAgentForCapabilities.label}`,
                'success'
            );
        }
    }

    get selectedAgentName() {
        return this.selectedAgentForCapabilities ? this.selectedAgentForCapabilities.label : '';
    }

    get selectedAgentIcon() {
        return this.selectedAgentForCapabilities ? this.selectedAgentForCapabilities.icon : 'standard:bot';
    }

    get selectedAgentDescription() {
        return this.selectedAgentForCapabilities ? this.selectedAgentForCapabilities.description : '';
    }

    get chatHeaderName() {
        return this.selectedAgentName;
    }

    handleMessageChange(event) {
        this.messageText = event.target.value;
    }

    sendMessage() {
        const message = this.inputMessage.trim();
        if (message && !this.isTyping) {
            this.addUserMessage(message);
            this.inputMessage = '';
            this.isTyping = true;
            
            setTimeout(() => {
                this.getAIResponse(message);
            }, 1500);
        }
    }

    get gridClass() {
        return 'app-grid';
    }

    get isSendDisabled() {
        return !this.inputMessage.trim() || this.isTyping;
    }
    
    handleInputChange(event) {
        this.inputMessage = event.target.value;
    }
    
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSubmit();
        }
    }
    
    handleSend() {
        this.sendMessage();
    }
    
    handleCopy(event) {
        const messageId = event.currentTarget.dataset.id;
        const message = this.messages.find(msg => msg.id == messageId);
        
        if (message) {
            const textArea = document.createElement('textarea');
            textArea.value = message.text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Message copied to clipboard',
                    variant: 'success'
                })
            );
        }
    }
    
    handleLike(event) {
        const messageId = event.currentTarget.dataset.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Feedback received',
                message: 'Thank you for your feedback',
                variant: 'success'
            })
        );
    }
    
    handleDislike(event) {
        const messageId = event.currentTarget.dataset.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Feedback received',
                message: 'We will use your feedback to improve',
                variant: 'info'
            })
        );
    }
    
    handleMinimize() {
        // Logic to minimize the chat window
        console.log('Minimize chat window');
    }
    
    handleExpand() {
        // Logic to expand the chat window
        console.log('Expand chat window');
    }

    handleClose() {
        // Logic to close the chat window
        console.log('Close chat window');
    }

    handleAttach() {
        // Logic to handle file attachment
        console.log('File attachment clicked');
    }

    handleViewUsagePolicy() {
        // Logic to display usage policy
        console.log('View usage policy');
    }

    focusInputField() {
        const textArea = this.template.querySelector('lightning-textarea');
        if (textArea) {
            textArea.focus();
        }
    }
    
    addUserMessage(text) {
        this.messageIdCounter++;
        this.messages = [...this.messages, {
            id: this.messageIdCounter,
            author: 'You',
            text: text,
            isAI: false,
            containerClass: 'message-container user-message-container',
            contentClass: 'message-content user-message-content'
        }];
        
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }
    
    addAIMessage(text) {
        this.messageIdCounter++;
        const confidence = Math.random(); // Simulating confidence level
        this.messages = [...this.messages, {
            id: this.messageIdCounter,
            author: 'AI Assistant',
            text: text,
            isAI: true,
            confidence: confidence,
            containerClass: 'message-container ai-message-container',
            contentClass: 'message-content ai-message-content'
        }];
        
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }
    
    getAIResponse(userMessage) {
        const simulatedResponse = "Thanks for your message! This is a simulated response from the AI assistant. In a real implementation, this would come from a backend API call to a service like ChatGPT or a custom AI model.";
        this.isTyping = false;
        this.addAIMessage(simulatedResponse);
    }
    
    scrollToBottom() {
        const container = this.template.querySelector('.messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Computed properties for class names
    get homeNavClass() {
        return this.currentView === 'home' ? 'nav-item active' : 'nav-item';
    }

    get chatNavClass() {
        return this.currentView === 'chat' ? 'nav-item active' : 'nav-item';
    }

    // Dark mode toggle
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        const root = this.template.querySelector('.app-container');
        if (root) {
            if (this.isDarkMode) {
                root.classList.add('dark-mode');
            } else {
                root.classList.remove('dark-mode');
            }
        }
        // Save preference to localStorage
        localStorage.setItem('voiceAgentDarkMode', this.isDarkMode);
    }

    get showCapabilities() {
        return this.showAICapabilitiesModal;
    }

    get showAgentDetail() {
        return this.showAgentCapabilitiesModal;
    }

    get showAIOnly() {
        return this.filterAIAgentsOnly;
    }

    handleChatClick() {
        this.currentView = 'chat';
    }

    // Activity View Methods
    handleTabClick(event) {
        const tabId = event.currentTarget.dataset.tab;
        this.activeTab = tabId;
        
        // Remove active class from all tabs
        const tabs = this.template.querySelectorAll('.slds-tabs_default__item');
        tabs.forEach(tab => tab.classList.remove('slds-is-active'));
        
        // Add active class to clicked tab
        event.currentTarget.parentElement.classList.add('slds-is-active');
        
        // Hide all content panels
        const panels = this.template.querySelectorAll('.slds-tabs_default__content');
        panels.forEach(panel => panel.classList.add('slds-hide'));
        
        // Show selected panel
        const selectedPanel = this.template.querySelector(`#${tabId}`);
        if (selectedPanel) {
            selectedPanel.classList.remove('slds-hide');
        }

        // Load data for the selected tab
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch(tabId) {
            case 'chat-summary':
                this.loadChatSummary();
                break;
            case 'action-items':
                this.loadActionItems();
                break;
            case 'knowledge-articles':
                this.loadKnowledgeArticles();
                break;
            case 'recommendations':
                this.loadRecommendations();
                break;
        }
    }

    async loadChatSummary() {
        this.isLoadingSummary = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.chatSummaryItems = [
                {
                    id: '1',
                    title: 'Lead Qualification - John Smith',
                    timestamp: '2 hours ago',
                    details: [
                        'Initial consultation completed',
                        'Budget range: $750,000 - $900,000',
                        'Preferred locations: Downtown, Waterfront, West End',
                        'Property type: 3-4 bedroom single-family home',
                        'Timeline: Looking to move within 3-6 months',
                        'Pre-approved for mortgage with ABC Bank',
                        'Key requirements: Modern kitchen, garage, backyard'
                    ]
                },
                {
                    id: '2',
                    title: 'Property Viewing - 123 Maple Avenue',
                    timestamp: 'Yesterday',
                    details: [
                        'Property: Luxury Townhouse at 123 Maple Avenue',
                        'Client: Sarah Johnson and family',
                        'Price: $825,000',
                        'Key features discussed: Renovated kitchen, smart home features',
                        'Client feedback: Very interested, considering making an offer',
                        'Follow-up actions: Schedule second viewing, prepare comparative market analysis',
                        'Potential concerns: HOA restrictions, parking situation'
                    ]
                },
                {
                    id: '3',
                    title: 'Market Analysis - Downtown District',
                    timestamp: '2 days ago',
                    details: [
                        'Average price per square foot: $450',
                        'Year-over-year appreciation: 5.2%',
                        'Average days on market: 15',
                        'Current inventory: 45 active listings',
                        'Price trends: Steady increase in luxury segment',
                        'New developments: 2 major projects breaking ground',
                        'Market sentiment: Seller\'s market with multiple offer situations common'
                    ]
                },
                {
                    id: '4',
                    title: 'Transaction Progress - 456 Oak Street',
                    timestamp: '3 days ago',
                    details: [
                        'Buyer: Michael Brown',
                        'Purchase price: $695,000',
                        'Status: Under contract',
                        'Inspection completed: Minor repairs requested',
                        'Mortgage status: Final approval received',
                        'Closing date: Scheduled for next month',
                        'Outstanding items: Final walkthrough, closing cost review'
                    ]
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load chat summary', 'error');
        } finally {
            this.isLoadingSummary = false;
        }
    }

    async loadActionItems() {
        this.isLoadingActionItems = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.actionItems = [
                {
                    id: '1',
                    title: 'Follow up with John Smith',
                    description: 'Schedule property viewing for 123 Maple Avenue',
                    dueDate: '2024-03-15',
                    priority: 'High',
                    status: 'Pending',
                    assignedTo: 'You',
                    type: 'viewing',
                    icon: 'utility:event',
                    iconColor: 'var(--slds-g-color-brand-base-50, #0176d3)'
                },
                {
                    id: '2',
                    title: 'Prepare Market Analysis',
                    description: 'Generate report for Downtown District properties',
                    dueDate: '2024-03-16',
                    priority: 'Medium',
                    status: 'In Progress',
                    assignedTo: 'You',
                    type: 'report',
                    icon: 'utility:report',
                    iconColor: 'var(--slds-g-color-warning-base-50, #fe9339)'
                },
                {
                    id: '3',
                    title: 'Review Contract Documents',
                    description: 'Check purchase agreement for 456 Oak Street',
                    dueDate: '2024-03-17',
                    priority: 'High',
                    status: 'Not Started',
                    assignedTo: 'You',
                    type: 'document',
                    icon: 'utility:contract',
                    iconColor: 'var(--slds-g-color-error-base-50, #ea001e)'
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load action items', 'error');
        } finally {
            this.isLoadingActionItems = false;
        }
    }

    async loadKnowledgeArticles() {
        this.isLoadingArticles = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.knowledgeArticles = [
                {
                    id: '1',
                    title: '2024 Real Estate Market Trends',
                    summary: 'Comprehensive analysis of current market conditions and future predictions.',
                    category: 'Market Analysis',
                    lastUpdated: '2024-03-10',
                    readTime: '8 min read',
                    url: '#',
                    icon: 'utility:chart',
                    iconColor: 'var(--slds-g-color-brand-base-50, #0176d3)'
                },
                {
                    id: '2',
                    title: 'Property Valuation Guide',
                    summary: 'Step-by-step guide to accurate property valuation methods.',
                    category: 'Valuation',
                    lastUpdated: '2024-03-09',
                    readTime: '6 min read',
                    url: '#',
                    icon: 'utility:moneybag',
                    iconColor: 'var(--slds-g-color-success-base-50, #2e844a)'
                },
                {
                    id: '3',
                    title: 'Client Communication Best Practices',
                    summary: 'Effective communication strategies for real estate professionals.',
                    category: 'Sales',
                    lastUpdated: '2024-03-08',
                    readTime: '5 min read',
                    url: '#',
                    icon: 'utility:chat',
                    iconColor: 'var(--slds-g-color-warning-base-50, #fe9339)'
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load knowledge articles', 'error');
        } finally {
            this.isLoadingArticles = false;
        }
    }

    async loadRecommendations() {
        this.isLoadingRecommendations = true;
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.recommendations = [
                {
                    id: '1',
                    title: 'Property Match Found',
                    description: 'New listing at 789 Pine Road matches your client\'s criteria',
                    priority: 'High',
                    category: 'Property Match',
                    suggestedAction: 'Schedule Viewing',
                    impact: 'High potential match',
                    icon: 'utility:home',
                    iconColor: 'var(--slds-g-color-brand-base-50, #0176d3)'
                },
                {
                    id: '2',
                    title: 'Market Opportunity',
                    description: 'Price reduction on 321 Elm Court - 10% below market value',
                    priority: 'Medium',
                    category: 'Investment',
                    suggestedAction: 'Review Details',
                    impact: 'Good investment potential',
                    icon: 'utility:trending',
                    iconColor: 'var(--slds-g-color-success-base-50, #2e844a)'
                },
                {
                    id: '3',
                    title: 'Client Follow-up',
                    description: 'Sarah Johnson has shown interest in similar properties',
                    priority: 'High',
                    category: 'Lead Nurturing',
                    suggestedAction: 'Schedule Call',
                    impact: 'High conversion potential',
                    icon: 'utility:phone',
                    iconColor: 'var(--slds-g-color-warning-base-50, #fe9339)'
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load recommendations', 'error');
        } finally {
            this.isLoadingRecommendations = false;
        }
    }

    handleCompleteAction(event) {
        const actionId = event.currentTarget.dataset.id;
        // Implement action completion logic
    }

    handlePreviewArticle(event) {
        const articleId = event.currentTarget.dataset.id;
        // Implement article preview logic
    }

    handleApplyRecommendation(event) {
        const recommendationId = event.currentTarget.dataset.id;
        // Implement recommendation application logic
    }

    // Notification View Methods
    async loadNotifications() {
        this.isLoadingNotifications = true;
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.notifications = [
                {
                    id: '1',
                    message: 'New lead inquiry received from John Smith regarding 123 Maple Avenue',
                    timestamp: '2 minutes ago',
                    type: 'lead',
                    icon: 'standard:lead',
                    iconColor: 'var(--lwc-colorBackgroundSuccess)',
                    unread: true,
                    priority: 'high',
                    details: {
                        name: 'John Smith',
                        email: 'john.smith@email.com',
                        phone: '(555) 123-4567',
                        propertyId: 'MAP123'
                    }
                },
                {
                    id: '2',
                    message: 'Property viewing scheduled for tomorrow at 2 PM - 456 Oak Street',
                    timestamp: '1 hour ago',
                    type: 'event',
                    icon: 'standard:event',
                    iconColor: 'var(--lwc-colorBackgroundInfo)',
                    unread: true,
                    priority: 'high',
                    details: {
                        client: 'Sarah Johnson',
                        property: '456 Oak Street',
                        datetime: '2024-03-15 14:00',
                        agent: 'Michael Brown'
                    }
                },
                {
                    id: '3',
                    message: 'Market analysis report for Downtown District is ready for review',
                    timestamp: '3 hours ago',
                    type: 'report',
                    icon: 'standard:report',
                    iconColor: 'var(--lwc-colorBackgroundWarning)',
                    unread: false,
                    priority: 'medium',
                    details: {
                        reportId: 'RPT789',
                        area: 'Downtown District',
                        period: 'Q1 2024',
                        metrics: ['Price Trends', 'Inventory Levels', 'Market Activity']
                    }
                },
                {
                    id: '4',
                    message: 'Offer accepted on 789 Pine Road - Closing process initiated',
                    timestamp: '5 hours ago',
                    type: 'transaction',
                    icon: 'standard:contract',
                    iconColor: 'var(--lwc-colorBackgroundSuccess)',
                    unread: true,
                    priority: 'high',
                    details: {
                        propertyId: 'PIN789',
                        buyer: 'David Wilson',
                        price: '$750,000',
                        closingDate: '2024-04-15'
                    }
                },
                {
                    id: '5',
                    message: 'New property listing matches saved search criteria',
                    timestamp: '6 hours ago',
                    type: 'property',
                    icon: 'standard:home',
                    iconColor: 'var(--lwc-colorBackgroundInfo)',
                    unread: false,
                    priority: 'medium',
                    details: {
                        address: '321 Elm Court',
                        price: '$625,000',
                        beds: 4,
                        baths: 3,
                        sqft: 2800
                    }
                },
                {
                    id: '6',
                    message: 'Client feedback received for recent showing',
                    timestamp: '1 day ago',
                    type: 'feedback',
                    icon: 'standard:feedback',
                    iconColor: 'var(--lwc-colorBackgroundWarning)',
                    unread: false,
                    priority: 'low',
                    details: {
                        client: 'Emily Chen',
                        property: '567 Birch Lane',
                        rating: 4,
                        comments: 'Loved the layout, concerned about price'
                    }
                },
                {
                    id: '7',
                    message: 'Document requires signature - Purchase Agreement',
                    timestamp: '1 day ago',
                    type: 'document',
                    icon: 'standard:document',
                    iconColor: 'var(--lwc-colorBackgroundError)',
                    unread: true,
                    priority: 'high',
                    details: {
                        documentId: 'DOC456',
                        type: 'Purchase Agreement',
                        deadline: '2024-03-16',
                        parties: ['Buyer', 'Seller', 'Agent']
                    }
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load notifications', 'error');
        } finally {
            this.isLoadingNotifications = false;
        }
    }

    handleRefreshNotifications() {
        this.loadNotifications();
    }

    handleDismissNotification(event) {
        const notificationId = event.currentTarget.dataset.id;
        this.notifications = this.notifications.filter(notification => notification.id !== notificationId);
        this.showToast('Success', 'Notification dismissed', 'success');
    }

    // Calendar View Methods
    async loadCalendarEvents() {
        this.isLoadingCalendar = true;
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.calendarEvents = [
                {
                    id: '1',
                    title: 'Property Viewing - 123 Maple Avenue',
                    startDateTime: new Date(2024, 2, 15, 10, 0).toISOString(),
                    endDateTime: new Date(2024, 2, 15, 11, 0).toISOString(),
                    description: 'Client: John Smith\nProperty: 123 Maple Avenue\nPrice: $695,000',
                    location: '123 Maple Avenue, Downtown',
                    type: 'viewing'
                },
                {
                    id: '2',
                    title: 'Market Analysis Presentation',
                    startDateTime: new Date(2024, 2, 15, 14, 0).toISOString(),
                    endDateTime: new Date(2024, 2, 15, 15, 30).toISOString(),
                    description: 'Q1 2024 Market Analysis for Downtown District',
                    location: 'Virtual Meeting - Zoom',
                    type: 'presentation'
                },
                {
                    id: '3',
                    title: 'Property Inspection - 456 Oak Street',
                    startDateTime: new Date(2024, 2, 16, 9, 0).toISOString(),
                    endDateTime: new Date(2024, 2, 16, 11, 0).toISOString(),
                    description: 'Pre-listing inspection with Bob Wilson',
                    location: '456 Oak Street, West End',
                    type: 'inspection'
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load calendar events', 'error');
        } finally {
            this.isLoadingCalendar = false;
        }
    }

    handleCalendarViewChange(event) {
        const view = event.currentTarget.dataset.view;
        this.calendarView = view;
        this.loadCalendarEvents();
    }

    handleDateSelect(event) {
        const selectedDate = event.detail.value;
        this.selectedDate = selectedDate;
        this.showToast('Info', `Selected date: ${new Date(selectedDate).toLocaleDateString()}`, 'info');
    }

    // Schedule View Methods
    async loadSchedules() {
        this.isLoadingSchedule = true;
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.schedules = [
                {
                    id: '1',
                    title: 'Property Viewing - 123 Maple Avenue',
                    startDateTime: '2024-03-15 10:00',
                    endDateTime: '2024-03-15 11:00',
                    location: '123 Maple Avenue, Downtown',
                    type: 'viewing',
                    status: 'confirmed',
                    details: {
                        client: 'John Smith',
                        propertyId: 'MAP123',
                        price: '$695,000',
                        notes: 'First-time buyer, interested in modern features'
                    },
                    attendees: [
                        { name: 'John Smith', role: 'Client' },
                        { name: 'Sarah Johnson', role: 'Agent' }
                    ]
                },
                {
                    id: '2',
                    title: 'Market Analysis Presentation',
                    startDateTime: '2024-03-15 14:00',
                    endDateTime: '2024-03-15 15:30',
                    location: 'Virtual Meeting - Zoom',
                    type: 'presentation',
                    status: 'pending',
                    details: {
                        topic: 'Q1 2024 Market Analysis',
                        area: 'Downtown District',
                        presenter: 'Michael Brown',
                        materials: ['Market Report', 'Trend Analysis', 'Pricing Strategy']
                    },
                    attendees: [
                        { name: 'Team Leaders', role: 'Audience' },
                        { name: 'Michael Brown', role: 'Presenter' }
                    ]
                },
                {
                    id: '3',
                    title: 'Property Inspection - 456 Oak Street',
                    startDateTime: '2024-03-16 09:00',
                    endDateTime: '2024-03-16 11:00',
                    location: '456 Oak Street, West End',
                    type: 'inspection',
                    status: 'confirmed',
                    details: {
                        inspector: 'Bob Wilson',
                        propertyId: 'OAK456',
                        type: 'Pre-listing',
                        requirements: ['Access to all rooms', 'Utilities must be on']
                    },
                    attendees: [
                        { name: 'Bob Wilson', role: 'Inspector' },
                        { name: 'David Miller', role: 'Owner' }
                    ]
                },
                {
                    id: '4',
                    title: 'Closing Meeting - 789 Pine Road',
                    startDateTime: '2024-03-16 13:00',
                    endDateTime: '2024-03-16 14:30',
                    location: 'Title Company Office',
                    type: 'closing',
                    status: 'confirmed',
                    details: {
                        propertyId: 'PIN789',
                        price: '$750,000',
                        buyer: 'Emily Chen',
                        seller: 'James Wilson',
                        documents: ['Purchase Agreement', 'Title Documents', 'Closing Statement']
                    },
                    attendees: [
                        { name: 'Emily Chen', role: 'Buyer' },
                        { name: 'James Wilson', role: 'Seller' },
                        { name: 'Sarah Johnson', role: 'Agent' },
                        { name: 'Jane Smith', role: 'Title Agent' }
                    ]
                },
                {
                    id: '5',
                    title: 'Open House - 321 Elm Court',
                    startDateTime: '2024-03-17 12:00',
                    endDateTime: '2024-03-17 16:00',
                    location: '321 Elm Court, East Side',
                    type: 'open-house',
                    status: 'scheduled',
                    details: {
                        propertyId: 'ELM321',
                        price: '$625,000',
                        features: ['4 Bedrooms', '3 Bathrooms', 'Modern Kitchen', 'Pool'],
                        materials: ['Property Brochures', 'Sign-in Sheet', 'Area Information']
                    },
                    attendees: [
                        { name: 'Michael Brown', role: 'Host Agent' },
                        { name: 'Lisa Parker', role: 'Assistant Agent' }
                    ]
                },
                {
                    id: '6',
                    title: 'Team Strategy Meeting',
                    startDateTime: '2024-03-18 09:00',
                    endDateTime: '2024-03-18 10:30',
                    location: 'Conference Room A',
                    type: 'meeting',
                    status: 'scheduled',
                    details: {
                        agenda: [
                            'Market Updates',
                            'Lead Generation Strategy',
                            'Technology Updates',
                            'Training Schedule'
                        ],
                        requiredMaterials: ['Q1 Reports', 'Marketing Plan', 'Training Calendar']
                    },
                    attendees: [
                        { name: 'All Team Members', role: 'Participant' },
                        { name: 'Sarah Johnson', role: 'Team Lead' }
                    ]
                }
            ];
        } catch (error) {
            this.showToast('Error', 'Failed to load schedules', 'error');
        } finally {
            this.isLoadingSchedule = false;
        }
    }

    handleAddSchedule() {
        // Implement schedule creation logic
        console.log('Add schedule clicked');
    }

    handleEditSchedule(event) {
        const scheduleId = event.currentTarget.dataset.id;
        // Implement schedule editing logic
        console.log('Edit schedule:', scheduleId);
    }

    handleDeleteSchedule(event) {
        const scheduleId = event.currentTarget.dataset.id;
        // Implement schedule deletion logic
        console.log('Delete schedule:', scheduleId);
    }

    // Update the getter for the chat component
    get chatComponentParams() {
        return {
            recordId: this.recordId,
            selectedAgent: this.selectedAgent,
            selectedAgentId: this.selectedAgentId
        };
    }

    // Tour Management
    startTour() {
        this.showTour = true;
        this.isTourActive = true;
        this.currentTourStep = 0;
    }

    closeTour() {
        this.showTour = false;
        this.isTourActive = false;
        this.currentTourStep = 0;
    }

    nextTourStep() {
        if (this.currentTourStep < this.tourSteps.length - 1) {
            this.currentTourStep++;
        } else {
            this.closeTour();
        }
    }

    previousTourStep() {
        if (this.currentTourStep > 0) {
            this.currentTourStep--;
        }
    }

    jumpToStep(event) {
        const stepId = parseInt(event.currentTarget.dataset.step, 10);
        if (!isNaN(stepId) && stepId >= 1 && stepId <= this.tourSteps.length) {
            this.currentTourStep = stepId - 1;
        }
    }

    get currentTourStepData() {
        return this.tourSteps[this.currentTourStep] || {};
    }

    get isFirstStep() {
        return this.currentTourStep === 0;
    }

    get isLastStep() {
        return this.currentTourStep === this.tourSteps.length - 1;
    }

    get tourProgressPercentage() {
        return ((this.currentTourStep + 1) / this.tourSteps.length) * 100;
    }

    // Help Management
    toggleHelp() {
        this.showHelp = !this.showHelp;
    }

    openFullGuide() {
        // Open the full guide in a new window or show a modal
        this.showToast('Info', 'Opening full guide...', 'info');
        // You can implement the actual guide opening logic here
    }

    // Toast Notifications
    showWelcomeToast() {
        this.showToast('Welcome', 'Welcome to VoiceAgent! Click the help button for assistance.', 'success');
    }

    // Data Loading
    async loadAllData() {
        try {
            await Promise.all([
                this.loadChatSummary(),
                this.loadActionItems(),
                this.loadKnowledgeArticles(),
                this.loadRecommendations()
            ]);
        } catch (error) {
            this.showToast('Error', 'Failed to load data. Please try again.', 'error');
        }
    }

    // View Navigation
    handleViewChange(event) {
        this.currentView = event.detail.value;
    }

    // Computed properties for dynamic classes
    get progressDotClass() {
        return this.step.id === this.currentStep ? 'progress-dot active' : 'progress-dot';
    }

    get previousButtonClass() {
        return this.currentStep === 1 ? 'button disabled' : 'button';
    }

    get nextButtonLabel() {
        return this.isLastStep ? 'Finish' : 'Next';
    }

    get toastContainerClass() {
        const baseClass = 'toast';
        if (this.toastVariant === 'success') {
            return `${baseClass} success`;
        } else if (this.toastVariant === 'error') {
            return `${baseClass} error`;
        }
        return baseClass;
    }
}