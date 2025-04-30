/**
 * @description Service Agent HTTP Callout Class
 * @author Your Name
 * @date Created Date
 * 
 * This class handles all HTTP callouts to the Einstein AI Agent service.
 * It manages authentication, session creation, and message sending.
 */
public class ServiceAgentHTTPCallout {
    // Constants
    private static final String TOKEN_ENDPOINT = '/services/oauth2/token';
    private static final String SESSIONS_ENDPOINT = '/einstein/ai-agent/v1/agents/{0}/sessions';
    private static final String MESSAGES_ENDPOINT = '/einstein/ai-agent/v1/sessions/{0}/messages';
    private static final Integer TIMEOUT = 20000; // 20 seconds
    private static final String CONTENT_TYPE_JSON = 'application/json';
    private static final String CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';
    
    // Custom metadata type instance for credentials
    private static final API_Credentials__mdt credentials = API_Credentials__mdt.getInstance('Service_Agent');
    
    /**
     * @description Gets an access token for API authentication
     * @return String The access token
     * @throws CalloutException if token retrieval fails
     */
    private static String getAccessToken() {
        String domainUrl = credentials.Org_Domain_URL__c;
        String endpoint = domainUrl + TOKEN_ENDPOINT;
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', CONTENT_TYPE_FORM);
        
        String body = String.format(
            'grant_type=client_credentials&client_id={0}&client_secret={1}',
            new String[] { credentials.Client_Id__c, credentials.Client_Secret__c }
        );
        req.setBody(body);
        
        HttpResponse res = new Http().send(req);
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) responseMap.get('access_token');
        }
        throw new CalloutException('Failed to get access token: ' + res.getBody());
    }
    
    /**
     * @description Generates a unique session key
     * @return String A unique session identifier
     */
    private static String generateSessionKey() {
        return String.valueOf(System.currentTimeMillis()) + '-' + String.valueOf(Math.random()).substring(2);
    }
    
    /**
     * @description Creates a new session with the AI agent
     * @param agentId The ID of the agent to create a session with
     * @return String The session ID
     * @throws CalloutException if session creation fails
     */
    private static String createSession(String agentId) {
        String accessToken = getAccessToken();
        String sessionKey = generateSessionKey();
        String endpoint = String.format(
            credentials.Endpoint_URL__c + SESSIONS_ENDPOINT,
            new String[] { agentId }
        );
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', CONTENT_TYPE_JSON);
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setTimeout(TIMEOUT);
        
        Map<String, Object> requestBody = new Map<String, Object>{
            'externalSessionKey' => sessionKey,
            'instanceConfig' => new Map<String, String>{
                'endpoint' => credentials.Org_Domain_URL__c
            },
            'streamingCapabilities' => new Map<String, Object>{
                'chunkTypes' => new List<String>{'Text'}
            },
            'bypassUser' => true
        };
        
        req.setBody(JSON.serialize(requestBody));
        
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            return (String) responseMap.get('sessionId');
        }
        throw new CalloutException('Failed to create session: ' + res.getBody());
    }
    
    /**
     * @description Sends a message to the AI agent and gets a response
     * @param agentId The ID of the agent
     * @param sequenceId The sequence number of the message
     * @param messageText The text of the message
     * @return String The JSON response from the agent
     * @throws CalloutException if message sending fails
     */
    @AuraEnabled
    public static String sendSynchronousMessageFormat(String agentId, Integer sequenceId, String messageText) {
        String accessToken = getAccessToken();
        String sessionId = createSession(agentId);
        String endpoint = String.format(
            credentials.Endpoint_URL__c + MESSAGES_ENDPOINT,
            new String[] { sessionId }
        );
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', CONTENT_TYPE_JSON);
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        req.setHeader('Accept', CONTENT_TYPE_JSON);
        req.setTimeout(TIMEOUT);
        
        List<Map<String, Object>> variables = new List<Map<String, Object>>{
            new Map<String, Object>{
                'name' => '$Context.EndUserLanguage',
                'type' => 'Text',
                'value' => 'en_US'
            },
            new Map<String, Object>{
                'name' => 'AgentId',
                'type' => 'Text',
                'value' => agentId
            }
        };
        
        Map<String, Object> requestBody = new Map<String, Object>{
            'message' => new Map<String, Object>{
                'sequenceId' => sequenceId,
                'type' => 'Text',
                'text' => messageText
            },
            'variables' => variables
        };
        
        req.setBody(JSON.serialize(requestBody));
        
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() == 200) {
            ServiceAgentSessionWrapper sessionResponse = (ServiceAgentSessionWrapper) JSON.deserialize(res.getBody(), ServiceAgentSessionWrapper.class);
           System.debug('Wrapper  : ' + sessionResponse);
		   System.debug('messages[0]  : ' + sessionResponse.messages[0]);
           System.debug('messages[0].message  : ' + sessionResponse.messages[0].message);
           string response = sessionResponse.messages[0].message;
           return response; // Return the full response as a JSON string
           // return res.getBody();
        }
        throw new CalloutException('Failed to send message: ' + res.getBody());
    }
}