using Microsoft.EntityFrameworkCore;

namespace API;

public class DataContex : DbContext
{
    public DataContex(DbContextOptions options) : base(options)
    {
    }

    public DbSet<AppUser> Users { get; set; }
}
