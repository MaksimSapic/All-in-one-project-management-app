using System.IdentityModel.Tokens.Jwt;
using backend.Data;
using backend.DTO;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    public class ProjectSectionController : BaseApiController
    {
        private readonly DataContext _context;

        public ProjectSectionController(DataContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost]
        async public Task<IActionResult> CreateSection([FromBody] CreateSectionDto createSectionDto)
        {
            if(!await RoleCheck(createSectionDto.ProjectId,[ProjectRole.ProjectManager,ProjectRole.ProjectOwner,ProjectRole.Manager]))
                return Unauthorized("Invalid role");

            var section = new ProjectSection
            {
                SectionName = createSectionDto.SectionName,
                ProjectId = createSectionDto.ProjectId
            };
            _context.ProjectSections.Add(section);
            _context.SaveChanges();
            return Ok(section);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("{id}")] // GET: api/ProjectSection/5
        public async Task<ActionResult<ProjectSection>> GetSection(int id)
        {
            var section = await _context.ProjectSections.FindAsync(id);

            if (section == null)
            {
                return NotFound();
            }

            return section;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("project/{id}")]
        public async Task<ActionResult<IEnumerable<ProjectSection>>> GetSectionsByProject(int id){
            var sections = await _context.ProjectSections.Where(x => x.ProjectId == id).ToListAsync();
            return sections;
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpDelete("{id}")] // DELETE: api/ProjectSection/5
        public async Task<IActionResult> DeleteSection(int id)
        {
            var section = await _context.ProjectSections.FindAsync(id);
            if (section == null)
            {
                return NotFound();
            }

            if(!await RoleCheck(section.ProjectId,[ProjectRole.ProjectManager,ProjectRole.ProjectOwner,ProjectRole.Manager]))
                return Unauthorized("Invalid role.");

            var tasks = await _context.ProjectTasks
                .Where(t => t.ProjectSectionId == id && t.ProjectId == section.ProjectId)
                .ToListAsync();

            tasks.ForEach(t => t.ProjectSectionId = null);
            _context.UpdateRange(tasks);

            _context.ProjectSections.Remove(section);
            await _context.SaveChangesAsync();

            return NoContent();
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