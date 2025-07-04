using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CourseController : ControllerBase
    {
        private readonly ICourseRepository _courseRepo;

        public CourseController(ICourseRepository courseRepo)
        {
            _courseRepo = courseRepo;
        }

        // GET: api/Course
        [HttpGet]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _courseRepo.GetAllAsync();
            var courseDtos = courses.Select(c => new CourseDto { Id = c.Id, Name = c.Name });
            return Ok(courseDtos);
        }

        // GET: api/Course/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCourse(int id)
        {
            var course = await _courseRepo.GetByIdAsync(id);
            if (course == null)
            {
                return NotFound();
            }
            var courseDto = new CourseDto { Id = course.Id, Name = course.Name };
            return Ok(courseDto);
        }

        // POST: api/Course
        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Course name is required");
            }

            // Check if course already exists (normalized comparison)
            if (await _courseRepo.CourseExistsAsync(request.Name))
            {
                var existingCourse = await _courseRepo.GetByNameAsync(request.Name);
                return Conflict(new
                {
                    message = $"Course '{existingCourse?.Name}' already exists",
                    existingCourse = existingCourse
                });
            }

            var course = await _courseRepo.CreateCourseAsync(request.Name);
            return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, course);
        }

        // GET: api/Course/by-name/{name}
        [HttpGet("by-name/{name}")]
        public async Task<IActionResult> GetCourseByName(string name)
        {
            var course = await _courseRepo.GetByNameAsync(name);
            if (course == null)
            {
                return NotFound();
            }
            var courseDto = new CourseDto { Id = course.Id, Name = course.Name };
            return Ok(courseDto);
        }

        // GET: api/Course/my-courses
        [HttpGet("my-courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var courses = await _courseRepo.GetCoursesByUserIdAsync(userId);
            var courseDtos = courses.Select(c => new CourseDto { Id = c.Id, Name = c.Name });
            return Ok(courseDtos);
        }

        // POST: api/Course/5/enroll
        [HttpPost("{courseId}/enroll")]
        public async Task<IActionResult> EnrollInCourse(int courseId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            var success = await _courseRepo.EnrollUserAsync(userId, courseId);
            if (!success)
            {
                return BadRequest("Failed to enroll in course");
            }

            return Ok(new { message = $"Successfully enrolled in {course.Name}" });
        }

        // DELETE: api/Course/5/enroll
        [HttpDelete("{courseId}/enroll")]
        public async Task<IActionResult> UnenrollFromCourse(int courseId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var course = await _courseRepo.GetByIdAsync(courseId);
            if (course == null)
            {
                return NotFound("Course not found");
            }

            var success = await _courseRepo.UnenrollUserAsync(userId, courseId);
            if (!success)
            {
                return BadRequest("Failed to unenroll from course");
            }

            return Ok(new { message = $"Successfully unenrolled from {course.Name}" });
        }

        // GET: api/Course/5/enrollment-status
        [HttpGet("{courseId}/enrollment-status")]
        public async Task<IActionResult> GetEnrollmentStatus(int courseId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            var isEnrolled = await _courseRepo.IsUserEnrolledAsync(userId, courseId);
            return Ok(new { isEnrolled });
        }
    }

    public class CreateCourseRequest
    {
        public required string Name { get; set; }
    }
}
