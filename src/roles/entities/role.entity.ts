import { Entity, Property } from "@mikro-orm/core";


export enum RoleProjection {
  
}

export const SUMMARY_PROJECTION: RoleProjection[] = [];

export const DEFAULT_PROJECTION: RoleProjection[] = [
 
];

@Entity({tableName:'roles'})
export class Role {
    @Property({ type: 'uuid', primary: true })
    id: string;
    @Property({ type: 'string' })
    name: string;
    @Property({ type: 'string' })
    description: string;
    @Property({ type: 'boolean', default: false })
    isDefault: boolean;
    @Property({ type: 'boolean', default: false })
    isActive: boolean;
    @Property({ type: 'boolean', default: false })
    isDeleted: boolean;
   @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
