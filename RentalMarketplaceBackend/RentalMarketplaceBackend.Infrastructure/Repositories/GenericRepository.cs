using Microsoft.EntityFrameworkCore;
using RentalMarketplaceBackend.Application.Interfaces.Repositories;
using RentalMarketplaceBackend.Infrastructure.Persistence;

namespace RentalMarketplaceBackend.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public GenericRepository (AppDbContext context){
            _context = context;
            _dbSet = context.Set<T>();
            
        }

        public async Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);
        public async Task<IReadOnlyList<T>> GetAllAsync() => await _dbSet.AsNoTracking().ToListAsync();
        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);
        public void Update(T entity) =>  _dbSet.Update(entity);
        public void Delete(T entity) =>  _dbSet.Remove(entity);
    }

}
