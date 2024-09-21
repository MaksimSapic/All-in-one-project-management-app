using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    public class ProjectsController : BaseApiController
    {
        private readonly DataContext _context;
        private readonly INotificationService _notificationService;
        public ProjectsController(DataContext context,INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [Authorize(Roles = "ProjectManager")]
        [HttpPost] // POST: api/projects/
        public async Task<ActionResult<Project>> CreateProject(ProjectDto projectDto)
        {
            if(projectDto.StartDate < DateTime.UtcNow.Date)
            {
                return ValidationProblem("Project start date can't be in the past.");
            }

            if(projectDto.EndDate < projectDto.StartDate)
            {
                return ValidationProblem("Project end date must be >= start date and can't be set in the past.");
            }

            var project = new Project
            {
                ProjectName = projectDto.ProjectName,
                Description = projectDto.Description,
                StartDate = projectDto.StartDate,
                EndDate = projectDto.EndDate,
                ProjectStatus = projectDto.ProjectStatus
            };
            await _context.Projects.AddAsync(project);
            await _context.SaveChangesAsync();

            var ProjectCreator = new ProjectMember
            {
                AppUserId = projectDto.AppUserId,
                ProjectId = project.Id,
                ProjectRole = ProjectRole.ProjectManager
            };
            await _context.ProjectMembers.AddAsync(ProjectCreator);
            await _context.SaveChangesAsync();

            // dodavanje inicijalnih statusa
            await AddStarterStatuses(project);
            return project;
        }

        //metoda za dodavanje inicijalnih statusa pri kreiranju projekta
        private async Task AddStarterStatuses(Project project)
        {
            var starterStatuses = new List<TskStatus>
            {
                new TskStatus { StatusName = "Proposed", Position = 0, Project = project, Color = "#007bff" },
                new TskStatus { StatusName = "InProgress", Position = 1, Project = project, Color = "#03c3ec" },
                new TskStatus { StatusName = "InReview", Position = 2, Project = project, Color = "#20c997" },
                new TskStatus { StatusName = "Completed", Position = 3, Project = project, Color = "#71dd37" },
                new TskStatus { StatusName = "Archived", Position = 4, Project = project, Color = "#8592a3" }
            };

            _context.TaskStatuses.AddRange(starterStatuses);
            await _context.SaveChangesAsync();
        }

        [Authorize]
        [HttpGet] // GET: api/projects/
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            var projects = await _context.Projects.ToListAsync();
            return projects;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("{id}")] // GET: api/projects/2
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            return await _context.Projects.FindAsync(id);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getUsersProjects/{userid}")]  // GET: api/projects/getProjects/1
        public async Task<ActionResult<IEnumerable<Project>>> GetUsersProjects(int userid)
        {
            var projects = await _context.Projects
                                         .Join(_context.ProjectMembers,
                                                project => project.Id,
                                                member => member.ProjectId,
                                                (project, member) => new { Project = project, Member = member })
                                         .Where(x => x.Member.AppUserId == userid)
                                         .Select(x => x.Project)
                                         .ToListAsync();
            return projects;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("updateProject")] // PUT: api/projects/updateProject
        public async Task<ActionResult<Project>> UpdateProject(ProjectDto projectDto)
        {
            var project = await _context.Projects.FindAsync(projectDto.ProjectId);
            if((projectDto.EndDate < DateTime.UtcNow.Date) && (project.EndDate != projectDto.EndDate))
                return ValidationProblem("End date can't be in the past.");

            if (project == null)
            {
                return NotFound();
            }

            project.ProjectName = projectDto.ProjectName;
            project.Description = projectDto.Description;
            project.StartDate = projectDto.StartDate;
            project.EndDate = projectDto.EndDate;
            project.ProjectStatus = projectDto.ProjectStatus;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) when (!ProjectExists(projectDto.AppUserId))
            {
                return NotFound();
            }

            return project;
        }

        private bool ProjectExists(int id)
        {
            return _context.Projects.Any(e => e.Id == id);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("addProjectMembers")] 
        public async Task<IActionResult> AddProjectMembers(ProjectMemberDTO[] dtos)
        {
            foreach (var dto in dtos)
            {
                var projectMember = new ProjectMember 
                {
                AppUserId =  dto.AppUserId,
                ProjectId = dto.ProjectId,
                ProjectRole = dto.ProjectRole
                };
                await _context.ProjectMembers.AddAsync(projectMember);
                await _context.SaveChangesAsync();   
                await _notificationService.TriggerProjectNotification(dto.ProjectId,dto.AppUserId);
            }
            return Ok(dtos);
        }
        
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("filterAndPaginate")]
        public async Task<ActionResult<IEnumerable<Project>>> FilterAndPaginateProjects(
            string searchText = null,
            ProjectStatus? projectStatus = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int userId = 0,
            int currentPage = 0,
            int pageSize = 0,
            string sortedColumn = null,
            int sortedOrder = 0)
        {
           var query = _context.Projects.AsQueryable();
           query = query.Where(p => p.ProjectStatus != ProjectStatus.Archived);

            if (!string.IsNullOrEmpty(searchText))
            {
                query = query.Where(p =>
                    EF.Functions.Like(p.ProjectName.ToLower(), $"%{searchText.ToLower()}%") ||
                    _context.ProjectMembers
                        .Where(member => member.ProjectId == p.Id && member.ProjectRole == ProjectRole.ProjectOwner)
                        .Any(member =>
                            EF.Functions.Like(member.AppUser.FirstName + " " + member.AppUser.LastName, $"%{searchText.ToLower()}%")
                        )
                );
            }

            if (projectStatus != null)
            {
                query = query.Where(p => p.ProjectStatus == projectStatus);
            }


            if(startDate.HasValue && !endDate.HasValue)
            {
                query = query.Where(p => p.StartDate == startDate);
            }
            if(!startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.EndDate == endDate);
            }
           if (startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.StartDate >= startDate && p.EndDate <= endDate);
            }
            if (userId != 0)
            {
                query = query.Join(_context.ProjectMembers,
                                project => project.Id,
                                member => member.ProjectId,
                                (project, member) => new { Project = project, Member = member })
                            .Where(x => x.Member.AppUserId == userId)
                            .Select(x => x.Project);
            }
            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
    {
        if (sortedColumn == "ProjectOwner")
        {
            query = sortedOrder == 1
                ? query.OrderBy(x => _context.ProjectMembers
                    .Where(m => m.ProjectId == x.Id && m.ProjectRole == ProjectRole.ProjectOwner)
                    .Select(m => m.AppUser.FirstName + " " + m.AppUser.LastName).FirstOrDefault())
                : query.OrderByDescending(x => _context.ProjectMembers
                    .Where(m => m.ProjectId == x.Id && m.ProjectRole == ProjectRole.ProjectOwner)
                    .Select(m => m.AppUser.FirstName + " " + m.AppUser.LastName).FirstOrDefault());
        }
        else
        {
            query = sortedOrder == 1
                ? query.OrderBy(x => EF.Property<object>(x, sortedColumn))
                : query.OrderByDescending(x => EF.Property<object>(x, sortedColumn));
        }
    }

            // Apply pagination
            var filteredProjects = await query.Skip((currentPage - 1) * pageSize)
                                            .Take(pageSize)
                                            .ToListAsync();

            return filteredProjects;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("countFiltered")]
        public async Task<ActionResult<int>> CountFilteredProjects(
            string searchText = null,
            ProjectStatus? projectStatus = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int userId = 0,
            int currentPage = 0,
            int pageSize = 0,
            string sortedColumn = null,
            int sortedOrder = 0)
        {
           var query = _context.Projects.AsQueryable();
           query = query.Where(p => p.ProjectStatus != ProjectStatus.Archived);

            if (!string.IsNullOrEmpty(searchText))
            {
                query = query.Where(p =>
                    EF.Functions.Like(p.ProjectName.ToLower(), $"%{searchText.ToLower()}%") ||
                    _context.ProjectMembers
                        .Where(member => member.ProjectId == p.Id && member.ProjectRole == ProjectRole.ProjectOwner)
                        .Any(member =>
                            EF.Functions.Like(member.AppUser.FirstName + " " + member.AppUser.LastName, $"%{searchText.ToLower()}%")
                        )
                );
            }

            if (projectStatus != null)
            {
                query = query.Where(p => p.ProjectStatus == projectStatus);
            }


            if(startDate.HasValue && !endDate.HasValue)
            {
                query = query.Where(p => p.StartDate == startDate);
            }
            if(!startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.EndDate == endDate);
            }
           if (startDate.HasValue && endDate.HasValue)
            {
                query = query.Where(p => p.StartDate >= startDate && p.EndDate <= endDate);
            }

            if (userId != 0)
            {
                query = query.Join(_context.ProjectMembers,
                                project => project.Id,
                                member => member.ProjectId,
                                (project, member) => new { Project = project, Member = member })
                            .Where(x => x.Member.AppUserId == userId)
                            .Select(x => x.Project);
            }

            if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
            {
                if (sortedColumn == "ProjectOwner")
                {
                    query = sortedOrder == 1
                        ? query.OrderBy(x => _context.ProjectMembers
                            .Where(m => m.ProjectId == x.Id && m.ProjectRole == ProjectRole.ProjectOwner)
                            .Select(m => m.AppUser.FirstName + " " + m.AppUser.LastName).FirstOrDefault())
                        : query.OrderByDescending(x => _context.ProjectMembers
                            .Where(m => m.ProjectId == x.Id && m.ProjectRole == ProjectRole.ProjectOwner)
                            .Select(m => m.AppUser.FirstName + " " + m.AppUser.LastName).FirstOrDefault());
                }
                else
                {
                    query = sortedOrder == 1
                        ? query.OrderBy(x => EF.Property<object>(x, sortedColumn))
                        : query.OrderByDescending(x => EF.Property<object>(x, sortedColumn));
                }
            }

            // Apply pagination
            var filteredProjects = await query.ToListAsync();

            return filteredProjects.Count;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getUsersProjectsCount/{userid}")]
        public async Task<ActionResult<int>> GetUsersProjectsCount(int userid)
        {
            var projects = await _context.Projects
                                        .Join(_context.ProjectMembers,
                                                project => project.Id,
                                                member => member.ProjectId,
                                                (project, member) => new { Project = project, Member = member })
                                        .Where(x => x.Member.AppUserId == userid && x.Project.ProjectStatus != ProjectStatus.Archived)
                                        .Select(x => x.Project)
                                        .ToListAsync();
            return projects.Count;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getProjectByName/{projectName}")]
        public async Task<ActionResult<int>> GetProjectByName(string projectName)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(project => project.ProjectName.ToLower() == projectName.ToLower());
            return Ok(project);
        }

        // vraca sve AppUser koji su na projektu (tj imaju odgovarajuci ProjectMember entry)
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("GetUsersByProjectId/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersByProjectId(int projectId)
        {
            var users = await _context.ProjectMembers
                .Where(pm => pm.ProjectId == projectId)
                .Select(pm => new { pm.AppUserId, pm.AppUser.FirstName, pm.AppUser.LastName,pm.AppUser.Email, pm.AppUser.ProfilePicUrl, pm.ProjectRole, pm.AppUser.Archived})
                .ToListAsync();

            if (users == null)
            {
                return NotFound("No users found for the given project ID.");
            }

            return Ok(users);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("GetAddableUsers/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAddableUsers(int projectId)
        {
            var users = await _context.Users
            .Where(user => !_context.ProjectMembers.Any(member => member.AppUserId == user.Id && member.ProjectId == projectId) && user.Role != UserRole.Admin && user.Archived==false)
            .Select(user => new { user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl })
            .ToListAsync();

            if (users == null)
            {
                return NotFound("No users found for the given project ID.");
            }

            return Ok(users);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpDelete("DeleteProjectMember/{projectId}/{userId}")]
        public async Task<ActionResult> DeleteProjectMember(int projectId, int userId)
        {
            if (!await RoleCheck(projectId, [ProjectRole.ProjectManager, ProjectRole.ProjectOwner]))
                return Unauthorized("Invalid role");

            var projectMember = await _context.ProjectMembers.FirstOrDefaultAsync(member => member.ProjectId == projectId && member.AppUserId == userId);
            if (projectMember != null)
            {
                // sklanjam korisnika sa taskova na projektu
                var tasks = await _context.ProjectTasks.Where(t => t.ProjectId == projectId && t.AppUserId == userId).ToListAsync();
                foreach (var task in tasks)
                {
                    task.AppUserId = null; // postavljam na null tj not assigned
                }

                _context.ProjectMembers.Remove(projectMember);
                _notificationService.DeleteUsersProjectNotifications(userId);
                await _context.SaveChangesAsync();
                return Ok();
            }
                
            return NotFound();
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("UpdateUsersProjectRole")]
        public async Task<ActionResult> UpdateUsersProjectRole(ProjectMemberDTO dto)
        {
            if(!await RoleCheck(dto.ProjectId,[ProjectRole.ProjectManager,ProjectRole.ProjectOwner]))
                return Unauthorized("Invalid role");

            var projectMember = await _context.ProjectMembers.FirstOrDefaultAsync(member => member.ProjectId == dto.ProjectId && member.AppUserId == dto.AppUserId);
            if(projectMember != null)
            {
                projectMember.ProjectRole = dto.ProjectRole;
                await _context.SaveChangesAsync();
                return Ok();
            }
                
            return NotFound();
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("GetProjectOwner/{projectId}")]
        public async Task<ActionResult<AppUser>> GetProjectOwner(int projectId)
        {
            var OwnerMember = await _context.ProjectMembers.FirstOrDefaultAsync(member => member.ProjectId == projectId && member.ProjectRole == ProjectRole.ProjectOwner);
            if(OwnerMember!=null)
            {
                var ProjectOwner = await _context.Users.FirstOrDefaultAsync(member => member.Id == OwnerMember.AppUserId);
                return Ok(new {ProjectOwner.FirstName,ProjectOwner.LastName,ProjectOwner.Email,ProjectOwner.ProfilePicUrl,ProjectOwner.Archived, ProjectOwner.Role});
            }
            return null;
        }

        [Authorize(Roles = "ProjectManager")]
        [HttpPut("archive/{projectId}")]
        public async Task<IActionResult> ArchiveProject(int projectId) {

            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) {
                return NotFound("Project not found.");
            }

            project.ProjectStatus = ProjectStatus.Archived;

            var tasks = await _context.ProjectTasks
                                    .Where(t => t.ProjectId == projectId)
                                    .ToListAsync();
            foreach (var task in tasks) {
                task.IsOriginProjectArchived = true;
            }
            _notificationService.ArchiveRelatedProjectNotifications(projectId);//~maksim
            await _context.SaveChangesAsync();
            return Ok(new { message = "Project and its tasks have been archived." });
        }
        
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("isArchived/{projectId}")] //api/projects/isArchived/2
        public async Task<ActionResult<bool>> IsProjectArchived(int projectId)
        {
            if(ProjectExists(projectId))
            {
                var project1= await _context.Projects.FirstOrDefaultAsync(proj=>proj.Id==projectId && proj.ProjectStatus==ProjectStatus.Archived);
                if(project1!=null){
                    return true; 
                }
                else return false; 
            }
            else return true; 
           
        }

        [Authorize(Roles = "ProjectManager")]
        [HttpPut("unarchive/{projectId}")]
        public async Task<IActionResult> UnarchiveProject(int projectId) {
            var project = await _context.Projects.FindAsync(projectId);
            if (project == null) {
                return NotFound("Project not found.");
            }

            project.ProjectStatus = ProjectStatus.InProgress;

            var tasks = await _context.ProjectTasks
                                    .Where(t => t.ProjectId == projectId)
                                    .ToListAsync();
            foreach (var task in tasks) {
                task.IsOriginProjectArchived = false;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Project and its tasks have been unarchived." });
        }

        [Authorize(Roles = "ProjectManager")]
        [HttpPut("unarchiveMultiple")]
        public async Task<IActionResult> UnarchiveMultipleProjects([FromBody] List<int> projectIds) {
            var projects = await _context.Projects
                                        .Where(p => projectIds.Contains(p.Id))
                                        .ToListAsync();

            if (!projects.Any()) {
                return NotFound("No projects found.");
            }

            foreach (var project in projects) {
                project.ProjectStatus = ProjectStatus.InProgress;
                var tasks = await _context.ProjectTasks
                                        .Where(t => t.ProjectId == project.Id)
                                        .ToListAsync();
                foreach (var task in tasks) {
                    task.IsOriginProjectArchived = false;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Projects and their tasks have been unarchived." });
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getUsersArchivedProjects/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsersArchivedProjects(int userId)
        {
            var projects = await _context.Projects
                .Join(_context.ProjectMembers,
                    project => project.Id,
                    member => member.ProjectId,
                    (project, member) => new { Project = project, Member = member })
                .Where(x => x.Member.AppUserId == userId && x.Project.ProjectStatus == ProjectStatus.Archived)
                .Select(x => new { x.Project.Id, x.Project.ProjectName, x.Project.StartDate, x.Project.EndDate })
                .ToListAsync();

            var projectOwners = await _context.ProjectMembers
                .Where(pm => pm.ProjectRole == ProjectRole.ProjectOwner && projects.Select(p => p.Id).Contains(pm.ProjectId))
                .Join(_context.Users,
                    pm => pm.AppUserId,
                    user => user.Id,
                    (pm, user) => new { pm.ProjectId, Owner = new { user.FirstName, user.LastName, user.ProfilePicUrl } })
                .ToListAsync();

            var result = projects.Select(p => new {
                Project = p,
                Owner = projectOwners.FirstOrDefault(po => po.ProjectId == p.Id)?.Owner
            });

            return Ok(result);
        }

        [Authorize]
        [HttpGet("getProjectUserRole/{projectId}/{userId}")]
        public async Task<ActionResult<ProjectRole>> getProjectUserRole(int projectId, int userId)
        {   
            var user = await _context.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectId == projectId && x.AppUserId == userId);
            if(user == null)
            {
                return NotFound();
            }
            return user.ProjectRole;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("GetAvailableAssigness/{projectId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableAssigness(int projectId)
        {
            var users = await _context.Users
            .Where(user => _context.ProjectMembers.Any(member => member.AppUserId == user.Id && member.ProjectId == projectId && member.ProjectRole != ProjectRole.Guest) && user.Role != UserRole.Admin && user.Archived==false)
            .Select(user => new { user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Role })
            .ToListAsync();

            if (users == null)
            {
                return NotFound("No users found for the given project ID.");
            }

            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetManagersProjects/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetManagersProjects(int userId)
        {
            var projects = await _context.Projects
            .Where(project => _context.ProjectMembers.Any(member => member.AppUserId == userId && member.ProjectId == project.Id && member.ProjectRole == ProjectRole.ProjectManager))
            .Select(project => new { project.Id, project.ProjectName })
            .ToListAsync();

            return Ok(projects);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("GetManagers/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetManagers(int userId)
        {
            var users = await _context.Users
            .Where(user => user.Id != userId && user.Role == UserRole.ProjectManager)
            .Select(user => new {AppUserId = user.Id ,user.FirstName, user.LastName, user.ProfilePicUrl, user.Role})
            .ToListAsync();

            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("AssignProjectManagers")]
        public async Task<ActionResult> AssignProjectManagers(ProjectMember[] dtos)
        {
            foreach (var dto in dtos)
            {
                var member = await _context.ProjectMembers.FirstOrDefaultAsync(x => x.ProjectId == dto.ProjectId && x.AppUserId == dto.AppUserId);
                if(member != null)
                {
                    member.ProjectRole = ProjectRole.ProjectManager;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    await _context.ProjectMembers.AddAsync(dto);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok("Users' roles successfully set to Project Manager role.");
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("DemoteProjectManager/{userId}")]
        public async Task<ActionResult> DemoteProjectManager(int userId)
        {   
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Id == userId);
            user.Role = UserRole.Member;

            var members = _context.ProjectMembers.Where(x => x.AppUserId == userId && x.ProjectRole == ProjectRole.ProjectManager);
            foreach (var member in members)
            {
                member.ProjectRole = ProjectRole.Participant;
                await _context.SaveChangesAsync();
            }

            return Ok("Project manager successfully demoted");
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
        
    }
}