using System.IdentityModel.Tokens.Jwt;
using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace backend.Controllers
{
    // [Authorize]
    public class ProjectTaskController : BaseApiController
    {
        private readonly DataContext _context;
        private readonly INotificationService _notificationService;

        public ProjectTaskController(DataContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost] // POST: api/projectTask/
        public async Task<ActionResult<ProjectTask>> CreateTask(ProjectTaskDto taskDto)
        {
            if (!await RoleCheck(taskDto.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var project = await _context.Projects.FindAsync(taskDto.ProjectId);
            if (taskDto.StartDate < DateTime.UtcNow.Date || taskDto.StartDate < project.StartDate || taskDto.EndDate > project.EndDate)
                return ValidationProblem("Start and end date must be set within the project dates and can't be in past.");

            var task = new ProjectTask
            {
                TaskName = taskDto.TaskName,
                Description = taskDto.Description,
                StartDate = taskDto.StartDate,
                EndDate = taskDto.EndDate,
                ProjectId = taskDto.ProjectId,
                TskStatusId = _context.TaskStatuses
                        .Where(ts => ts.ProjectId == taskDto.ProjectId && ts.Position == 0)
                        .Select(ts => ts.Id)
                        .FirstOrDefault(),
                DateCreated = DateTime.Now, // postavlja vreme i datum kad je task kreiran
                AppUserId = taskDto.AppUserId,
                ProjectSectionId = taskDto.ProjectSectionId != 0 ? taskDto.ProjectSectionId : null,
            };

            await _context.ProjectTasks.AddAsync(task);
            await _context.SaveChangesAsync();
            await updateProgress(task.ProjectId);
            // ne obavestavamo sami sebe vise o kreaciji task-a
            if (taskDto.CreatorId != taskDto.AppUserId)
            {
                await _notificationService.TriggerTaskNotification(task.Id);
            }
            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet] // GET: api/projectTask/
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetProjectTasks()
        {
            var tasks = await _context.ProjectTasks
                .Select(task => new
                {
                    task.Id,
                    task.TaskName,
                    task.Description,
                    task.StartDate,
                    task.EndDate,
                    task.ProjectId,
                    task.TskStatus.StatusName,
                    task.TskStatus.Color,
                    task.ProjectSection.SectionName,
                    task.AppUser
                })
                .ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("{task_id}/{userId}")] // GET: api/projectTask/2
        public async Task<ActionResult<ProjectTask>> GetProjectTask(int task_id, int userId)
        {
            var task = await _context.ProjectTasks
            .Include(t => t.AppUser)
            .Select(task => new
            {
                task.Id,
                task.TaskName,
                task.Description,
                task.StartDate,
                task.EndDate,
                task.ProjectId,
                task.TskStatus.StatusName,
                task.TskStatus.Color,
                task.ProjectSection.SectionName,
                task.Project,
                AppUser = task.AppUser,
                ProjectSection = task.ProjectSection,
                Dependencies = _context.TaskDependencies.Where(dependency => dependency.TaskId == task.Id).Select(dependency => dependency.DependencyTaskId).ToList(),
                ProjectRole = _context.ProjectMembers
                                        .Where(member => member.AppUserId == userId && member.ProjectId == task.ProjectId)
                                        .Select(member => member.ProjectRole)
                                        .FirstOrDefault()
            })
            .FirstOrDefaultAsync(t => t.Id == task_id);

            if (task == null)
            {
                return NotFound();
            }
            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetTasksByUserId(int userId)
        {
            var tasks = await _context.ProjectTasks
                                      .Where(task => task.AppUserId == userId && !task.IsOriginProjectArchived)
                                      .Select(task => new
                                      {
                                          task.Id,
                                          task.TaskName,
                                          task.Description,
                                          task.StartDate,
                                          task.EndDate,
                                          task.ProjectId,
                                          task.TskStatus.StatusName,
                                          task.TskStatus.Color,
                                          task.ProjectSection.SectionName,
                                          task.Project,
                                          AppUser = _context.Users.FirstOrDefault(u => u.Id == task.AppUserId),
                                          Dependencies = _context.TaskDependencies.Where(dependency => dependency.TaskId == task.Id).Select(dependency => dependency.DependencyTaskId).ToList(),
                                          ProjectRole = _context.ProjectMembers
                                        .Where(member => member.AppUserId == userId && member.ProjectId == task.ProjectId)
                                        .Select(member => member.ProjectRole)
                                        .FirstOrDefault()
                                      })
                                      .ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("updateTicoStatus/{id}")] // PUT: api/projectTask/updateStatus/5
        public async Task<ActionResult<ProjectTask>> UpdateTaskStatus(int id, ProjectTaskDto taskDto)
        {
            if (!await RoleCheck(taskDto.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager, ProjectRole.Participant]))
                return Unauthorized("Invalid role");

            var task = await _context.ProjectTasks.FirstOrDefaultAsync(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }
            bool wasInReview = false;
            //stari status i ono sto je on bio
            var status = await _context.TaskStatuses.FirstOrDefaultAsync(x=>x.Id == task.TskStatusId);
            if(status.StatusName.Equals("InReview")){
                wasInReview = true;
            }
            task.TskStatusId = taskDto.TaskStatusId;

            await _context.SaveChangesAsync();
            //novi status i ponasanja u odnosu na njega
            var newstatus = await _context.TaskStatuses.FirstOrDefaultAsync(x=>x.Id==taskDto.TaskStatusId);
            if(newstatus.StatusName.Equals("InReview")){//saljem ga u review
                await _notificationService.notifyTaskCompleted(task, (int)taskDto.senderid);
            }
            else if(wasInReview && !newstatus.StatusName.Equals("InReview")){
                await _notificationService.revokeCompletionNotif(id,(int)taskDto.senderid);
            }
            await updateProgress(task.ProjectId);

            return Ok(new {message="Task status updated successfully."});
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("updateStatus/{taskId}/{statusName}")]
        public async Task<ActionResult<ProjectTaskDto>> UpdateTaskStatus1(int taskId, string statusName,[FromBody] int senderid)
        {
            var task = await _context.ProjectTasks
                .Include(t => t.TskStatus)
                .FirstOrDefaultAsync(t => t.Id == taskId);
            bool wasArchived = false;
            bool wasInReview = false;
            if (task.TskStatus.StatusName.Equals("Archived"))
            {
                wasArchived = true;
            }
            if(task.TskStatus.StatusName.Equals("InReview")){
                wasInReview = true;
            }
            if (task == null)
            {
                return NotFound();
            }

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager, ProjectRole.Participant]))
                return Unauthorized("Invalid role.");

            var status = await _context.TaskStatuses
                .FirstOrDefaultAsync(s => s.StatusName == statusName && s.ProjectId == task.ProjectId);

            if (status == null)
            {
                return NotFound("Status not found.");
            }


            task.TskStatusId = status.Id;
            await _context.SaveChangesAsync();
            if (statusName.Equals("Archived"))
            {
                _notificationService.ArchiveRelatedTaskNotifications(task.Id);
            }
            else if (wasArchived)
            {
                _notificationService.DeArchiveRelatedTaskNotifications(task.Id);
            }
            else if (statusName.Equals("InReview"))
            {
                await _notificationService.notifyTaskCompleted(task,senderid);
            }
            else if(wasInReview && !statusName.Equals("InReview")){
                //ako je bio u review
                await _notificationService.revokeCompletionNotif(task.Id,senderid);
            }

            task = await _context.ProjectTasks
                .Include(t => t.TskStatus)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            var taskDto = new ProjectTaskDto
            {
                Id = task.Id,
                TaskName = task.TaskName,
                Description = task.Description,
                StartDate = task.StartDate,
                EndDate = task.EndDate,
                TaskStatusId = task.TskStatusId,
                AppUserId = (int)task.AppUserId,
                ProjectId = task.ProjectId,
                ProjectSectionId = task.ProjectSectionId

            };

            await updateProgress(task.ProjectId);
            return taskDto;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskName/{id}/{taskName}")]
        public async Task<ActionResult<ProjectTask>> ChangeTaskName(int id, string taskName)
        {
            if(taskName.Length==0 || taskName.Length>100)
            {
                return ValidationProblem("Task name must be between 1 and 100 characters long.");
            }

            var task = await _context.ProjectTasks.FindAsync(id);

            if (task == null)
                return BadRequest("Task doesn't exist.");

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role.");

            task.TaskName = taskName;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskDescription")]
        public async Task<ActionResult<ProjectTask>> changeTaskDescription(UpdateTaskDescription dto)
        {
            var task = await _context.ProjectTasks.FindAsync(dto.Id);

            if (task == null)
                return BadRequest("Task doesn't exist.");

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role.");

            task.Description = dto.Description;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskDueDate/{id}")]
        public async Task<ActionResult<ProjectTask>> changeTaskDueDate(int id, DateTimeDto1 dto)
        {
            var task = await _context.ProjectTasks.FindAsync(id);

            if (task == null)
                return BadRequest("Task doesn't exist.");

            if (task.StartDate > dto.StartDate)
                return BadRequest("Start date must be before or equal to end date.");

            if (dto.EndDate > dto.ProjectEndDate)
                return BadRequest("Task end date cannot be set after project end date.");

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role.");

            task.EndDate = dto.EndDate;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskAppUserId/{id}/{appUserId}")]
        public async Task<ActionResult<ProjectTask>> changeTaskAppUserId(int id, int appUserId,[FromBody] int senderid)
        {
            var task = await _context.ProjectTasks.FindAsync(id);

            if (task == null)
                return BadRequest("Task doesn't exist");
                

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            if (appUserId!=0)
            {
                int previousappuser = 0;
                if(task.AppUserId!=null) previousappuser = (int)task.AppUserId;

                task.AppUserId = appUserId;
                
                if(appUserId != senderid)  {
                    if(previousappuser!=0) await _notificationService.DeleteRelatedAssignmentNotificationTask(previousappuser,task.Id);
                    await _notificationService.TriggerTaskNotification(task.Id);
                }
            }
            else
            {
                task.AppUserId = null; 
            }

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskSectionId/{id}/{sectionId}")]
        public async Task<ActionResult<ProjectTask>> changeTaskSectionId(int id, int sectionId)
        {
            var task = await _context.ProjectTasks.FindAsync(id);

            if (task == null)
                return BadRequest("Task doesn't exist");

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            task.ProjectSectionId = sectionId != 0 ? sectionId : null;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("changeTaskSchedule")] // GET: api/projectTask/changeTaskSchedule
        public async Task<ActionResult<ProjectTask>> ChangeTaskSchedule(TaskScheduleDto dto)
        {
            var task = await _context.ProjectTasks.FindAsync(dto.Id);

            if (task == null)
                return BadRequest("Task doesn't exists.");

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner]))
                return Unauthorized("Invalid role.");

            if (dto.StartDate != null) task.StartDate = (DateTime)dto.StartDate;
            if (dto.EndDate != null) task.EndDate = (DateTime)dto.EndDate;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("addTaskDependency")] // GET: api/projectTask/addTaskDependency
        public async Task<ActionResult<TaskDependency>> AddTaskDependency(List<TaskDependencyDto> dtos)
        {
            var test = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == dtos[0].TaskId);

            if (!await RoleCheck(test.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            foreach (var dto in dtos)
            {
                var existingDependency = await _context.TaskDependencies
                .AnyAsync(dep => dep.TaskId == dto.TaskId && dep.DependencyTaskId == dto.DependencyTaskId);

                if (!existingDependency)
                {
                    var newDependency = new TaskDependency
                    {
                        TaskId = dto.TaskId,
                        DependencyTaskId = dto.DependencyTaskId
                    };

                    _context.TaskDependencies.Add(newDependency);
                }

                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("deleteTaskDependency")] // POST: api/projectTask/deleteTaskDependency
        public async Task<ActionResult> DeleteTaskDependency(TaskDependencyDto dto)
        {
            var test = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == dto.TaskId);

            if (!await RoleCheck(test.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var dependencyToDelete = await _context.TaskDependencies
                .FirstOrDefaultAsync(dep => dep.TaskId == dto.TaskId && dep.DependencyTaskId == dto.DependencyTaskId);

            if (dependencyToDelete != null)
            {
                _context.TaskDependencies.Remove(dependencyToDelete);
                await _context.SaveChangesAsync();
                return Ok();
            }
            else
            {
                var taskExists = await _context.ProjectTasks.AnyAsync(t => t.Id == dto.TaskId);
                if (!taskExists)
                {
                    return NotFound("Task not found.");
                }
                return NotFound("Dependency not found.");
            }

        }
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("deleteAllTaskDependency")] // POST: api/projectTask/deleteTaskDependency
        public async Task<ActionResult> DeleteAllTaskDependency(List<TaskDependencyDto> dtos)
        {
        foreach (var dto in dtos)
        {
            var task = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == dto.TaskId);

            if (task == null)
            {
                return NotFound($"Task with ID {dto.TaskId} not found.");
            }

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var dependencyToDelete = await _context.TaskDependencies
                .FirstOrDefaultAsync(dep => dep.TaskId == dto.TaskId && dep.DependencyTaskId == dto.DependencyTaskId);

            if (dependencyToDelete != null)
            {
                _context.TaskDependencies.Remove(dependencyToDelete);
            }
            else
            {
                return NotFound($"Dependency not found for Task ID {dto.TaskId} and Dependency Task ID {dto.DependencyTaskId}.");
            }
        }

        await _context.SaveChangesAsync();
        return Ok();

        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getAllTasksDependencies")]
        public async Task<ActionResult<IEnumerable<TaskDependency>>> GetAllTasksDependencies()
        {
            var tasks = await _context.TaskDependencies.ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getTaskDependencies/{id}")]
        public async Task<ActionResult<IEnumerable<TaskDependency>>> GetTaskDependencies(int id)
        {
            return await _context.TaskDependencies.Where(x => x.TaskId == id).ToListAsync();
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("AddTaskAssignee")]
        public async Task<ActionResult<ProjectTask>> AddTaskAssignee(int taskId, int userId, int projectId)
        {
            if (!await RoleCheck(projectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var isMember = await _context.ProjectMembers.AnyAsync(pm => pm.AppUserId == userId && pm.ProjectId == projectId);
            if (!isMember)
            {
                return BadRequest("User is not a member of the project.");
            }

            var task = await _context.ProjectTasks.FindAsync(taskId);
            if (task == null)
                return NotFound("Task not found.");

            task.AppUserId = userId;
            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("ByProject/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetTasksByProjectId(int projectId, string sortedColumn = null, int sortedOrder = 0, string searchText = null, string taskStatus = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.ProjectTasks
                .Include(task => task.TskStatus)
                .Include(task => task.ProjectSection)
                .Include(task => task.AppUser)
                .Where(t => t.ProjectId == projectId)
                .Select(task => new
                {
                    task.Id,
                    task.TaskName,
                    task.Description,
                    task.StartDate,
                    task.EndDate,
                    task.ProjectId,
                    StatusName = task.TskStatus.StatusName,
                    task.TskStatus.Color,
                    SectionName = task.ProjectSection.SectionName,
                    FirstName = task.AppUser.FirstName,
                    LastName = task.AppUser.LastName,
                    task.AppUser.ProfilePicUrl,
                    task.ProjectSectionId
                }).AsQueryable();

            if (!string.IsNullOrEmpty(searchText))
            {
                query = query.Where(p =>
                    EF.Functions.Like(p.TaskName.ToLower(), $"%{searchText.ToLower()}%") ||
                    EF.Functions.Like(p.FirstName + " " + p.LastName, $"%{searchText.ToLower()}%")
                );
            }
            if (taskStatus != null)
            {
                if (taskStatus != "All")
                    query = query.Where(p => p.StatusName == taskStatus);
            }
            if (startDate.HasValue && !endDate.HasValue)
            {
                query = query.Where(p => p.StartDate == startDate);
            }
            if (!startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.EndDate == endDate);
            }
            if (startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.StartDate >= startDate && p.EndDate <= endDate);
            }

            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
            {
                switch (sortedColumn)
                {
                    case "TaskName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.TaskName) : query.OrderByDescending(x => x.TaskName);
                        break;
                    case "StartDate":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.StartDate) : query.OrderByDescending(x => x.StartDate);
                        break;
                    case "EndDate":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.EndDate) : query.OrderByDescending(x => x.EndDate);
                        break;
                    case "StatusName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.StatusName) : query.OrderByDescending(x => x.StatusName);
                        break;
                    case "Assignee":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.FirstName + " " + x.LastName) : query.OrderByDescending(x => x.FirstName + " " + x.LastName);
                        break;
                }
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("statuses/{projectId}")] // GET: api/projectTask/statuses/{projectId}
        public ActionResult<IEnumerable<object>> GetTaskStatuses(int projectId)
        {
            var statuses = _context.TaskStatuses
                .Where(status => status.ProjectId == projectId)
                .Select(status => new { id = status.Id, name = status.StatusName, position = status.Position, color = status.Color })
                .ToList();

            return Ok(statuses);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("updateStatusPositions")]
        public async Task<IActionResult> UpdateTaskStatusPositions([FromBody] List<TskStatus> updatedStatuses)
        {
            if (updatedStatuses.Count == 0)
                return BadRequest("No task status positions to update.");

            int projectId = updatedStatuses[0].ProjectId; // Extract projectId from the first status

            if (!await RoleCheck(projectId, new List<ProjectRole> { ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager }))
                return Unauthorized("Invalid role");

            foreach (var status in updatedStatuses)
            {
                var dbStatus = await _context.TaskStatuses.FindAsync(status.Id);
                if (dbStatus != null)
                {
                    dbStatus.Position = status.Position;
                }
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("addTaskStatus")]
        public async Task<IActionResult> AddTaskStatus([FromBody] TaskStatusDto taskStatusDto)
        {
            if (!await RoleCheck(taskStatusDto.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            if (await _context.TaskStatuses.AnyAsync(ts => ts.StatusName == taskStatusDto.StatusName && ts.ProjectId == taskStatusDto.ProjectId))
            {
                return BadRequest("A board with the same name already exists.");
            }

            var inReviewStatus = await _context.TaskStatuses.FirstOrDefaultAsync(ts => ts.StatusName == "InReview" && ts.ProjectId == taskStatusDto.ProjectId);
            var CompletedStatus = await _context.TaskStatuses.FirstOrDefaultAsync(ts => ts.StatusName == "Completed" && ts.ProjectId == taskStatusDto.ProjectId);
            var ArchivedStatus = await _context.TaskStatuses.FirstOrDefaultAsync(ts => ts.StatusName == "Archived" && ts.ProjectId == taskStatusDto.ProjectId);
            var newPosition = inReviewStatus != null ? inReviewStatus.Position : 0;
            if (inReviewStatus != null) inReviewStatus.Position += 1;
            if (CompletedStatus != null) CompletedStatus.Position += 1;
            if (ArchivedStatus != null) ArchivedStatus.Position += 1;

            var newTaskStatus = new TskStatus
            {
                StatusName = taskStatusDto.StatusName,
                Position = newPosition,
                Color = taskStatusDto.Color,
                ProjectId = taskStatusDto.ProjectId
            };

            _context.TaskStatuses.Add(newTaskStatus);
            await _context.SaveChangesAsync();

            return Ok(newTaskStatus);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("sortTasksByDueDate/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> SortTasksByDueDate(int userId, string sortOrder)
        {
            var query = _context.ProjectTasks.AsQueryable();
            switch (sortOrder)
            {
                case "asc":
                    query = query.OrderBy(task => task.EndDate);
                    break;
                case "desc":
                    query = query.OrderByDescending(task => task.EndDate);
                    break;
            }

            var sortedTasks = await query.Where(task => task.AppUserId == userId && task.TskStatusId == task.TskStatus.Id && task.TskStatus.StatusName == "InReview")
                .Select(task => new
                {
                    task.Id,
                    task.TaskName,
                    task.Description,
                    task.StartDate,
                    task.EndDate,
                    task.ProjectId,
                    task.TskStatus.StatusName,
                    task.TskStatus.Color,
                    task.ProjectSection.SectionName,
                    task.AppUser.FirstName,
                    task.AppUser.LastName,
                    task.Project

                })
                .ToListAsync();
            return sortedTasks;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpDelete("deleteTaskStatus/{TaskStatusId}")] // GET: api/projectTask/deleteTaskStatus/{TaskStatusId}
        public async Task<IActionResult> DeleteSection(int TaskStatusId)
        {
            var statusToDelete = await _context.TaskStatuses.FindAsync(TaskStatusId);
            if (statusToDelete == null)
            {
                return NotFound("Section not found.");
            }

            if (!await RoleCheck(statusToDelete.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var proposedStatus = await _context.TaskStatuses.FirstOrDefaultAsync(ts => ts.StatusName == "Proposed" && ts.ProjectId == statusToDelete.ProjectId);
            if (proposedStatus == null)
            {
                return NotFound("Proposed status not found in the project.");
            }

            var tasksToUpdate = await _context.ProjectTasks.Where(t => t.TskStatusId == TaskStatusId).ToListAsync();
            foreach (var task in tasksToUpdate)
            {
                task.TskStatusId = proposedStatus.Id;
            }

            // brisanje TskStatus (section)
            _context.TaskStatuses.Remove(statusToDelete);
            await _context.SaveChangesAsync();

            // sortiranje preostalih statusa
            var remainingStatuses = await _context.TaskStatuses
                .Where(ts => ts.ProjectId == statusToDelete.ProjectId)
                .OrderBy(ts => ts.StatusName == "Proposed" ? 0 : ts.StatusName == "InProgress" ? 1 : ts.StatusName == "InReview" ? int.MaxValue - 2 : ts.StatusName == "Completed" ? int.MaxValue - 1 : ts.StatusName == "Archived" ? int.MaxValue : 2)
                .ToListAsync();

            for (int i = 0; i < remainingStatuses.Count; i++)
            {
                remainingStatuses[i].Position = i;
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = "Section deleted and tasks updated to Proposed status." });
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("user/{userId}/count1/{count}")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetNewTasksByUserId(int userId, int count, string sortedColumn = null, int sortedOrder = 0)
        {
            var query = _context.ProjectTasks
       .Where(task => task.AppUserId == userId && task.TskStatusId == task.TskStatus.Id && task.TskStatus.StatusName != "InReview"
                      && task.TskStatus.StatusName != "Completed" && task.TskStatus.StatusName != "Archived" && !task.IsOriginProjectArchived)
       .Take(count)
       .OrderByDescending(task => task.DateCreated)
       .Select(task => new
       {
           task.Id,
           task.TaskName,
           task.Description,
           task.StartDate,
           task.EndDate,
           task.ProjectId,
           task.TskStatus.StatusName,
           task.TskStatus.Color,
           task.ProjectSection.SectionName,
           task.Project,
           ProjectRole = _context.ProjectMembers
               .Where(member => member.AppUserId == userId && member.ProjectId == task.ProjectId)
               .Select(member => member.ProjectRole)
               .FirstOrDefault()
       });

            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
            {
                switch (sortedColumn)
                {
                    case "TaskName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.TaskName) : query.OrderByDescending(x => x.TaskName);
                        break;
                    case "DueDate":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.EndDate) : query.OrderByDescending(x => x.EndDate);
                        break;
                    case "SectionName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.SectionName) : query.OrderByDescending(x => x.SectionName);
                        break;
                    case "OriginProject":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.Project.ProjectName) : query.OrderByDescending(x => x.Project.ProjectName);
                        break;
                }
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("user/{userId}/count2/{count}")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetSoonTasksByUserId(int userId, int count, string sortedColumn = null, int sortedOrder = 0)
        {
            var query = _context.ProjectTasks
                .Where(task => task.AppUserId == userId && task.TskStatusId == task.TskStatus.Id && task.TskStatus.StatusName != "InReview"
                && task.TskStatus.StatusName != "Completed" && task.TskStatus.StatusName != "Archived" && !task.IsOriginProjectArchived)
                .Take(count)
                .OrderBy(task => task.EndDate)
                .Select(task => new
                {
                    task.Id,
                    task.TaskName,
                    task.Description,
                    task.StartDate,
                    task.EndDate,
                    task.ProjectId,
                    task.TskStatus.StatusName,
                    task.TskStatus.Color,
                    task.ProjectSection.SectionName,
                    task.Project,
                    AppUser = _context.Users.FirstOrDefault(u => u.Id == task.AppUserId),
                    ProjectRole = _context.ProjectMembers
                        .Where(member => member.AppUserId == userId && member.ProjectId == task.ProjectId)
                        .Select(member => member.ProjectRole)
                        .FirstOrDefault()
                });


            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
            {
                switch (sortedColumn)
                {
                    case "TaskName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.TaskName) : query.OrderByDescending(x => x.TaskName);
                        break;
                    case "DueDate":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.EndDate) : query.OrderByDescending(x => x.EndDate);
                        break;
                    case "SectionName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.SectionName) : query.OrderByDescending(x => x.SectionName);
                        break;
                    case "OriginProject":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.Project.ProjectName) : query.OrderByDescending(x => x.Project.ProjectName);
                        break;
                }
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("user/{userId}/count3/{count}")]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetClosedTasksByUserId(int userId, int count, string sortedColumn = null, int sortedOrder = 0)
        {
            var query = _context.ProjectTasks
                .Where(task => task.AppUserId == userId && task.TskStatusId == task.TskStatus.Id && task.TskStatus.StatusName == "InReview" && !task.IsOriginProjectArchived)
                .Take(count)
                .Select(task => new
                {
                    task.Id,
                    task.TaskName,
                    task.Description,
                    task.StartDate,
                    task.EndDate,
                    task.ProjectId,
                    task.TskStatus.StatusName,
                    task.TskStatus.Color,
                    task.ProjectSection.SectionName,
                    task.Project,
                    AppUser = _context.Users.FirstOrDefault(u => u.Id == task.AppUserId),
                    ProjectRole = _context.ProjectMembers
                        .Where(member => member.AppUserId == userId && member.ProjectId == task.ProjectId)
                        .Select(member => member.ProjectRole)
                        .FirstOrDefault()
                });

            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
            {
                switch (sortedColumn)
                {
                    case "TaskName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.TaskName) : query.OrderByDescending(x => x.TaskName);
                        break;
                    case "DueDate":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.EndDate) : query.OrderByDescending(x => x.EndDate);
                        break;
                    case "SectionName":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.SectionName) : query.OrderByDescending(x => x.SectionName);
                        break;
                    case "OriginProject":
                        query = sortedOrder == 1 ? query.OrderBy(x => x.Project.ProjectName) : query.OrderByDescending(x => x.Project.ProjectName);
                        break;
                }
            }

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        // kada pomeram taskove iz archived saljem listu zbog boljih performansi
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("UpdateArchTasksToCompleted")]
        public async Task<IActionResult> UpdateTasksToCompleted([FromBody] List<int> taskIds)
        {
            var test = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == taskIds[0]);

            if (test == null)
            {
                return BadRequest("No tasks to update.");
            }

            if (!await RoleCheck(test.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role.");

            var InProgressId = await _context.TaskStatuses
                .Where(s => s.StatusName == "InProgress")
                .Select(s => s.Id)
                .FirstOrDefaultAsync();

            if (InProgressId == 0)
            {
                return NotFound("InProgress status not found.");
            }

            var tasksToUpdate = await _context.ProjectTasks
                .Where(t => taskIds.Contains(t.Id))
                .ToListAsync();

            foreach (var task in tasksToUpdate)
            {
                task.TskStatusId = InProgressId;
                _notificationService.DeArchiveRelatedTaskNotifications(task.Id);
            }
            await _context.SaveChangesAsync();

            var projectId = tasksToUpdate[0].ProjectId;
            await updateProgress(projectId);

            return Ok(new { message = "Tasks updated to InProgress status." });
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("timeUpdateGantt/{id}")]
        public async Task<ActionResult> UpdateTaskTimeGantt(int id, DateTimeDto newDateTime)
        {
            var task = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == id);

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            task.StartDate = newDateTime.StartDate.AddDays(1);
            task.EndDate = newDateTime.EndDate.AddDays(1);

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("changeSectionGantt")]
        public async Task<IActionResult> ChangeSectionGantt(SectionChangeDTO dto)
        {

            var task = await _context.ProjectTasks.FirstOrDefaultAsync(x => x.Id == dto.taskId);
            var section = await _context.ProjectSections.FirstOrDefaultAsync(x => x.Id == dto.sectionId);

            if (task == null)
            {
                return NotFound("TASK ID NOT FOUND " + dto.taskId);
            }

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner]))
                return Unauthorized("Invalid role");

            if (section == null && dto.sectionId != 0)
            {
                // ako je ovo stanje onda je neki error
                // section id 0 ce da bude prosledjen sa fronta samo u slucaju izbacivanja iz sectiona
                // ukoliko dobijem null ovde a prosledio sam !=0 sectionId, to znaci da sam poslao nepostojeci section
                return NotFound("Section Id not found " + dto.sectionId);
            }

            if (dto.sectionId != 0)
            { // ako smo prosledili id 0 onda ide u no section
                task.ProjectSectionId = dto.sectionId;
                task.ProjectSection = section;
            }
            else
            {
                task.ProjectSectionId = null;
                task.ProjectSection = null;
            }
            await _context.SaveChangesAsync();
            return Ok();

        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpDelete("deleteTask/{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            var task = await _context.ProjectTasks.FindAsync(taskId);

            if (!await RoleCheck(task.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            if (task == null)
            {
                return NotFound("Task not found.");
            }

            var taskDependencies = _context.TaskDependencies.Where(dep => dep.TaskId == taskId || dep.DependencyTaskId == taskId);
            _context.TaskDependencies.RemoveRange(taskDependencies);

            var comments = _context.Comments.Where(c => c.TaskId == taskId);
            _context.Comments.RemoveRange(comments);

            _notificationService.ArchiveRelatedTaskNotifications(task.Id);

            var projectId = task.ProjectId;
            _context.ProjectTasks.Remove(task);

            await _context.SaveChangesAsync();
            await updateProgress(projectId);

            return Ok(new { message = "Task and related data deleted successfully." });
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("updateProgress/{projectId}")]
        public async Task<ActionResult> updateProgress(int projectId)
        {
            if (!await RoleCheck(projectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner]))
                return Unauthorized("Invalid role");

            var project = await _context.Projects.FindAsync(projectId);
            var TasksCount = await _context.ProjectTasks.CountAsync(x => x.ProjectId == projectId && x.TskStatus.StatusName != "Archived");
            var CompletedTasksCount = await _context.ProjectTasks.CountAsync(x => x.TskStatus.StatusName == "Completed" && x.ProjectId == projectId);

            project.Progress = TasksCount == 0 ? 0 : (int)(((double)CompletedTasksCount / TasksCount) * 100);

            await _context.SaveChangesAsync();

            return Ok("Project progress updated.");
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getTaskByName/{taskName}/{projectId}")]
        public async Task<ActionResult<int>> GetTaskByName(string taskName, int projectId)
        {
            var task = await _context.ProjectTasks.FirstOrDefaultAsync(task => task.TaskName.ToLower() == taskName.ToLower() && task.ProjectId == projectId);
            return Ok(task);
        }

        public async Task<bool> RoleCheck(int projectId, List<ProjectRole> roles)
        {
            string authHeader = HttpContext.Request.Headers["Authorization"];
            if (authHeader != null && authHeader.StartsWith("Bearer "))
            {
                string token = authHeader.Substring("Bearer ".Length).Trim();
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);

                var userid = int.Parse(jsonToken.Claims.FirstOrDefault(c => c.Type == "nameid").Value);
                var ProjectMember = await _context.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectId == projectId && x.AppUserId == userid && roles.Contains(x.ProjectRole));

                return ProjectMember != null;
            }
            return false;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("RenameTaskStatus")]
        public async Task<IActionResult> RenameTaskStatus([FromBody] TaskStatusDto taskStatusDto)
        {
            if (!await RoleCheck(taskStatusDto.ProjectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner, ProjectRole.Manager]))
                return Unauthorized("Invalid role");
                
            if (string.IsNullOrEmpty(taskStatusDto.StatusName) || taskStatusDto.StatusName.Length > 30)
            {
                return BadRequest("Status name must be between 1 and 30 characters long.");
            }

            var status = await _context.TaskStatuses.FindAsync(taskStatusDto.Id);
            if (status == null)
            {
                return NotFound("Task status not found.");
            }

            status.StatusName = taskStatusDto.StatusName;
            await _context.SaveChangesAsync();

            return Ok();
        }
        
    }
}