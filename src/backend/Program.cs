using backend.Extensions;
using backend.Interfaces;
using backend.Services;
using backend.SignalR;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);
builder.Services.AddSignalR();
builder.Services.AddTransient<IEmailSender,EmailService>();

var app = builder.Build();

var allowedOrigins = new[] {"http://localhost:4200","http://softeng.pmf.kg.ac.rs:10101","https://localhost:4200","https://softeng.pmf.kg.ac.rs:10101"};
app.UseCors(builder => builder
.SetIsOriginAllowed(origin => allowedOrigins.Contains(origin) || origin.StartsWith("http://localhost:"))
.AllowAnyHeader()
.AllowAnyMethod()
.AllowCredentials());

app.UseAuthentication();
app.UseAuthorization();

// za koriscenje statickih fajlova
// app.UseDefaultFiles();
// app.UseStaticFiles();
// za koriscenje statickih fajlova

app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");

// za koriscenje statickih fajlova
// app.MapFallbackToController("Index", "Fallback");

app.Run();
