using System.ComponentModel.DataAnnotations;

namespace backend.DTO;

public class UpdateTaskDescription
{
    public int Id { get; set; }

    [StringLength(5000, ErrorMessage = "Task description can't exceed 5000 characters.")]
    public string Description { get; set; }
}