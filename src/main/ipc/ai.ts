import { ipcMain } from 'electron'
import { getSubscriptions, addSubscription, removeSubscription } from '../services/settings'
import type { Subscription } from '../../shared/types'

export function registerAiHandlers(): void {
  ipcMain.handle('ai:getSubscriptions', (): Subscription[] => {
    return getSubscriptions()
  })

  ipcMain.handle('ai:addSubscription', (_, sub: Subscription): Promise<void> => {
    return addSubscription(sub)
  })

  ipcMain.handle('ai:removeSubscription', (_, id: string): Promise<void> => {
    return removeSubscription(id)
  })
}
