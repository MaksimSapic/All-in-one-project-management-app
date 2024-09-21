using backend.Data;
using backend.DTO;
using backend.Entities;
using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    public class EmailController : BaseApiController
    {
        private readonly DataContext _context;
        private readonly IEmailSender _emailSender;

        public EmailController(IEmailSender emailSender,DataContext context)
        {
            _emailSender = emailSender;
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [AllowAnonymous]
        [HttpPost("sendInvitation")]
        public async Task<IActionResult> SendInvitationEmail(EmailDto emailDto)
        {
            var invitation = new Invitation
            {
                Email = emailDto.Receiver,
                Token = Guid.NewGuid().ToString(),
                ExpirationDate = DateTime.UtcNow.AddDays(7),
                IsUsed = false
            };

            _context.Invitations.Add(invitation);
            await _context.SaveChangesAsync();

            string filePath = "EmailTemplates/InvitationTemplate.html";
            string htmlContent = System.IO.File.ReadAllText(filePath);
            htmlContent = htmlContent.Replace("_blank", "http://softeng.pmf.kg.ac.rs:10101/register?token=" + invitation.Token);

            string subject = "AccDen Register Invitation";
            await _emailSender.SendEmailAsync(emailDto.Receiver, subject, htmlContent);

            var responseData = new
            {
                InvitationId = invitation.Id,
                EmailSent = true,
                Message = "Invitation email sent successfully."
            };

            return Ok(responseData);
        }

        [AllowAnonymous]
        [HttpPost("sendRecovery")]
        public async Task<IActionResult> SendRecoveryEmail(EmailDto emailDto)
        {
            if (string.IsNullOrWhiteSpace(emailDto.Receiver))
            {
                return BadRequest("Email address is required.");
            }
            
            var user = _context.Users.FirstOrDefault(u => u.Email == emailDto.Receiver);
            if (user == null)
            {
                return Unauthorized("Account with this e-mail doesn't exist.");
            }

            var request = new UserRequest{
                Email = emailDto.Receiver,
                Token = Guid.NewGuid().ToString(),
                ExpirationDate = DateTime.UtcNow.AddDays(7),
                IsUsed = false
            };

            _context.UserRequests.Add(request);
            await _context.SaveChangesAsync();
            
            string filePath = "EmailTemplates/ResetPassTemplate.html";
            string htmlContent = System.IO.File.ReadAllText(filePath);
            htmlContent = htmlContent.Replace("_blank", "http://softeng.pmf.kg.ac.rs:10101/forgotreset?token=" + request.Token);
            htmlContent = htmlContent.Replace("{user}", $"{user.FirstName} {user.LastName}");
            
            string subject = "Password Reset";
            await _emailSender.SendEmailAsync(emailDto.Receiver, subject, htmlContent);

            var responseData = new 
            {
                InvitationId = request.Id,
                EmailSent = true,
                Message = "Request email sent successfully."
            };

            return Ok(responseData);
        }
    }
}