using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class UserRequestDto
    {
        [EmailAddress]
        public string Email { get; set; }
        public string Token { get; set; }
    }

}