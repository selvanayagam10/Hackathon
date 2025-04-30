public class ChatConversationManager {
    @AuraEnabled
    public static String saveConversation(String agentId, String conversationId, List<Map<String, Object>> messages) {
        try {
            // Create or update conversation record
            Chat_Conversation__c conversation = new Chat_Conversation__c(
                Agent_Id__c = agentId,
                Conversation_Id__c = conversationId,
                Last_Activity_Date__c = Datetime.now()
            );
            upsert conversation Conversation_Id__c;

            // Save messages
            List<Chat_Message__c> chatMessages = new List<Chat_Message__c>();
            for (Map<String, Object> msg : messages) {
                chatMessages.add(new Chat_Message__c(
                    Conversation__c = conversation.Id,
                    Message_Text__c = (String)msg.get('text'),
                    Is_Agent_Message__c = (Boolean)msg.get('isAgent'),
                    Sequence_Id__c = (Integer)msg.get('sequenceId'),
                    Timestamp__c = Datetime.now()
                ));
            }
            insert chatMessages;

            return conversation.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error saving conversation: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Map<String, Object>> loadConversation(String conversationId) {
        try {
            List<Map<String, Object>> messages = new List<Map<String, Object>>();
            
            // Query messages for the conversation
            for (Chat_Message__c msg : [
                SELECT Message_Text__c, Is_Agent_Message__c, Sequence_Id__c, Timestamp__c
                FROM Chat_Message__c
                WHERE Conversation__r.Conversation_Id__c = :conversationId
                ORDER BY Sequence_Id__c ASC
            ]) {
                messages.add(new Map<String, Object>{
                    'text' => msg.Message_Text__c,
                    'isAgent' => msg.Is_Agent_Message__c,
                    'sequenceId' => msg.Sequence_Id__c,
                    'timestamp' => msg.Timestamp__c
                });
            }

            return messages;
        } catch (Exception e) {
            throw new AuraHandledException('Error loading conversation: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void clearConversation(String conversationId) {
        try {
            // Delete all messages for the conversation
            delete [SELECT Id FROM Chat_Message__c WHERE Conversation__r.Conversation_Id__c = :conversationId];
            
            // Delete the conversation record
            delete [SELECT Id FROM Chat_Conversation__c WHERE Conversation_Id__c = :conversationId];
        } catch (Exception e) {
            throw new AuraHandledException('Error clearing conversation: ' + e.getMessage());
        }
    } 
}