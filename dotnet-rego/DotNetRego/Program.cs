using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/cars", async () =>
    {
        // Resolve path to the JSON file at runtime
        var filePath = Path.Combine(AppContext.BaseDirectory, "someCars.json");

        // Read file contents
        var json = await File.ReadAllTextAsync(filePath);

        // Deserialize JSON into strongly-typed objects
        var cars = JsonSerializer.Deserialize<List<Car>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return cars;
    })
    .WithName("GetCars");

app.Run();

record Car(
    string Id,
    string Color,
    string Make,
    string Model,
    DateTime ValidTill
);