using Microsoft.EntityFrameworkCore;
using API.Entities; // ovaj
namespace API.Data;

public class TodoContext : DbContext
{
    public TodoContext(DbContextOptions<TodoContext> options) : base(options)
    {
    }

    public DbSet<TodoItem> TodoItems { get; set; }
}
