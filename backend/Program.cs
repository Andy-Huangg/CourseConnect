using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Repositories;

namespace backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            // Add services to the container.
            builder.Services.AddControllers();


            // Configure DbContext before building the app
            if (builder.Environment.IsDevelopment())
            {
                builder.Services.AddDbContext<StudentContext>(options =>
                    options.UseInMemoryDatabase("Student"));
            }
            else
            {
                Console.WriteLine("Production");
            }

            builder.Services.AddScoped<IStudentRepository, StudentRepository>();


            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();

            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
