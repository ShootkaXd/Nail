import { AlertTriangle } from 'lucide-react'
import { useConfirmStore } from '../../store/confirm.store'
import Modal from './Modal'
import Button from './Button'

// Mounted once at the app root; renders whatever confirmDialog() last asked for.
export default function ConfirmDialogHost() {
  const { open, message, settle } = useConfirmStore()

  return (
    <Modal open={open} onClose={() => settle(false)} size="sm">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-gray-800 font-medium mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => settle(false)}>Отмена</Button>
          <Button variant="danger" onClick={() => settle(true)}>Удалить</Button>
        </div>
      </div>
    </Modal>
  )
}
