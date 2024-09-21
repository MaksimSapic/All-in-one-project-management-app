using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class TaskStatusDto
    {
        [StringLength(30, ErrorMessage = "Status name must be between 1 and 30 characters long.", MinimumLength = 1)]
        public string StatusName { get; set; }
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Color { get; set; }
    }
}