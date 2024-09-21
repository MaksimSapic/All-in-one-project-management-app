using API.Entities;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

// kreiranje jedne klase koja ce da omoguci prevodjenje naseg koda u sql upite
public class DataContext : DbContext
{
    public DataContext(DbContextOptions options):base(options){}

    //ovo users ce u stvari da predstavlja odredjenu tabelu baze podataka
    public DbSet<AppUser> Users{get; set;}
}