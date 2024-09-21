using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class UpdateUserDto
    {
        [RegularExpression(@"^[A-Za-zĀ-ž]{2,30}$", ErrorMessage = "First name must contain only letters and be at least two characters long.")]
        public string FirstName { get; set; }

        [RegularExpression(@"^[A-Za-zĀ-ž]{2,30}$", ErrorMessage = "Last name must contain only letters and be at least two characters long.")]
        public string LastName { get; set; }
        
        [EmailAddress]
        public string Email { get; set; }
    }
}