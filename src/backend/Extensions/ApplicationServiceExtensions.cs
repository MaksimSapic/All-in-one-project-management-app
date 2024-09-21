using backend.Data;
using backend.Interfaces;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Extensions
{
    public static class ApplicationServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
        {
            services.AddDbContext<DataContext>(opt =>
            {
                opt.UseSqlite(config.GetConnectionString("DefaultConnection"));
            });
            services.AddCors();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPhotoService, PhotoService>();
            services.AddScoped<IUploadService, UploadService>();
            services.AddScoped<INotificationService,NotificationService>();
            services.AddSignalR();
            return services;
        }
    }
}