using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


namespace backend.Controllers
{
    public class AccountController:BaseApiController
    {
        private readonly DataContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;

        public AccountController(DataContext context,ITokenService tokenService,IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        [HttpPost("register")] // POST: api/account/register
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {   
            if(!await IsValidTokenAsync(registerDto.Token))
                return BadRequest(new {message = "Invalid request token."});

            if(await EmailExists(registerDto.Email))
                return BadRequest(new {message = "E-mail is already in use."});

            var hmac = new HMACSHA512();

            var user = new AppUser{
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(registerDto.Password)),
                PasswordSalt = hmac.Key,
                Role = UserRole.Member //default vrednost novo registrovanog korisnika je Member
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await MarkTokenAsUsedAsync(registerDto.Token);

            return new UserDto
            {
                Id = user.Id,
                Role = user.Role,
                Email = user.Email,
                Token = _tokenService.CreateToken(user)
            };
        }

        [HttpPost("login")] // POST: api/account/login
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            if(loginDto == null) return Unauthorized("Please enter your credentials.");
            
            var user = await _context.Users.SingleOrDefaultAsync(x => x.Email == loginDto.Email);

            if(user == null) return Unauthorized("Account with this e-mail doesn't exist.");
            if(user.Archived) return Unauthorized("Account with this e-mail doesn't exist.");

            var hmac = new HMACSHA512(user.PasswordSalt);

            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));

            for(int i=0;i<computedHash.Length;i++)
            {
                if(computedHash[i] != user.PasswordHash[i]) return Unauthorized("Invalid password.");
            }

            return new UserDto
            {
                Id = user.Id,
                Role = user.Role,
                Email = user.Email,
                Token = _tokenService.CreateToken(user)
            };
        }

        // [AllowAnonymous]
        [HttpPost("resetPassword")] // /api/account/resetPassword
        public async Task<ActionResult<InvitationDto>> ResetPassword(PasswordResetDto PassDto)
        {
            var request = await _context.UserRequests.FirstOrDefaultAsync(i => i.Token == PassDto.Token && i.IsUsed == false);

            if (request == null)
            {
                return BadRequest(new {message = "Token not found or already used."});
            }

            request.IsUsed = true;

            var user = await _context.Users.FirstOrDefaultAsync(i => i.Email == PassDto.Email);

            var hmac = new HMACSHA512(user.PasswordSalt);
            var hashNewPassword = hmac.ComputeHash(Encoding.UTF8.GetBytes(PassDto.NewPassword));
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
                return BadRequest(new {message = "Please choose a new password."});
            }

            user.PasswordHash = hashNewPassword;
            user.PasswordSalt = hmac.Key;

            await _context.SaveChangesAsync();
            
            return Ok();
        }

        // [AllowAnonymous] //vraca mi mail na osnovu tokena koji je potreban za reset passworda
        [HttpGet("token/{token}")] // /api/account/token
        public async Task<ActionResult<UserRequestDto>> GetEmail(string token)
        {
            var userrequest = await _context.UserRequests.FirstOrDefaultAsync(i => i.Token == token);

            if (userrequest == null)
            {
                return NotFound();
            }

            return new UserRequestDto { Email = userrequest.Email, Token = userrequest.Token };
        }

        private async Task<bool> EmailExists(string email)
        {
            return await _context.Users.AnyAsync(x => x.Email == email);
        }

        public async Task<bool> IsValidTokenAsync(string token)
        {
            var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.Token == token && !i.IsUsed && i.ExpirationDate > DateTime.UtcNow);
            return invitation != null;
        }

        public async Task MarkTokenAsUsedAsync(string token)
        {
            var entity = await _context.Invitations.FirstOrDefaultAsync(i => i.Token == token);
            
            if (entity != null)
            {
                entity.IsUsed = true;
                await _context.SaveChangesAsync();
            }
        }

        [HttpGet("validToken/{token}")] // /api/account/validToken
        public async Task<ActionResult<bool>> IsTokenValid(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true, 
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuer = false,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["TokenKey"])),
                ClockSkew = TimeSpan.Zero
            };

            SecurityToken validatedToken;

            try{
                tokenHandler.ValidateToken(token, validationParameters, out validatedToken);
                var jsonToken = tokenHandler.ReadToken(token) as JwtSecurityToken;
                var userEmailClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == userEmailClaim);
                return user != null;
            }
            catch (SecurityTokenException)
            {
                return false;
            }
        }
    }
}