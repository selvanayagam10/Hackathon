/**
 * Apex Controller for Voice Agent Chat
 * Handles communication with AI services and context retrieval
 */
public with sharing class VoiceAgentController {
    
    /**
     * Gets AI response based on user message and context
     * @param userMessage The message from the user
     * @param recordId Optional record ID for context
     * @param objectApiName Optional object API name for context
     * @return AI response text
     */
    @AuraEnabled
    public static String getAIResponse(String userMessage, String recordId, String objectApiName) {
        try {
            // Get context information if record ID is provided
            Map<String, Object> contextData = new Map<String, Object>();
            
            if (String.isNotBlank(recordId) && String.isNotBlank(objectApiName)) {
                contextData = getRecordContext(recordId, objectApiName);
            }
            
            // Call AI service to get response
            // For this example, we'll use a simple response
            // In a real implementation, you would call an external AI service or Einstein API
            String response = generateResponse(userMessage, contextData);
            
            // Log the interaction
            logInteraction(userMessage, response, recordId);
            
            return response;
            
        } catch (Exception e) {
            System.debug('Error in getAIResponse: ' + e.getMessage());
            throw new AuraHandledException('Error processing your request: ' + e.getMessage());
        }
    }
    
    /**
     * Logs the interaction between user and AI
     * @param userMessage The message from the user
     * @param aiResponse The response from the AI
     * @param recordId Optional record ID for context
     */
    private static void logInteraction(String userMessage, String aiResponse, String recordId) {
        try {
            // Create a new interaction record
            Interaction__c interaction = new Interaction__c(
                User_Message__c = userMessage,
                AI_Response__c = aiResponse,
                Record_Id__c = recordId,
                Timestamp__c = System.now()
            );
            
            // Insert the interaction record
            insert interaction;
        } catch (Exception e) {
            System.debug('Error logging interaction: ' + e.getMessage());
        }
    }
    
    /**
     * Gets context information for a record
     * @param recordId The record ID
     * @param objectApiName The object API name
     * @return Map of context data
     */
    private static Map<String, Object> getRecordContext(String recordId, String objectApiName) {
        Map<String, Object> contextData = new Map<String, Object>();
        
        try {
            // Get object metadata to determine fields to query
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectApiName);
            
            if (objectType == null) {
                return contextData;
            }
            
            // Get fields that are accessible to the current user
            Map<String, Schema.SObjectField> fieldMap = objectType.getDescribe().fields.getMap();
            List<String> accessibleFields = new List<String>();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                if (fieldDescribe.isAccessible()) {
                    accessibleFields.add(fieldName);
                }
            }
            
            // Build query
            String query = 'SELECT ' + String.join(accessibleFields, ',') + 
                          ' FROM ' + objectApiName + 
                          ' WHERE Id = :recordId';
            
            // Execute query
            SObject record = Database.query(query);
            
            // Add fields to context
            for (String fieldName : accessibleFields) {
                Object fieldValue = record.get(fieldName);
                if (fieldValue != null) {
                    contextData.put(fieldName, fieldValue);
                }
            }
            
            // Add record name if available
            if (record.get('Name') != null) {
                contextData.put('recordName', (String)record.get('Name'));
            }
            
        } catch (Exception e) {
            System.debug('Error getting record context: ' + e.getMessage());
        }
        
        return contextData;
    }
    
    /**
     * Generate response based on user message and context
     * @param userMessage The user's message
     * @param contextData Context data from the record
     * @return Generated response
     */
    private static String generateResponse(String userMessage, Map<String, Object> contextData) {
        // In a real implementation, you would call an LLM API here
        // For example:
        // - Einstein GPT API
        // - OpenAI API through a Named Credential
        // - Microsoft Azure API
        
        // For demo purposes, we'll provide some simple canned responses
        String lowercaseMessage = userMessage.toLowerCase();
        
        if (lowercaseMessage.contains('hello') || lowercaseMessage.contains('hi ')) {
            return 'Hello! How can I assist you with Salesforce today?';
        } else if (lowercaseMessage.contains('thank')) {
            return 'You\'re welcome! Is there anything else I can help you with?';
        } else if (lowercaseMessage.contains('record') || lowercaseMessage.contains('account') || 
                  lowercaseMessage.contains('contact') || lowercaseMessage.contains('opportunity')) {
            
            if (!contextData.isEmpty() && contextData.containsKey('recordName')) {
                return 'I can see you\'re working with the ' + contextData.get('recordName') + 
                       ' record. What would you like to know about it?';
            } else {
                return 'I can help you with record information. Could you be more specific about what you\'re looking for?';
            }
        } else if (lowercaseMessage.contains('create') || lowercaseMessage.contains('new')) {
            return 'I can help you create new records. What type of record would you like to create?';
        } else if (lowercaseMessage.contains('update') || lowercaseMessage.contains('edit') || 
                  lowercaseMessage.contains('change')) {
            return 'I can help you update records. What specific information would you like to change?';
        } else if (lowercaseMessage.contains('report') || lowercaseMessage.contains('dashboard')) {
            return 'I can help you find or create reports and dashboards. What kind of data are you looking to analyze?';
        } else {
            return 'I understand you\'re asking about: ' + userMessage + '. Could you please provide more details about what you\'d like to know?';
        }
    }

    @AuraEnabled
    public static String getAgentResponse(String input, String agentType) {
        try {
            // Initialize the response
            String response = '';
            
            // Process based on agent type
            if (agentType == 'Einstein') {
                // Call Einstein service
                response = 'Einstein response: ' + input;
            } else if (agentType == 'Claude') {
                // Call Claude service
                response = 'Claude response: ' + input;
            } else if (agentType == 'ChatGPT') {
                // Call ChatGPT service
                response = 'ChatGPT response: ' + input;
            } else {
                // Default response
                response = 'Default response: ' + input;
            }
            
            return response;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String getAgentResponseWithContext(String input, String agentType, String context) {
        try {
            // Initialize the response
            String response = '';
            
            // Process based on agent type with context
            if (agentType == 'Einstein') {
                // Call Einstein service with context
                response = 'Einstein response with context: ' + input + ' | Context: ' + context;
            } else if (agentType == 'Claude') {
                // Call Claude service with context
                response = 'Claude response with context: ' + input + ' | Context: ' + context;
            } else if (agentType == 'ChatGPT') {
                // Call ChatGPT service with context
                response = 'ChatGPT response with context: ' + input + ' | Context: ' + context;
            } else {
                // Default response with context
                response = 'Default response with context: ' + input + ' | Context: ' + context;
            }
            
            return response;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}