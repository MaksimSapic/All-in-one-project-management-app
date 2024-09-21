using System.Linq.Expressions;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
  [Authorize]
  public class UsersController : BaseApiController
  {
    private readonly DataContext _context;
    private ITokenService _tokenService;
    
    private readonly IPhotoService _photoService;
    public UsersController(DataContext context, ITokenService ts, IPhotoService photoService)
    {
      _photoService = photoService;
      _context = context;
      _tokenService = ts;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
      var users = await _context.Users
      .Select(user => new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role})
      .ToListAsync();
      return users;
    }
    [Authorize]
    [HttpGet("{id}")] // /api/users/2
    public async Task<ActionResult<object>> GetUser(int id)
    {
      var user = await _context.Users.FindAsync(id);
      return new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role};
    }

    [Authorize]
    [HttpGet("availableUsers/{projectCreatorId}")]
    public async Task<ActionResult<AppUser>> GetAvailableUsers(int projectCreatorId)
    {
      var availableUsers = await _context.Users
      .Where(user => user.Id != projectCreatorId && user.Role != UserRole.Admin && user.Archived == false)
      .Select(user => new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role})
      .ToListAsync();
      return  Ok(availableUsers);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("updateUser/{id}")] // /api/users/updateUser
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto data)
    {
      var user = await _context.Users.FindAsync(id);
      if (data.FirstName != null && data.FirstName != "") user.FirstName = data.FirstName;
      if (data.LastName != null && data.LastName != "") user.LastName = data.LastName;
      if (data.Email != null && data.Email != "") user.Email = data.Email;
      await _context.SaveChangesAsync();
      var responseData = new
      {
        UserId = user.Id,
        Updated = true,
        Message = "User data has been updated."
      };

      return Ok(responseData);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("setAsArchived/{id}")]   //api/users/setAsArchived/1
    public async Task<ActionResult<UserDto>> ArchiveUser(int id)
    {
      var user = await _context.Users.FindAsync(id);

      if (user != null)
      {
        user.Archived = true;
        await _context.SaveChangesAsync();
      }
      else { return BadRequest("User doesn't exist."); }

      var responseData = new
      {
        UserId = user.Id,
        Archived = true,
        Message = "User is successfully archived."
      };

      return Ok(responseData);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("changeUserRole")]   //api/users/changeUserRole
    public async Task<ActionResult<UserDto>> ChangeUserRole(RoleChangeDTO dto)
    {
      var user = await _context.Users.FindAsync(dto.Id);

      if (user != null)
      {
        user.Role = dto.Role;
        await _context.SaveChangesAsync();
      }
      else { return BadRequest("User doesn't exist."); }

      var responseData = new
      {
        UserId = user.Id,
        Deleted = true,
        Message = "User role is set to " + dto.Role
      };

      return Ok(responseData);
    }

    [Authorize]
    [HttpPut("changePassword/{id}")] // /api/users/changePassword
    public async Task<ActionResult<UserDto>> ChangePassword(int id, [FromBody] ChangePasswordDto data)
    {
      var user = await _context.Users.FindAsync(id);
      
      if(!VerifyPassword(user,data.CurrentPassword))
      {
        return BadRequest(new {message = "Incorrect current password.",type = 1});
      }

      var hmac = new HMACSHA512(user.PasswordSalt);
      var hashNewPassword = hmac.ComputeHash(Encoding.UTF8.GetBytes(data.NewPassword));

      var different = false;
      for(int i=0;i<hashNewPassword.Length;i++)
      {
          if(user.PasswordHash[i] != hashNewPassword[i])
          {
              different = true;
              break;
          }
      }

      if(!different)
      {
        return BadRequest(new {message = "Your new password is the same as your previous.", type = 2});
      }

      user.PasswordHash = hashNewPassword;
      user.PasswordSalt = hmac.Key;
      await _context.SaveChangesAsync();

      var responseData = new
      {
        UserId = user.Id,
        Updated = true,
        Message = "Password has been updated."
      };
      return Ok(responseData);
    }

    private bool VerifyPassword(AppUser user, string password)
    {
      using var hmac = new HMACSHA512(user.PasswordSalt);
      var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));

      return computedHash.SequenceEqual(user.PasswordHash);
    }

    [AllowAnonymous]
    [HttpGet("token/{token}")] // /api/users/token
    public async Task<ActionResult<InvitationDto>> GetEmail(string token)
    {
      var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.Token == token);

      if (invitation == null)
      {
        return NotFound();
      }

      return new InvitationDto { Email = invitation.Email, Token = invitation.Token };
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<int>> GetAllUsers()
    {
        var query=_context.Users.AsQueryable();
        query = query.Where(u => u.Archived == false);

        var Users=await query
        .Select(user => new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role})
        .ToListAsync();

        return Users.Count;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("filtered")]
    public async Task<ActionResult<IEnumerable<object>>> GetUsersFP(int pageSize=0, int currentPage = 0, UserRole? role=null, string searchTerm="", int sortedOrder=0,  string sortedColumn = null)
    {
        var query = _context.Users.AsQueryable();
        query = query.Where(u => u.Archived == false);

        if(role!=null)
        {
          query = query.Where(u => u.Role == role);
        }


        if(!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(u => EF.Functions.Like(u.FirstName.ToLower(), $"%{searchTerm.ToLower()}%") || EF.Functions.Like(u.LastName.ToLower(), $"%{searchTerm.ToLower()}%"));
        }

        if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
        {
          
          query = sortedOrder == 1 ? query.OrderBy(u => (u.FirstName + " " + u.LastName).ToLower()) : query.OrderByDescending(u => (u.FirstName + " " + u.LastName).ToLower());
                
        }

        var filteredUsers=await query.Skip((currentPage-1)*pageSize).Take(pageSize).ToListAsync();

        return filteredUsers;
    }
    
    [Authorize(Roles = "Admin")]
    [HttpGet("fcount")]
    public async Task<ActionResult<int>> GetUsersFF( UserRole? role=null, string searchTerm="" , int sortedOrder=0,  string sortedColumn = null)
    {
        var query = _context.Users.AsQueryable();
        query = query.Where(u => u.Archived == false);

        if(role!=null)
        {
          query = query.Where(u => u.Role == role);
        }


        if(!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(u => EF.Functions.Like(u.FirstName.ToLower(), $"%{searchTerm.ToLower()}%") || EF.Functions.Like(u.LastName.ToLower(), $"%{searchTerm.ToLower()}%"));
        }

        if (!string.IsNullOrEmpty(sortedColumn) && sortedOrder > 0)
        {
          
          query = sortedOrder == 1 ? query.OrderBy(u => (u.FirstName + " " + u.LastName).ToLower()) : query.OrderByDescending(u => (u.FirstName + " " + u.LastName).ToLower());
                 
        }

        var filteredUsers=await query.ToListAsync();

        return filteredUsers.Count;
    }
    
    [Authorize(Roles = "Admin")]
    [HttpGet("filteredCount")]
    public async Task<ActionResult<RoleDTO>> CountFilteredUsers()
    {
      var adminCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin && !u.Archived);
      var memberCount = await _context.Users.CountAsync(u => u.Role == UserRole.Member && !u.Archived);
      var projectManagerCount = await _context.Users.CountAsync(u => u.Role == UserRole.ProjectManager && !u.Archived);

      var roleCount=new RoleDTO{
        AdminCount=adminCount,
        MemberCount=memberCount,
        ProjectManagerCount= projectManagerCount,
        Admins=await _context.Users.Where( u => u.Role == UserRole.Admin && !u.Archived).ToListAsync(),
        Members=await _context.Users.Where( u => u.Role == UserRole.Member && !u.Archived).ToListAsync(),
        PManagers=await _context.Users.Where( u => u.Role == UserRole.ProjectManager && !u.Archived).ToListAsync()
      };

      return Ok(roleCount);
    }
    [Authorize(Roles = "Admin")]
    [HttpGet("getByRole")]
    public async Task<ActionResult<IEnumerable<object>>> GetUserByRole(UserRole? role=null)
    {
      var query=_context.Users.AsQueryable();
      query = query.Where(u => u.Archived == false);

      if(role!=null)
      {
        query=query.Where(u=>u.Role==role);
      }
      var filteredUsers=await query
      .Select(user => new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role})
      .ToListAsync();

      return filteredUsers;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("getArchived")]
    public async Task<ActionResult<IEnumerable<object>>> GetArchivedUsers()
    {
      var query = _context.Users.AsQueryable();
      query = query.Where(u => u.Archived == true);

      var archUsers=await query
      .Select(user => new {user.Id, user.FirstName, user.LastName, user.Email, user.ProfilePicUrl, user.Archived, user.Role})
      .ToListAsync();
      return archUsers;

    }

    [Authorize(Roles = "Admin")]
    [HttpPut("removeFromArch")]   //api/users/setAsArchived/1
    public async Task<IActionResult> RemoveArch([FromBody] List<int> userIds)
    { 
      var usersToUpdate=await _context.Users.Where(u=> userIds.Contains(u.Id))
        .ToListAsync();

      foreach (var user in usersToUpdate)
      {
        user.Archived=false;
      }

      await _context.SaveChangesAsync();

      return Ok(new { message = "Tasks updated to Completed status." });
    }

  }
}