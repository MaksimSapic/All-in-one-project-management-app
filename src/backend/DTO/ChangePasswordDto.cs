using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; }
        
        [StringLength(30, ErrorMessage = "Password must be at least 5 characters long.", MinimumLength = 5)]
        public string NewPassword { get; set; }
    }
}