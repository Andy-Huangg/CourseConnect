using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudyBuddyController : ControllerBase
    {
        private readonly IStudyBuddyRepository _studyBuddyRepo;

        public StudyBuddyController(IStudyBuddyRepository studyBuddyRepo)
        {
            _studyBuddyRepo = studyBuddyRepo;
        }

        // GET: api/StudyBuddy
        [HttpGet]
        public async Task<IActionResult> GetMyStudyBuddies()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var studyBuddies = await _studyBuddyRepo.GetByUserIdAsync(userId);
            var studyBuddyDtos = studyBuddies.Select(sb => new StudyBuddyDto
            {
                Id = sb.Id,
                CourseId = sb.CourseId,
                CourseName = sb.Course.Name,
                IsOptedIn = sb.IsOptedIn,
                MatchedAt = sb.MatchedAt,
                ContactPreference = sb.ContactPreference,
                Buddy = sb.Buddy != null ? new StudyBuddyUserDto
                {
                    Id = sb.Buddy.Id,
                    Username = sb.Buddy.Username,
                    DisplayName = sb.Buddy.DisplayName
                } : null
            });

            return Ok(studyBuddyDtos);
        }

        // GET: api/StudyBuddy/course/5
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetStudyBuddyForCourse(int courseId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var studyBuddy = await _studyBuddyRepo.GetByUserAndCourseAsync(userId, courseId);
            if (studyBuddy == null)
            {
                return Ok(new StudyBuddyDto
                {
                    CourseId = courseId,
                    IsOptedIn = false
                });
            }

            var studyBuddyDto = new StudyBuddyDto
            {
                Id = studyBuddy.Id,
                CourseId = studyBuddy.CourseId,
                CourseName = studyBuddy.Course.Name,
                IsOptedIn = studyBuddy.IsOptedIn,
                MatchedAt = studyBuddy.MatchedAt,
                ContactPreference = studyBuddy.ContactPreference,
                Buddy = studyBuddy.Buddy != null ? new StudyBuddyUserDto
                {
                    Id = studyBuddy.Buddy.Id,
                    Username = studyBuddy.Buddy.Username,
                    DisplayName = studyBuddy.Buddy.DisplayName
                } : null
            };

            return Ok(studyBuddyDto);
        }

        // POST: api/StudyBuddy/opt-in
        [HttpPost("opt-in")]
        public async Task<IActionResult> OptIn([FromBody] OptInStudyBuddyDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            try
            {
                var studyBuddy = await _studyBuddyRepo.OptInAsync(userId, request.CourseId, request.ContactPreference);

                var studyBuddyDto = new StudyBuddyDto
                {
                    Id = studyBuddy.Id,
                    CourseId = studyBuddy.CourseId,
                    CourseName = studyBuddy.Course?.Name ?? "",
                    IsOptedIn = studyBuddy.IsOptedIn,
                    MatchedAt = studyBuddy.MatchedAt,
                    ContactPreference = studyBuddy.ContactPreference,
                    Buddy = studyBuddy.Buddy != null ? new StudyBuddyUserDto
                    {
                        Id = studyBuddy.Buddy.Id,
                        Username = studyBuddy.Buddy.Username,
                        DisplayName = studyBuddy.Buddy.DisplayName
                    } : null
                };

                return Ok(studyBuddyDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/StudyBuddy/opt-out
        [HttpPost("opt-out")]
        public async Task<IActionResult> OptOut([FromBody] OptInStudyBuddyDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var success = await _studyBuddyRepo.OptOutAsync(userId, request.CourseId);
            if (!success)
            {
                return NotFound("Study buddy record not found");
            }

            return Ok(new { message = "Successfully opted out of study buddy program" });
        }

        // POST: api/StudyBuddy/remove-match
        [HttpPost("remove-match")]
        public async Task<IActionResult> RemoveMatch([FromBody] OptInStudyBuddyDto request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var success = await _studyBuddyRepo.RemoveMatchAsync(userId, request.CourseId);
            if (!success)
            {
                return NotFound("Study buddy match not found");
            }

            return Ok(new { message = "Study buddy connection removed successfully" });
        }
    }
}
