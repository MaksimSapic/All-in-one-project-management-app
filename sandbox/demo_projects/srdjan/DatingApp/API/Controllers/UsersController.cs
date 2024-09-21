using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly DataContext context;

        public UsersController(DataContext context)
        {
            this.context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
        {
            var users = await context.Users.ToListAsync();
            return users;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AppUser>> GetUser(int id)
        {
            var user = await context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return user;
        }

        [HttpPost]
        public async Task<ActionResult<AppUser>> AddUser([FromBody] AppUser user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            context.Users.Add(user);
            await context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {

            // Proceed with deleting the user
            var user = await context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(); // User not found
            }

            context.Users.Remove(user);
            await context.SaveChangesAsync();

            return NoContent(); // User deleted successfully
        }

    }
}