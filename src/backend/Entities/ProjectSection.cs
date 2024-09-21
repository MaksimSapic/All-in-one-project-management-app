namespace backend.Entities
{
    public class ProjectSection
    {
        public int Id { get; set; }
        public string SectionName { get; set; }
        public int ProjectId { get; set; } // foreign key to Project
        public Project Project { get; set; } // navigation property
        public ICollection<ProjectTask> Tasks { get; set; }
    }
}