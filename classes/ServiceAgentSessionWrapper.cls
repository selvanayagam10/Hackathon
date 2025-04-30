public class ServiceAgentSessionWrapper {
	public links urlLinks{get;set;}
	public list<messages> messages{get;set;}
	public String sessionId{get;set;}
	public class session{
		public String href{get;set;}
	}
	public class messages{
		public String type{get;set;}
		public String id{get;set;}
		public Boolean isContentSafe{get;set;}
		public String message{get;set;}
		public String planId{get;set;}
		public list<String> result{get;set;}
		public String feedbackId{get;set;}
		public list<String> citedReferences{get;set;}
		public String href{get;set;}
	}
	public class endSession{
		public String href{get;set;}
	}
	public class links{
		public session session{get;set;}
		public messages messages{get;set;}
		public endSession ends{get;set;}
		public String self{get;set;}
	}
}