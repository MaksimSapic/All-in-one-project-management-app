using backend.Entities;
namespace backend.Interfaces
{
    public interface INotificationService
    {
        public Task TriggerNotification(int task_id, int sender_id,int comment_id,NotificationType type); // comment/attachment notifications
        public Task TriggerProjectNotification(int project_id,int reciever_id); // project notifications
        public Task TriggerTaskNotification(int task_id); // task notifications
        public void ArchiveRelatedTaskNotifications(int id);
        public void ArchiveRelatedProjectNotifications(int id);
        public void DeArchiveRelatedTaskNotifications(int id);
        public void DeArchiveRelatedProjectNotifications(int id);
        public void DeleteRelatedNotifications(int id);
        public Task notifyTaskCompleted(ProjectTask task,int senderid);
        public void DeleteUsersProjectNotifications(int id);
        public Task DeleteRelatedAssignmentNotificationTask(int userid,int taskId);
        public Task revokeCompletionNotif(int taskid,int senderid);
    }
}