using backend.Entities;

namespace backend.DTO;

public class ProjectMemberDTO
{
    public int AppUserId { get; set; }
    public int ProjectId { get; set; }
    public ProjectRole ProjectRole { get; set; }
}