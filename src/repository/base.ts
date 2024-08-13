import { Model, ModelCtor } from 'sequelize-typescript';

export class BaseRepository<T extends Model> {
  protected model: ModelCtor<T>;

  constructor(model: ModelCtor<T>) {
    this.model = model;
  }

  async findAll(): Promise<T[]> {
    return this.model.findAll<T>();
  }

  async findById(id: number): Promise<T | null> {
    return this.model.findByPk<T>(id);
  }

  async create(entity: Partial<T['_creationAttributes']>): Promise<T> {
    return this.model.create<T>(entity as any); 
  }

  async update(id: number, entity: Partial<T>): Promise<T | null> {
    const result = await this.model.update(entity, { where: { id: id as any } }); 
    return result ? this.findById(id) : null;
  }

  async delete(id: number): Promise<number> {
    const result = await this.model.destroy({ where: { id: id as any } }); 
    return result;
  }
  async findAllByUserId(userId: number): Promise<T[]> {
    return this.model.findAll<T>({ where: { userId:userId as any } });
  }

  async deleteByUser(userId: number,id: number): Promise<number> {
    const result = await this.model.destroy({ where: { userId: userId as any,id: id as any } }); 
    return result;
  }

  async createByUser(userId: number,entity: Partial<T['_creationAttributes']>): Promise<T> {
    return this.model.create<T>({...entity,userId:userId as any} as any); 
  }
}
