using backend.Entities;

namespace backend
{ //TaskStatus system reserved pa mora ovako da se zove
    public class TskStatus
    {
        public int Id { get; set; }
        public string StatusName { get; set; }
        public int Position { get; set; }
        public string Color { get; set; }
        public int ProjectId { get; set; } // foreign key
        public Project Project { get; set; } // navigation
        public ICollection<ProjectTask> Tasks { get; set; }
    }
}