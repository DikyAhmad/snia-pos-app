import { defineStore } from 'pinia'

export const useAdminPanelStore = defineStore('adminPanel', {
  state: () => ({
    show: false
  }),
  actions: {
    showPanel() {
      this.show = true
    },
    hidePanel() {
      this.show = false
    }
  }
})
