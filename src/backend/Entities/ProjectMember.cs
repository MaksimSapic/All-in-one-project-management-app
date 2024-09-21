namespace backend.Entities
{
    public enum ProjectRole
    {
        ProjectManager, //osoba koja je kreirala projekat
        ProjectOwner,
        Manager,
        Participant,
        Guest,
    }
    public class ProjectMember
    {
        public ProjectRole ProjectRole { get; set; }

        // foreign key properties
        public int AppUserId { get; set; }
        public int ProjectId { get; set; }

        // navigation properties
        public AppUser AppUser { get; set; }
        public Project Project { get; set; }
    }
}