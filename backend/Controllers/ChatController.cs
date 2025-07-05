using backend.Models;
using backend.Repositories;
using backend.Services;
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var anonymousName = _anonymousNameService.GenerateAnonymousName(userId, courseId);
            return Ok(new { anonymousName });
        }
    }
}



