import { useForm } from 'react-hook-form'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface ContactForm {
  name: string
  phone: string
  email: string
  notes: string
}

interface Props {
  contact: ContactForm | null
  onSubmit: (data: ContactForm) => void
  onBack: () => void
}

export default function Step4Contact({ contact, onSubmit, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>({
    defaultValues: contact ?? { name: '', phone: '', email: '', notes: '' },
  })

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Назад</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Ваши контакты</h2>
      <p className="text-gray-500 mb-6">Укажите данные для подтверждения записи</p>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <Input
          label="Ваше имя *"
          placeholder="Анна Иванова"
          {...register('name', { required: 'Введите имя' })}
          error={errors.name?.message}
        />
        <Input
          label="Телефон *"
          placeholder="+7 900 000 0000"
          type="tel"
          {...register('phone', { required: 'Введите телефон' })}
          error={errors.phone?.message}
        />
        <Input
          label="Email *"
          placeholder="example@mail.ru"
          type="email"
          {...register('email', {
            required: 'Введите email',
            pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Неверный формат email' },
          })}
          error={errors.email?.message}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Пожелания (необязательно)</label>
          <textarea
            {...register('notes')}
            placeholder="Любые пожелания или уточнения..."
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onBack}>← Назад</Button>
          <Button type="submit">Далее →</Button>
        </div>
      </form>
    </div>
  )
}
