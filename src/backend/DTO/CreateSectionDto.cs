using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class CreateSectionDto
    {
        [StringLength(100, ErrorMessage = "Section name must be between 1 and 100 characters long.", MinimumLength = 1)]
        public string SectionName { get; set; }
        public int ProjectId { get; set; }
    }
}