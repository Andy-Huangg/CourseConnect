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
            builder.Configuration.AddUserSecrets<Program>();
            // Add services to the container.
            builder.Services.AddControllers();


            // Configure DbContext before building the app
            var connectionString = builder.Configuration.GetConnectionString("AzureSqlConnection");
            Console.WriteLine(connectionString);
            if (builder.Environment.IsDevelopment())
            {
                builder.Services.AddDbContext<StudentContext>(options =>
                    // options.UseInMemoryDatabase("Student"));
                    options.UseSqlServer(connectionString));
            }
            else
            {
                builder.Services.AddDbContext<StudentContext>(options =>
                    // options.UseInMemoryDatabase("Student"));
                    options.UseSqlServer(connectionString));
            }

            builder.Services.AddScoped<IStudentRepository, StudentRepository>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowLocalhost",
                    policy =>
                    {
                        policy.WithOrigins("http://localhost:5173")
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    });
            });


            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            app.UseCors("AllowLocalhost");

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
