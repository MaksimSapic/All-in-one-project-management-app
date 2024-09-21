namespace backend.Entities
{
    public enum ProjectStatus
    {
        Proposed,
        InProgress,
        Completed,
        Archived
    }

    public class Project
    {
        public int Id { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Progress { get; set; } = 0;
        public ProjectStatus ProjectStatus { get; set; }
    }
}