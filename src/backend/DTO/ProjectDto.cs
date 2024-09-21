using System.ComponentModel.DataAnnotations;
using backend.Entities;

namespace backend.DTO
{
    public class ProjectDto
    {
        public int AppUserId { get; set; }
        public int ProjectId { get; set;}

        [StringLength(100, ErrorMessage = "Project name must be between 1 and 100 characters long.", MinimumLength = 1)]
        public string ProjectName { get; set; }

        [StringLength(10000, ErrorMessage = "Project description can't exceed 10000 characters.")]
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public ProjectStatus ProjectStatus { get; set; }
    }
}