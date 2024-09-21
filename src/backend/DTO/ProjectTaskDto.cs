using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class ProjectTaskDto
    {
        public int Id { get; set; }
        public int CreatorId{get;set;}

        [StringLength(100, ErrorMessage = "Task name must be between 1 and 100 characters long.", MinimumLength = 1)]
        public string TaskName { get; set; }

        [StringLength(5000, ErrorMessage = "Task description can't exceed 5000 characters.")]
        public string Description { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime ProjectEndDate { get; set; }
        public int TaskStatusId { get; set; }
        public int AppUserId { get; set; }
        public int ProjectId { get; set; }
        public int? senderid{get;set;}
        public int? ProjectSectionId { get; set; }
    }
}