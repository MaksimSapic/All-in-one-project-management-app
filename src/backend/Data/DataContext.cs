using backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions options) : base(options) { }

        public DbSet<AppUser> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<TaskDependency> TaskDependencies { get; set; }
        public DbSet<Invitation> Invitations { get; set; }
        public DbSet<UserRequest> UserRequests { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<TskStatus> TaskStatuses { get; set; }
        public DbSet<ProjectSection> ProjectSections { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ProjectMember>(entity =>
            {
                entity.HasKey(pm => new { pm.AppUserId, pm.ProjectId });

                entity.HasOne(pm => pm.AppUser)
                    .WithMany() // definise vezu izmedju ProjectMember and AppUser
                    .HasForeignKey(pm => pm.AppUserId);

                entity.HasOne(pm => pm.Project)
                    .WithMany() // definise vezu izmedju ProjectMember and Project
                    .HasForeignKey(pm => pm.ProjectId);
            });

            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.HasKey(pt => pt.Id); // definise Id as the primary key

                entity.HasOne(pt => pt.Project)
                    .WithMany() // definise vezu izmedju ProjectTask and Project
                    .HasForeignKey(pt => pt.ProjectId); // definise ProjectId as the foreign key

                entity.HasOne(pt => pt.TskStatus)
                    .WithMany(ts => ts.Tasks)
                    .HasForeignKey(pt => pt.TskStatusId);

                entity.HasOne(pt => pt.ProjectSection)
                    .WithMany(ps => ps.Tasks)
                    .HasForeignKey(pt => pt.ProjectSectionId);

                entity.HasOne(pt => pt.AppUser)
                    .WithMany()
                    .HasForeignKey(pt => pt.AppUserId);
            });

            modelBuilder.Entity<TaskDependency>(entity =>
            {
                entity.HasKey(td => new { td.TaskId, td.DependencyTaskId });

                entity.HasOne(td => td.Task)
                    .WithMany()
                    .HasForeignKey(td => td.TaskId);

                entity.HasOne(td => td.DependencyTask)
                    .WithMany()
                    .HasForeignKey(td => td.DependencyTaskId);
                // task ne moze da zavisi sam od sebe
                entity.ToTable("TaskDependencies", t => t.HasCheckConstraint("DifferentTasks", "TaskId <> DependencyTaskId"));
            });

            modelBuilder.Entity<Notification>(entity => {
                entity.HasKey(n => n.Id);
                entity.HasOne(n => n.Task)
                    .WithMany()
                    .HasForeignKey(n => n.task_id);
                entity.HasOne(n => n.Project)
                    .WithMany()
                    .HasForeignKey(n => n.project_id);
                entity.HasOne(n => n.Sender)
                    .WithMany()
                    .HasForeignKey(n => n.sender_id);
                entity.HasOne(n => n.Reciever)
                    .WithMany()
                    .HasForeignKey(n => n.reciever_id);
                entity.HasOne(n=> n.Comment)
                    .WithMany()
                    .HasForeignKey(n=>n.comment_id);
            });
        }
    }
}