using backend.Entities;

namespace backend.DTO
{
    public class RoleChangeDTO
    {
        public int Id { get; set; }
        public UserRole Role { get; set; }
    }
}