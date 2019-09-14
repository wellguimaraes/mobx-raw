import { action, computed, observable } from 'mobx'
import { trackedAction } from 'mobx-async'

class StoreItem {
  private readonly _value: any
  private readonly _decorator: (arg1: any, arg2: string, arg3: any) => any

  constructor(
    value: any, decorator: (arg1: any, arg2: string, arg3: any) => any) {
    this._value = value
    this._decorator = decorator
  }

  get value() {
    return this._value
  }

  get decorator() {
    return this._decorator
  }
}

function getShape<T>(definitions: T): any {
  return Object.keys(definitions as any).reduce((_shape, key) => {
    const itemDefinition = (definitions as any)[key]

    if (itemDefinition instanceof StoreItem) {
      if (itemDefinition.decorator === computed) {
        Object.defineProperty(_shape, key, {
          get: itemDefinition.value,
          enumerable: true,
        })
      } else {
        _shape[key] = itemDefinition.value
      }
    } else {
      _shape[key] = itemDefinition
    }

    return _shape
  }, {} as any)
}

function getDecoration<T>(definitions: T): any {
  return Object.keys(definitions as any)
    .reduce((_deco, key) => {
      if ((definitions as any)[key] instanceof StoreItem) {
        _deco[key] = (definitions as any)[key].decorator
      }

      return _deco
    }, {} as any)
}

export function createStore<T>(definitions: T, storeDidCreate: () => void): T {
  const decoration = getDecoration(definitions)
  const shape = getShape(definitions)

  if (typeof storeDidCreate === 'function') {
    shape.storeDidCreate = storeDidCreate
  }

  const store = observable(shape as T, decoration)

  if (typeof storeDidCreate === 'function') {
    store.storeDidCreate()
  }

  return store
}

export function toDecorator(decorator: (arg1: any, arg2: string, arg3: any) => any) {
  return <T extends Function>(fn: T): T => new StoreItem(fn, decorator) as any as T
}

export const toComputed = toDecorator(computed)
export const toTrackedAction = toDecorator(trackedAction)
export const toAction = toDecorator(action)