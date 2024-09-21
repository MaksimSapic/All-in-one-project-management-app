using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class TaskMemberDTO
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public int AppUserId { get; set; }

        [Required]
        public int ProjectId { get; set; }
    }
}