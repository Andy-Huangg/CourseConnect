using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrivateMessageController : ControllerBase
    {
        private readonly IPrivateMessageRepository _privateMessageRepo;
        private readonly IStudyBuddyRepository _studyBuddyRepo;

        public PrivateMessageController(IPrivateMessageRepository privateMessageRepo, IStudyBuddyRepository studyBuddyRepo)
        {
            _privateMessageRepo = privateMessageRepo;
            _studyBuddyRepo = studyBuddyRepo;
        }

        // GET: api/PrivateMessage/with/{recipientId}
        [HttpGet("with/{recipientId}")]
        public async Task<IActionResult> GetMessagesWith(int recipientId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            // Verify that the users are study buddies
            var studyBuddies = await _studyBuddyRepo.GetByUserIdAsync(userId);
            var isStudyBuddy = studyBuddies.Any(sb => sb.BuddyId == recipientId);

            if (!isStudyBuddy)
            {
                return StatusCode(403, "You can only message your study buddies");
            }

            var messages = await _privateMessageRepo.GetMessagesBetweenUsersAsync(userId, recipientId);

            var messageDtos = messages.Select(m => new PrivateMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender.DisplayName,
                RecipientId = m.RecipientId,
                RecipientName = m.Recipient.DisplayName,
                Content = m.Content,
                Timestamp = m.Timestamp,
                EditedAt = m.EditedAt,
                IsRead = m.ReadAt.HasValue
            });

            return Ok(messageDtos);
        }

        // POST: api/PrivateMessage
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendPrivateMessageDto dto)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            // Verify that the users are study buddies
            var studyBuddies = await _studyBuddyRepo.GetByUserIdAsync(userId);
            var isStudyBuddy = studyBuddies.Any(sb => sb.BuddyId == dto.RecipientId);

            if (!isStudyBuddy)
            {
                return StatusCode(403, "You can only message your study buddies");
            }

            var message = new PrivateMessage
            {
                SenderId = userId,
                RecipientId = dto.RecipientId,
                Content = dto.Content,
                Timestamp = DateTime.UtcNow
            };

            var savedMessage = await _privateMessageRepo.AddMessageAsync(message);

            // TODO: Broadcast via WebSocket to recipient

            var messageDto = new PrivateMessageDto
            {
                Id = savedMessage.Id,
                SenderId = savedMessage.SenderId,
                SenderName = savedMessage.Sender.DisplayName,
                RecipientId = savedMessage.RecipientId,
                RecipientName = savedMessage.Recipient.DisplayName,
                Content = savedMessage.Content,
                Timestamp = savedMessage.Timestamp,
                EditedAt = savedMessage.EditedAt,
                IsRead = savedMessage.ReadAt.HasValue
            };

            return Ok(messageDto);
        }

        // PUT: api/PrivateMessage/{messageId}
        [HttpPut("{messageId}")]
        public async Task<IActionResult> EditMessage(int messageId, [FromBody] EditPrivateMessageDto dto)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var message = await _privateMessageRepo.GetMessageByIdAsync(messageId);
            if (message == null)
            {
                return NotFound("Message not found");
            }

            if (message.SenderId != userId)
            {
                return StatusCode(403, "You can only edit your own messages");
            }

            message.Content = dto.Content;
            var success = await _privateMessageRepo.UpdateMessageAsync(message);

            if (!success)
            {
                return BadRequest("Failed to update message");
            }

            // TODO: Broadcast edit via WebSocket

            return Ok(new { success = true, message = "Message updated successfully" });
        }

        // DELETE: api/PrivateMessage/{messageId}
        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var message = await _privateMessageRepo.GetMessageByIdAsync(messageId);
            if (message == null)
            {
                return NotFound("Message not found");
            }

            if (message.SenderId != userId)
            {
                return StatusCode(403, "You can only delete your own messages");
            }

            var success = await _privateMessageRepo.DeleteMessageAsync(messageId);

            if (!success)
            {
                return BadRequest("Failed to delete message");
            }

            // TODO: Broadcast delete via WebSocket

            return Ok(new { success = true, message = "Message deleted successfully" });
        }

        // POST: api/PrivateMessage/{messageId}/read
        [HttpPost("{messageId}/read")]
        public async Task<IActionResult> MarkAsRead(int messageId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var success = await _privateMessageRepo.MarkAsReadAsync(messageId, userId);

            if (!success)
            {
                return BadRequest("Failed to mark message as read");
            }

            return Ok(new { success = true, message = "Message marked as read" });
        }

        // GET: api/PrivateMessage/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token - userId claim not found");
            }

            var unreadCount = await _privateMessageRepo.GetUnreadCountAsync(userId);
            var unreadCountsByUser = await _privateMessageRepo.GetUnreadCountsByUserAsync(userId);

            return Ok(new { totalUnread = unreadCount, unreadByUser = unreadCountsByUser });
        }
    }

    public class SendPrivateMessageDto
    {
        public int RecipientId { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class EditPrivateMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class PrivateMessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public int RecipientId { get; set; }
        public string RecipientName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public DateTime? EditedAt { get; set; }
        public bool IsRead { get; set; }
    }
}
