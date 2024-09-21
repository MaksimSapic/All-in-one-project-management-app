using System.ComponentModel.DataAnnotations;

namespace backend.Entities
{
    public class TaskDependency
    {
        public int TaskId { get; set; } // task koji "gledam"
        public int DependencyTaskId  { get; set; } // task od kog zavisti TaskId (kojeg "gledam")
        public ProjectTask Task {get; set;}
        public ProjectTask DependencyTask {get; set;}
    }
}