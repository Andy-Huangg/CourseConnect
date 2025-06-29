using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepo;

        public ChatController(IChatRepository chatRepo)
        {
            _chatRepo = chatRepo;
        }
        // GET: api/Chat/1
        [HttpGet("{courseId}")]
        public async Task<IActionResult> GetChatHistory(int courseId)
        {
            var messages = await _chatRepo.GetMessagesByCourseIdAsync(courseId);
            return Ok(messages);
        }
    }
}



