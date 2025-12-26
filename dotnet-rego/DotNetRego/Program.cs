using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Xml.Schema;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI / Swagger
builder.Services.AddOpenApi();

// SignalR
builder.Services.AddSignalR();

// background service
builder.Services.AddSingleton<ExpiredCarStore>();
builder.Services.AddHostedService<CarExpirationChecker>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .WithMethods("GET","POST")
            .AllowCredentials();
    });
});

var app = builder.Build();

// app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//cars, with optional ?make= query
app.MapGet("/cars", async (string? make) =>
    {
        var filePath = Path.Combine(AppContext.BaseDirectory, "someCars.json");

        if (!File.Exists(filePath))
            return Results.NotFound(new { message = "Data file not found" });

        var json = await File.ReadAllTextAsync(filePath);
        var cars = JsonSerializer.Deserialize<List<Car>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<Car>();

        if (!string.IsNullOrWhiteSpace(make))
        {
            cars = cars.Where(c => string.Equals(c.Make, make, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return Results.Ok(cars);
    })
    .WithName("GetCars");

// expired cars
app.MapGet("/cars/expired", (ExpiredCarStore store) =>
{
    return store.GetAllExpiredCars();
})
.WithName("GetExpiredCars");



// SignalR hub endpoint
app.MapHub<CarHub>("/hubs/cars");

app.Run();

// ==================
// Background service
// ==================

class CarExpirationChecker : BackgroundService
{
    private readonly IHubContext<CarHub> _hubContext;
    private readonly ExpiredCarStore _expiredCarStore;

    // tracks cars with previous expiration events
    private readonly HashSet<string> _expiredCarIds = new();

    public CarExpirationChecker(IHubContext<CarHub> hubContext, ExpiredCarStore expiredCarStore)
    {
        _hubContext = hubContext;
        _expiredCarStore = expiredCarStore;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

            var filePath = Path.Combine(AppContext.BaseDirectory, "someCars.json");

            if (!File.Exists(filePath))
                continue;

            var json = await File.ReadAllTextAsync(filePath, stoppingToken);

            var cars = JsonSerializer.Deserialize<List<Car>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<Car>();

            var now = DateTime.UtcNow;

            var newlyExpiredCars = cars
                .Where(c => c.ValidTill < now)
                .Where(c => !_expiredCarIds.Contains(c.Id));

            foreach (var expiredCar in newlyExpiredCars)
            {
                await _hubContext.Clients.All.SendAsync(
                    "CarExpired",
                    expiredCar,
                    cancellationToken: stoppingToken
                );

                _expiredCarIds.Add(expiredCar.Id);
                _expiredCarStore.Add(expiredCar);
            }
        }
    }
}

// store expired cars
class ExpiredCarStore
{
    private readonly ConcurrentBag<Car> _expiredCars = new();

    public void Add(Car car)
    {
        _expiredCars.Add(car);
    }

    public List<Car> GetAllExpiredCars()
    {
        return _expiredCars.ToList();
    }
}

// ===========
// SignalR hub
// ===========

class CarHub : Hub
{
}

// ==========
// Data model
// ==========

record Car(
    string Id,
    string Color,
    string Make,
    string Model,
    DateTime ValidTill
);


// don't use this, it's here for posterity
// replaced by /cars?make=...
//
// // Endpoint: filter by make
// app.MapGet("/cars/make/{userquery}", async (string userquery) =>
// {
//     var filePath = Path.Combine(AppContext.BaseDirectory, "someCars.json");
//
//     var json = await File.ReadAllTextAsync(filePath);
//
//     var cars = JsonSerializer.Deserialize<List<Car>>(json, new JsonSerializerOptions
//     {
//         PropertyNameCaseInsensitive = true
//     }) ?? new List<Car>();
//
//     var filtered = cars.Where(c => string.Equals(c.Make, userquery, StringComparison.OrdinalIgnoreCase)).ToList();
//
//     return filtered;
// })
// .WithName("GetCarsByMake");
