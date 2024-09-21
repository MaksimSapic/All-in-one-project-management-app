using System.ComponentModel.DataAnnotations;
using backend.Entities;

namespace backend.DTO
{
    public class UserDto
    {
        public int Id { get; set; }
        [EmailAddress]
        public string Email{get; set;}
        public string Token{get; set;}
        public UserRole Role { get; set; }
    }
}