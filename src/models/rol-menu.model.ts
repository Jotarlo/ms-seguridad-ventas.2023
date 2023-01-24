import {Entity, model, property} from '@loopback/repository';

@model()
export class RolMenu extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({
    type: 'boolean',
    required: true,
  })
  guardar: boolean;

  @property({
    type: 'boolean',
    required: true,
  })
  editar: boolean;

  @property({
    type: 'boolean',
    required: true,
  })
  listar: boolean;

  @property({
    type: 'boolean',
    required: true,
  })
  eliminar: boolean;

  @property({
    type: 'boolean',
    required: true,
  })
  descargar: boolean;


  constructor(data?: Partial<RolMenu>) {
    super(data);
  }
}

export interface RolMenuRelations {
  // describe navigational properties here
}

export type RolMenuWithRelations = RolMenu & RolMenuRelations;
