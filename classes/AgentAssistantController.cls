public with sharing class AgentAssistantController {
    @AuraEnabled
    public static String saveAudioFile(String base64Data, String recordId, String fileName) {
        try {
            // Remove header from base64 string if present
            if (base64Data.contains(',')) {
                base64Data = base64Data.substringAfter(',');
            }
            
            // Convert base64 to blob
            Blob audioBlob = EncodingUtil.base64Decode(base64Data);
            
            // Create ContentVersion
            ContentVersion cv = new ContentVersion();
            cv.VersionData = audioBlob;
            cv.Title = fileName;
            cv.PathOnClient = fileName + '.wav';
            cv.IsMajorVersion = true;
            insert cv;
            
            // Get ContentDocument Id
            Id conDocId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id =:cv.Id].ContentDocumentId;
            
            // Create ContentDocumentLink
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = conDocId;
            cdl.LinkedEntityId = recordId;
            cdl.ShareType = 'V'; // V = Viewer, C = Collaborator, I = Inferred
            cdl.Visibility = 'AllUsers';
            insert cdl;
            
            return cv.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error saving audio file: ' + e.getMessage());
        }
    }
}