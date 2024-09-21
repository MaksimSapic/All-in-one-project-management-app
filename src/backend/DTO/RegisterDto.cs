using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class RegisterDto
    {
        [Required]
        [RegularExpression(@"^[A-Za-zĀ-ž]{2,}$", ErrorMessage = "First name must contain only letters and be at least two characters long.")]
        public string FirstName {get; set;}

        [Required]
        [RegularExpression(@"^[A-Za-zĀ-ž]{2,}$", ErrorMessage = "Last name must contain only letters and be at least two characters long.")]
        public string LastName {get; set;}

        [Required]
        [EmailAddress]
        public string Email{get; set;}

        [Required]
        [StringLength(30, ErrorMessage = "Password must have at least 5 characters.", MinimumLength = 5)]
        public string Password{get; set;}
        
        public string Token{get; set;}
    }
}