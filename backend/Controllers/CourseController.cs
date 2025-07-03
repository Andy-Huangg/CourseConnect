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
            return Ok(courses);
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
            return Ok(course);
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
                return Ok(existingCourse); // Return existing course instead of error
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
            return Ok(course);
        }
    }

    public class CreateCourseRequest
    {
        public required string Name { get; set; }
    }
}
