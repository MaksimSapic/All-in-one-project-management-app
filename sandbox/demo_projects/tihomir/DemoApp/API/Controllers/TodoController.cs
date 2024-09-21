using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodoController : ControllerBase
{
    private readonly TodoContext _context;

    public TodoController(TodoContext context)
    {
        _context = context;
    }

    // GET: api/Todo
    [HttpGet]
    public async Task<IEnumerable<TodoItem>> GetTodoItems()
    {
        return await _context.TodoItems.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<TodoItem> GetTodoItem(int id)
    {
        return await _context.TodoItems.FindAsync(id);
    }


    // // POST: api/Todo
    [HttpPost]
    public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem item)
    {
        _context.TodoItems.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTodoItem), new { id = item.Id }, item);
    }

    // PUT: api/Todo/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTodoItem(int id, TodoItem item)
    {
        if (id != item.Id)
        {
            return BadRequest();
        }

        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Todo/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTodoItem(int id)
    {
        var todoItem = await _context.TodoItems.FindAsync(id);

        if (todoItem == null)
        {
            return NotFound();
        }

        _context.TodoItems.Remove(todoItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}