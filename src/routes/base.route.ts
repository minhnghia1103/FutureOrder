import { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected constructor() {
    this.router = Router();
  }

  public getRouter() {
    return this.router;
  }
}