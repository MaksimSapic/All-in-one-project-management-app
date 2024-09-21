using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class ChangeTaskInfoDto
    {
        [Required]
        public int Id { get; set; }

        [StringLength(100, ErrorMessage = "Task name must be at least 1 characters long.", MinimumLength = 1)]
        public string TaskName { get; set; }

        [StringLength(5000, ErrorMessage = "Description is too long.")]
        public string Description { get; set; }

        public int? AppUserId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ProjectEndDate { get; set; }
        public int ProjectId { get; set; }
        public int SectionId { get; set; }
    }
}