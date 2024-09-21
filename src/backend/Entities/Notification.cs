#nullable enable
namespace backend.Entities
{
    public enum NotificationType{
        Attachment, // attachment i comment samo na taskovima postoje
        Comment,
        TaskAssignment,
        ProjectAssignment,
        TaskCompleted
    }
    public class Notification
    {
        public int Id{get;set;} // primary key
        public int? comment_id{get;set;}
        public Comment? Comment{get;set;}
        public int? task_id{get;set;}
        public ProjectTask? Task{get;set;} // foreign key
        public int? project_id{get;set;}
        public Project? Project{get;set;} // foreign key
        public int reciever_id{get;set;}
        public AppUser? Reciever{get;set;} // foreign key
        public int? sender_id{get;set;}
        public AppUser? Sender{get;set;} // foreign key
        public DateTime dateTime{get;set;}
        public NotificationType Type{get;set;}
        public bool read{get;set;}
        public bool? originArchived{get;set;}
    }
}