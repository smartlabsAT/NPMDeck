import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useDrawerForm from '../useDrawerForm'

interface TestForm {
  name: string
  email: string
  count: number
}

const initialData: TestForm = { name: '', email: '', count: 0 }

describe('useDrawerForm — initial state', () => {
  it('initializes with provided initial data', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    expect(result.current.data).toEqual(initialData)
  })

  it('starts not dirty and not loading', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    expect(result.current.isDirty).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('starts with empty errors and touched objects', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('starts with hasSubmitted=false', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    expect(result.current.hasSubmitted).toBe(false)
  })
})

describe('useDrawerForm — setFieldValue', () => {
  it('updates the field value', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => result.current.setFieldValue('name', 'Test'))
    expect(result.current.data.name).toBe('Test')
  })

  it('marks form as dirty', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => result.current.setFieldValue('name', 'Test'))
    expect(result.current.isDirty).toBe(true)
  })

  it('marks field as touched', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => result.current.setFieldValue('name', 'Test'))
    expect(result.current.touched.name).toBe(true)
  })
})

describe('useDrawerForm — validation', () => {
  it('validates required fields on submit and blocks submission', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({
        initialData,
        fields: { name: { initialValue: '', required: true } },
        onSubmit,
      }),
    )
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.name).toBeTruthy()
  })

  it('submits when validation passes', async () => {
    const onSubmit = vi.fn()
    const validData: TestForm = { name: 'Test', email: '', count: 0 }
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({
        initialData: validData,
        fields: { name: { initialValue: '', required: true } },
        onSubmit,
      }),
    )
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(onSubmit).toHaveBeenCalledWith(validData)
  })

  it('runs custom validate on field', async () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({
        initialData,
        fields: {
          email: {
            initialValue: '',
            validate: (v: string) => (v.includes('@') ? null : 'Invalid email'),
          },
        },
        onSubmit: vi.fn(),
      }),
    )
    await act(async () => {
      await result.current.handleSubmit()
    })
    expect(result.current.errors.email).toBe('Invalid email')
  })
})

describe('useDrawerForm — getFieldProps', () => {
  it('returns value, onChange, onBlur, error, helperText, disabled, name', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    const props = result.current.getFieldProps('name')
    expect(props.name).toBe('name')
    expect(props.value).toBe('')
    expect(typeof props.onChange).toBe('function')
    expect(typeof props.onBlur).toBe('function')
    expect(props.disabled).toBe(false)
  })

  it('onChange updates field value', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => {
      result.current.getFieldProps('name').onChange({
        target: { value: 'New', type: 'text' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    })
    expect(result.current.data.name).toBe('New')
  })
})

describe('useDrawerForm — reset and clean', () => {
  it('resetForm restores initial data', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => result.current.setFieldValue('name', 'Changed'))
    act(() => result.current.resetForm())
    expect(result.current.data.name).toBe('')
    expect(result.current.isDirty).toBe(false)
  })

  it('markAsClean clears isDirty without reverting data', () => {
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({ initialData, onSubmit: vi.fn() }),
    )
    act(() => result.current.setFieldValue('name', 'Kept'))
    act(() => result.current.markAsClean())
    expect(result.current.data.name).toBe('Kept')
    expect(result.current.isDirty).toBe(false)
  })
})

describe('useDrawerForm — error handling', () => {
  it('sets globalError when onSubmit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({
        initialData: { name: 'a', email: '', count: 0 },
        onSubmit,
      }),
    )
    await act(async () => {
      await result.current.handleSubmit()
    })
    await waitFor(() => {
      expect(result.current.globalError).toBeTruthy()
    })
  })

  it('calls onError callback when submission fails', async () => {
    const onError = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() =>
      useDrawerForm<TestForm>({
        initialData: { name: 'a', email: '', count: 0 },
        onSubmit,
        onError,
      }),
    )
    await act(async () => {
      await result.current.handleSubmit()
    })
    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
