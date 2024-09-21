using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]

public class UsersController:ControllerBase
{
    private readonly DataContext context;
    public UsersController(DataContext context){
        this.context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers(){
        var users = await context.Users.ToListAsync();
        return users;
    }

    
    [HttpGet("{id}")] //api/user/2
    public async Task<ActionResult<AppUser>> GetUser(int id){
        var user = await context.Users.FindAsync(id);
        return user;
    }
}