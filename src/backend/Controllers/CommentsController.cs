using backend.Data;
using backend.DTO;
using backend.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Interfaces;
namespace backend.Controllers
{
    public class CommentsController:BaseApiController
    {
        private readonly DataContext _context;
        INotificationService _notificationService;
        public CommentsController(DataContext context,INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }
        
        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPost("postComment")] // /api/comments/postComment
        public async Task<IActionResult> PostComment(CommentDto commentDto)
        {
            //doraditi: treba da proveri dal task postoji pa onda da post komentar. ako ne postoji vraca BadRequest sa opisom greske
            var task = await _context.ProjectTasks.FindAsync(commentDto.TaskId);
            if(task==null) return BadRequest("task does not exist.");
            var comment = new Comment
            {
                TaskId = commentDto.TaskId,
                Content = commentDto.Content,
                SenderId = commentDto.SenderId,
                SenderFirstName = commentDto.SenderFirstName,
                SenderLastName = commentDto.SenderLastName,
                FileUrl = commentDto.FileUrl
            };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            await _notificationService.TriggerNotification(commentDto.TaskId,commentDto.SenderId,comment.Id,NotificationType.Comment);
            return Ok(comment);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpGet("getComments/{taskId}")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(int taskId)
        {
            var comments = await _context.Comments
                .Where(x => x.TaskId == taskId)
                .Join(
                    _context.Users,
                    comment => comment.SenderId,
                    user => user.Id,
                    (comment, user) => new CommentDto
                    {
                        Id=comment.Id,
                        TaskId = comment.TaskId,
                        Content = comment.Content,
                        MessageSent=comment.MessageSent,
                        SenderId = comment.SenderId,
                        SenderFirstName = comment.SenderFirstName,
                        SenderLastName = comment.SenderLastName,
                        FileUrl =comment.FileUrl,
                        Edited=comment.Edited,
                        AppUserPicUrl = user.ProfilePicUrl,
                    }
                )
                .ToListAsync();
            
            return Ok(comments);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpDelete("deleteComment/{commentId}")]
        public async Task<ActionResult> DeleteComment(int commentId)
        {
            var comment = await _context.Comments.FindAsync(commentId);

        if (comment == null)
            return BadRequest("The comment doesn't exist.");

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        
        var responseData = new 
        {
            CommentId = comment.Id,
            EmailSent = true,
            Message = "Comment deleted successfully."
        };

        return Ok(responseData);
        }

        [Authorize(Roles = "ProjectManager,Member")]
        [HttpPut("updateComment/{commentId}/{content}")]
        public async Task<IActionResult> UpdateComment(int commentId, string content)
        {
            var comment = await _context.Comments.FindAsync(commentId);

            if (comment == null)
            {
                return NotFound("Comment not found.");
            }

            comment.Content = content;
            comment.Edited=true;
            comment.MessageSent = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw; 
            }

            return Ok(comment);
        }   
    }
}