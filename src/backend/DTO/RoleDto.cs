using backend.Entities;

namespace backend.DTO
{
    public class RoleDTO
    {
        public int AdminCount { get; set; }
        public int MemberCount { get; set; }
        public int ProjectManagerCount { get; set; }

        public List<AppUser> Admins { get; set; }
        public List<AppUser> Members { get; set; }
        public List<AppUser> PManagers { get; set; }
    }
}