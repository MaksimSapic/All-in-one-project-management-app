using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using backend.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
namespace backend.Services
{
    public class NotificationService:INotificationService
    {
        private readonly IHubContext<NotificationsHub,INotificationsHub> _hubContext;
        private readonly DataContext _context;
        public NotificationService(IHubContext<NotificationsHub,
        INotificationsHub> hubContext,
        DataContext context){
            _hubContext = hubContext;
            _context = context;
        }

        public async Task TriggerNotification(int task_id,int sender_id,int comment_id,NotificationType type) {
            var Users = await GetUsersForTaskNotification(task_id, sender_id);
            var sender = await _context.Users.FirstOrDefaultAsync(x => x.Id == sender_id);
            var task = await _context.ProjectTasks.FirstOrDefaultAsync(x=>x.Id == task_id);
            Users.Remove(sender_id);
            for(int i=0;i<Users.Count;i++){
                Notification notification = new Notification{
                    reciever_id = Users[i],
                    sender_id = sender_id,
                    comment_id = comment_id,
                    task_id=task_id,
                    Type = type, // 1 attachment, 2 comment, 3 novi task, 4 novi projekat
                    dateTime = DateTime.UtcNow,
                    read=false,
                    originArchived = false
                };
                await _context.Notifications.AddAsync(notification);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.Group(Users[i].ToString())
                    .Notify(
                         new NotificationDto{
                            Id = notification.Id,
                            Task = new ProjectTaskDto{
                                Id = task.Id,
                                TaskName = task.TaskName,
                                AppUserId = (int)task.AppUserId,
                                ProjectId = (int)task.ProjectId,
                                StartDate = task.StartDate,
                                EndDate = task.EndDate                            
                                },
                            Comment = notification.Comment,
                            Project = notification.Project,
                            Sender = notification.Sender,
                            dateTime = notification.dateTime.AddHours(2),
                            Type = notification.Type,
                            read = notification.read
                         });
            }
        }

        public async Task TriggerTaskNotification(int task_id){
            // zadatak ove funkcije jeste da posalje notifikaciju korisniku kojem je dodeljen zadatak ili projekat
            var task = await _context.ProjectTasks.FirstOrDefaultAsync(x=>x.Id == task_id);
            var reciever = await _context.Users.FirstOrDefaultAsync(x=>x.Id == task.AppUserId);
            if(reciever==null) throw new Exception("reciever not found");
            Notification notification = new Notification{
                reciever_id = reciever.Id,
                task_id=task.Id,
                Type = NotificationType.TaskAssignment, // 1 attachment, 2 comment, 3 novi task, 4 novi projekat
                dateTime = DateTime.UtcNow,
                read=false,
                originArchived = false
            };
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group(reciever.Id.ToString())
                    .Notify(
                         new NotificationDto{
                            Id = notification.Id,
                            Comment = notification.Comment,
                            Task = new ProjectTaskDto{
                                Id = task.Id,
                                TaskName = task.TaskName,
                                AppUserId = (int)task.AppUserId,
                                ProjectId = (int)task.ProjectId,
                                StartDate = task.StartDate,
                                EndDate = task.EndDate   
                            },
                            Project = notification.Project,
                            Sender = notification.Sender,
                            dateTime = notification.dateTime.AddHours(2),
                            Type = notification.Type,
                            read = notification.read
                         });
        }
        public async Task TriggerProjectNotification(int project_id,int reciever_id){
            var project = await _context.Projects.FirstOrDefaultAsync(x => x.Id == project_id);
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == reciever_id);
            if (project == null || user == null)
            {
                throw new Exception("Project or User not found.");
            }
            Notification notification = new Notification{
                reciever_id = user.Id,
                project_id = project.Id,
                Type=NotificationType.ProjectAssignment,
                dateTime = DateTime.UtcNow,
                read=false,
                originArchived = false
            };
            await _context.Notifications.AddAsync(notification);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group(reciever_id.ToString())
                    .Notify(
                         new NotificationDto{
                            Id = notification.Id,
                            Comment = notification.Comment,
                            Task = null,
                            Project = notification.Project,
                            Sender = notification.Sender,
                            dateTime = notification.dateTime.AddHours(2),
                            Type = notification.Type,
                            read = notification.read
                         });
        }

        public async Task notifyTaskCompleted(ProjectTask task,int senderid){
            var Owner = await _context.ProjectMembers
            .FirstOrDefaultAsync(x=>x.ProjectId == task.ProjectId &&
                                     x.ProjectRole == ProjectRole.ProjectOwner);
            if(Owner!=null){
                var owner = await _context.Users.FirstOrDefaultAsync(x=>x.Id == Owner.AppUserId);
                if(owner != null && owner.Id != task.AppUserId && owner.Id!=senderid){
                    Notification notification = new Notification
                    {
                        task_id = task.Id,
                        sender_id = task.AppUserId,
                        reciever_id = owner.Id,
                        Type = NotificationType.TaskCompleted,
                        dateTime = DateTime.UtcNow,
                        read = false,
                        originArchived = false
                    };
                    await _context.Notifications.AddAsync(notification);
                    await _context.SaveChangesAsync();
                    var sender = await _context.Users.FirstOrDefaultAsync(x=>x.Id == task.AppUserId);
                    var notifDTO = new NotificationDto{
                                Id = notification.Id,
                                Reciever = owner,
                                Comment = notification.Comment,
                                Task = new ProjectTaskDto{
                                    Id = task.Id,
                                    TaskName = task.TaskName,
                                    AppUserId = (int)task.AppUserId,
                                    ProjectId = (int)task.ProjectId,
                                    StartDate = task.StartDate,
                                    EndDate = task.EndDate   
                                },
                                Sender = sender,
                                dateTime = notification.dateTime,
                                Type = notification.Type,
                                read = notification.read
                            };
                    await _hubContext.Clients.Group(owner.Id.ToString()).Notify(notifDTO);   
                }   
            }  
        }

        public async Task<List<int>> GetUsersForTaskNotification(int taskId, int initiatorId)
        {
            var users = new List<int>();

            var projectId = await _context.ProjectTasks.Where(t => t.Id == taskId).Select(t => t.ProjectId).FirstOrDefaultAsync();

            var projectOwners = await _context.ProjectMembers
                .Where(x => x.ProjectId == projectId && (x.ProjectRole == ProjectRole.ProjectOwner || x.ProjectRole == ProjectRole.ProjectManager))
                .Select(x => x.AppUserId)
                .ToListAsync();
            users.AddRange(projectOwners);

            var projectManagers = await _context.ProjectMembers
                .Where(x => x.ProjectId == projectId && x.ProjectRole == ProjectRole.Manager)
                .Select(x => x.AppUserId)
                .ToListAsync();
            users.AddRange(projectManagers);

     
            var assignee = await _context.ProjectTasks.Where(t => t.Id == taskId).Select(t => t.AppUserId).FirstOrDefaultAsync();
            if (assignee != null) users.Add(assignee.Value);


            var commentersAndUploaders = await _context.Comments.Where(c => c.TaskId == taskId).Select(c => c.SenderId)
                .Union(_context.Comments.Where(a => a.TaskId == taskId).Select(a => a.SenderId))
                .ToListAsync();
            users.AddRange(commentersAndUploaders);

            users = users.Where(u => u != initiatorId).Distinct().ToList();

            return users;
        }

        void CheckUserNotifications(List<Notification> notifications){
            List<int> checkedUsers = new List<int>();
            foreach(Notification n in notifications){
                if(checkedUsers.Any(x=>x==n.reciever_id)==false){
                    CheckUserNotificationState(n.reciever_id);
                    checkedUsers.Add(n.reciever_id);
                }
            }
        }
        void CheckUserNotificationState(int id){
            bool flag = _context.Notifications.Any(x=> x.reciever_id == id && x.read == false && x.originArchived == false);
            _hubContext.Clients.Group(id.ToString()).notifyState(flag);
        }
        public async void ArchiveRelatedTaskNotifications(int id){
            var notifications = await  _context.Notifications.Where(x => x.task_id == id).ToListAsync();
            if(notifications!=null){
                foreach(Notification n in notifications){
                    n.originArchived = true;
                }
                await _context.SaveChangesAsync();
                CheckUserNotifications(notifications);
            }
        }
        public async void ArchiveRelatedProjectNotifications(int id){
            var notifications = await  _context.Notifications.Where(x => x.project_id == id || x.Task.ProjectId == id).ToListAsync();
            if(notifications!=null){
                foreach(Notification n in notifications){
                    n.originArchived = true;
                }
                await _context.SaveChangesAsync();
                CheckUserNotifications(notifications);
            }
        }
        public async void DeArchiveRelatedTaskNotifications(int id){
            var notifications = await  _context.Notifications.Where(x => x.task_id == id).ToListAsync();
            if(notifications!=null){
                foreach(Notification n in notifications){
                    n.originArchived = false;
                }
                await _context.SaveChangesAsync();
                CheckUserNotifications(notifications);
                }
        }
        public async void DeArchiveRelatedProjectNotifications(int id){
            var notifications = await  _context.Notifications.Where(x => x.project_id == id || x.Task.ProjectId == id).ToListAsync();
            foreach(Notification n in notifications){
                n.originArchived = false;
            }
            await _context.SaveChangesAsync();
            CheckUserNotifications(notifications);
        }
        public async void DeleteRelatedNotifications(int taskId){
            var notifications = await _context.Notifications.Where(x => x.task_id==taskId).ToListAsync();
            if(notifications!=null){
                _context.Notifications.RemoveRange(notifications);
                await _context.SaveChangesAsync();
                CheckUserNotifications(notifications);
            }
        }
        public async void DeleteUsersProjectNotifications(int userid){
            var notifications = await _context.Notifications.Where(x=>x.reciever_id == userid).ToListAsync();
            if(notifications!=null){
                _context.Notifications.RemoveRange(notifications);
                await _context.SaveChangesAsync();

                CheckUserNotifications(notifications);
            }
        }
        public async Task DeleteRelatedAssignmentNotificationTask(int userid, int taskid){
            var notification = await _context.Notifications.FirstOrDefaultAsync(x=>x.reciever_id == userid && x.Type==NotificationType.TaskAssignment && x.task_id == taskid);

            if (notification != null) {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
                List<Notification> arr = new List<Notification>();
                arr.Add(notification);
                CheckUserNotifications(arr);
            }
        }
        public async Task revokeCompletionNotif(int taskid, int senderid){
            var notification = await _context.Notifications.FirstOrDefaultAsync(x=> (x.sender_id == senderid || x.reciever_id == senderid)&& x.task_id == taskid && x.Type == NotificationType.TaskCompleted);
            if (notification != null) {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
                List<Notification> arr = new List<Notification>();
                arr.Add(notification);
                CheckUserNotifications(arr);
            }
        }
    }
}