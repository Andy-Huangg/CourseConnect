using backend.Models;
using backend.Repositories;
using backend.Services;
using backend.WebSockets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepo;
        private readonly IAnonymousNameService _anonymousNameService;

        public ChatController(IChatRepository chatRepo, IAnonymousNameService anonymousNameService)
        {
            _chatRepo = chatRepo;
            _anonymousNameService = anonymousNameService;
        }
        // GET: api/Chat/1
        [HttpGet("{courseId}")]
        public async Task<IActionResult> GetChatHistory(int courseId)
        {
            var messages = await _chatRepo.GetMessagesByCourseIdAsync(courseId);
            return Ok(messages);
        }

        // GET: api/Chat/anonymous-name/{courseId}
        [HttpGet("anonymous-name/{courseId}")]
        public IActionResult GetAnonymousName(int courseId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var anonymousName = _anonymousNameService.GenerateAnonymousName(userId, courseId);
            return Ok(new { anonymousName });
        }

        // PUT: api/Chat/{messageId}
        [HttpPut("{messageId}")]
        public async Task<IActionResult> EditMessage(int messageId, [FromBody] EditMessageDto editDto)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var message = await _chatRepo.GetMessageByIdAsync(messageId);
            if (message == null)
            {
                return NotFound("Message not found");
            }

            // Check if the user owns this message
            if (message.SenderId != userId.ToString())
            {
                return Forbid("You can only edit your own messages");
            }

            // Update the message
            message.Content = editDto.Content;
            message.EditedAt = DateTime.UtcNow;

            await _chatRepo.UpdateMessageAsync(message);

            // Broadcast the update to all connected clients in this course
            await WebSocketHandler.BroadcastMessageUpdate(message.CourseId, message);

            return Ok(new MessageActionResponseDto { Success = true, Message = "Message updated successfully" });
        }

        // DELETE: api/Chat/{messageId}
        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var message = await _chatRepo.GetMessageByIdAsync(messageId);
            if (message == null)
            {
                return NotFound("Message not found");
            }

            // Check if the user owns this message
            if (message.SenderId != userId.ToString())
            {
                return Forbid("You can only delete your own messages");
            }

            await _chatRepo.DeleteMessageAsync(messageId);

            // Broadcast the deletion to all connected clients in this course
            await WebSocketHandler.BroadcastMessageDelete(message.CourseId, messageId);

            return Ok(new MessageActionResponseDto { Success = true, Message = "Message deleted successfully" });
        }
    }
}



